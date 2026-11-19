import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import multer from "multer";
import helmet from "helmet";
import { fileTypeFromBuffer } from "file-type";
import { PrismaClient } from "../generated/client/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { z } from "zod";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const app = express();
const port = Number(process.env.PORT || 3001);
const secret = process.env.SESSION_SECRET || "";
const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
const adminPasswordHash =
  process.env.ADMIN_PASSWORD_HASH ||
  (process.env.ADMIN_PASSWORD
    ? bcrypt.hashSync(process.env.ADMIN_PASSWORD, 12)
    : "");
const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

if (secret.length < 32 || !adminEmail || !adminPasswordHash) {
  throw new Error(
    "Configurá ADMIN_EMAIL, ADMIN_PASSWORD_HASH (o ADMIN_PASSWORD) y SESSION_SECRET en el entorno.",
  );
}

app.disable("x-powered-by");
app.set("trust proxy", process.env.NODE_ENV === "production" ? 1 : false);
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        frameSrc: ["https://www.openstreetmap.org"],
        upgradeInsecureRequests:
          process.env.NODE_ENV === "production" ? [] : null,
      },
    },
  }),
);
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

function session(req) {
  try {
    const token = req.cookies.saul_admin;
    return token ? jwt.verify(token, secret, { algorithms: ["HS256"] }) : null;
  } catch {
    return null;
  }
}
function requireAdmin(req, res, next) {
  if (!session(req))
    return res.status(401).json({ error: "Iniciá sesión para continuar." });
  next();
}
function sameOrigin(req, res, next) {
  const origin = req.get("origin");
  if (!origin) return next();
  try {
    const host = new URL(origin).hostname;
    if (
      host === req.hostname ||
      (process.env.NODE_ENV !== "production" && host === "localhost")
    )
      return next();
  } catch {}
  return res.status(403).json({ error: "Origen no permitido." });
}
app.use("/api", (req, res, next) => {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method))
    return sameOrigin(req, res, next);
  next();
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 12,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});
const subscribeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 8,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
const productSchema = z.object({
  stockId: z.string().trim().min(2).max(40),
  brand: z.string().trim().min(1).max(80),
  model: z.string().trim().min(1).max(180),
  year: z.string().trim().max(20).default(""),
  color: z.string().trim().max(100).default(""),
  serial: z.string().trim().max(100).default(""),
  cost: z.string().trim().max(100).default(""),
  salePrice: z.string().trim().max(100).default(""),
  closePrice: z.string().trim().max(100).default(""),
  profit: z.string().trim().max(100).default(""),
  category: z.enum([
    "electricas",
    "acusticas",
    "amplificadores",
    "pedales",
    "bajos",
    "merch",
  ]),
  description: z.string().trim().max(10000).default(""),
  specs: z.array(z.string().trim().min(1).max(300)).max(40).default([]),
  status: z.enum(["published", "draft", "archived"]).default("published"),
});
const includeImages = { images: { orderBy: { sortOrder: "asc" } } };
function presentProduct(product, isAdmin = false) {
  const { images, serial, cost, salePrice, closePrice, profit, ...fields } =
    product;
  return {
    ...fields,
    ...(isAdmin ? { serial, cost, salePrice, closePrice, profit } : {}),
    images: images.map((image) => ({
      id: image.id,
      src: image.path || `/api/images/${image.id}`,
      sortOrder: image.sortOrder,
    })),
  };
}
function errorResponse(res, error) {
  if (error instanceof z.ZodError)
    return res.status(400).json({
      error: "Revisá los datos del formulario.",
      details: error.flatten(),
    });
  if (error.code === "P2002")
    return res.status(409).json({ error: "Ese código de stock ya existe." });
  if (error.code === "P2025")
    return res.status(404).json({ error: "Producto no encontrado." });
  console.error(error);
  return res.status(500).json({ error: "Ocurrió un error. Probá de nuevo." });
}
const route = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch((error) =>
    errorResponse(res, error),
  );

app.get(
  "/api/health",
  route(async (_req, res) => {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true });
  }),
);
app.get(
  "/api/config",
  route(async (_req, res) => {
    const setting = await prisma.setting.findUnique({
      where: { key: "whatsappNumber" },
    });
    res.json({
      whatsappNumber: setting?.value || process.env.WHATSAPP_NUMBER || "",
      email: "guitarssaul@gmail.com",
      instagram: "https://www.instagram.com/saulguitars/",
    });
  }),
);
app.get(
  "/api/products",
  route(async (_req, res) => {
    const products = await prisma.product.findMany({
      where: { status: "published" },
      include: includeImages,
      orderBy: [{ sortOrder: "asc" }, { stockId: "asc" }],
    });
    res.json(products.map((product) => presentProduct(product)));
  }),
);
app.get(
  "/api/products/:stockId",
  route(async (req, res) => {
    const product = await prisma.product.findUnique({
      where: { stockId: req.params.stockId },
      include: includeImages,
    });
    if (!product || product.status !== "published")
      return res.status(404).json({ error: "Producto no encontrado." });
    res.json(presentProduct(product));
  }),
);
app.get(
  "/api/images/:id",
  route(async (req, res) => {
    const image = await prisma.productImage.findUnique({
      where: { id: req.params.id },
      include: { product: { select: { status: true } } },
    });
    if (
      !image ||
      !image.data ||
      (image.product.status !== "published" && !session(req))
    )
      return res.status(404).end();
    res.set("Content-Type", image.mimeType);
    res.set("Cache-Control", "public, max-age=86400");
    res.send(Buffer.from(image.data));
  }),
);
app.post(
  "/api/subscribers",
  subscribeLimiter,
  route(async (req, res) => {
    const { email } = z
      .object({ email: z.string().trim().email().max(254) })
      .parse(req.body);
    await prisma.subscriber.upsert({
      where: { email: email.toLowerCase() },
      create: { email: email.toLowerCase() },
      update: {},
    });
    res.status(201).json({ message: "Te anotamos para recibir novedades." });
  }),
);

app.post(
  "/api/auth/login",
  loginLimiter,
  route(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    const valid =
      email.trim().toLowerCase() === adminEmail &&
      (await bcrypt.compare(password, adminPasswordHash));
    if (!valid)
      return res
        .status(401)
        .json({ error: "Correo o contraseña incorrectos." });
    const token = jwt.sign({ sub: adminEmail, role: "admin" }, secret, {
      algorithm: "HS256",
      expiresIn: "12h",
    });
    res.cookie("saul_admin", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 12 * 60 * 60 * 1000,
      path: "/",
    });
    res.json({ email: adminEmail });
  }),
);
app.get("/api/auth/me", requireAdmin, (_req, res) =>
  res.json({ email: adminEmail }),
);
app.post("/api/auth/logout", requireAdmin, (_req, res) => {
  res.clearCookie("saul_admin", { path: "/" });
  res.json({ ok: true });
});

app.get(
  "/api/admin/products",
  requireAdmin,
  route(async (_req, res) => {
    const products = await prisma.product.findMany({
      include: includeImages,
      orderBy: [{ sortOrder: "asc" }, { stockId: "asc" }],
    });
    res.json(products.map((product) => presentProduct(product, true)));
  }),
);
app.post(
  "/api/admin/products",
  requireAdmin,
  route(async (req, res) => {
    const input = productSchema.parse(req.body);
    const product = await prisma.product.create({
      data: {
        ...input,
        sortOrder: await prisma.product.count(),
        specs: input.specs,
      },
      include: includeImages,
    });
    res.status(201).json(presentProduct(product, true));
  }),
);
app.put(
  "/api/admin/products/:id",
  requireAdmin,
  route(async (req, res) => {
    const input = productSchema.parse(req.body);
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: { ...input, specs: input.specs },
      include: includeImages,
    });
    res.json(presentProduct(product, true));
  }),
);
app.delete(
  "/api/admin/products/:id",
  requireAdmin,
  route(async (req, res) => {
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: { status: "archived" },
      include: includeImages,
    });
    res.json(presentProduct(product, true));
  }),
);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 8 },
  fileFilter: (_req, file, callback) =>
    callback(
      null,
      ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype),
    ),
});
app.post(
  "/api/admin/products/:id/images",
  requireAdmin,
  upload.array("images", 8),
  route(async (req, res) => {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { images: true },
    });
    if (!product)
      return res.status(404).json({ error: "Producto no encontrado." });
    if (!req.files?.length)
      return res
        .status(400)
        .json({ error: "Seleccioná fotos JPG, PNG o WebP." });
    const checked = await Promise.all(
      req.files.map(async (file) => {
        const signature = await fileTypeFromBuffer(file.buffer);
        if (
          !signature ||
          !["image/jpeg", "image/png", "image/webp"].includes(signature.mime)
        )
          return null;
        return { file, mimeType: signature.mime };
      }),
    );
    if (checked.some((item) => !item))
      return res
        .status(400)
        .json({ error: "Una foto no tiene un formato de imagen válido." });
    const start = product.images.length;
    await prisma.$transaction(
      checked.map(({ file, mimeType }, index) =>
        prisma.productImage.create({
          data: {
            productId: product.id,
            data: file.buffer,
            mimeType,
            sortOrder: start + index,
          },
        }),
      ),
    );
    const updated = await prisma.product.findUnique({
      where: { id: product.id },
      include: includeImages,
    });
    res.status(201).json(presentProduct(updated, true));
  }),
);
app.delete(
  "/api/admin/images/:id",
  requireAdmin,
  route(async (req, res) => {
    await prisma.productImage.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  }),
);
app.get(
  "/api/admin/settings",
  requireAdmin,
  route(async (_req, res) => {
    const whatsapp = await prisma.setting.findUnique({
      where: { key: "whatsappNumber" },
    });
    res.json({
      whatsappNumber: whatsapp?.value || process.env.WHATSAPP_NUMBER || "",
    });
  }),
);
app.put(
  "/api/admin/settings",
  requireAdmin,
  route(async (req, res) => {
    const { whatsappNumber } = z
      .object({ whatsappNumber: z.string().regex(/^\d{0,20}$/) })
      .parse(req.body);
    await prisma.setting.upsert({
      where: { key: "whatsappNumber" },
      create: { key: "whatsappNumber", value: whatsappNumber },
      update: { value: whatsappNumber },
    });
    res.json({ whatsappNumber });
  }),
);
app.get(
  "/api/admin/subscribers",
  requireAdmin,
  route(async (_req, res) => {
    const subscribers = await prisma.subscriber.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(subscribers);
  }),
);

const dist = path.join(root, "client/dist");
if (fs.existsSync(dist)) {
  app.use(express.static(dist, { index: false }));
  app.get("*", (req, res) => res.sendFile(path.join(dist, "index.html")));
}
app.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError)
    return res.status(400).json({
      error: "La foto excede el límite de 8 MB o hay demasiadas fotos.",
    });
  errorResponse(res, error);
});

app.listen(port, () =>
  console.log(`Saúl Guitars API en http://localhost:${port}`),
);
