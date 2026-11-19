import "dotenv/config";
import { PrismaClient } from "../generated/client/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const catalog = JSON.parse(
  fs.readFileSync(path.join(root, "data/catalog.json"), "utf8"),
);
const privateSerialsPath = path.join(root, ".private/stock-serials.json");
const serials = process.env.STOCK_SERIALS_JSON
  ? JSON.parse(process.env.STOCK_SERIALS_JSON)
  : fs.existsSync(privateSerialsPath)
    ? JSON.parse(fs.readFileSync(privateSerialsPath, "utf8"))
    : {};
const privateFinancialsPath = path.join(root, ".private/stock-financials.json");
const financials = process.env.STOCK_FINANCIALS_JSON
  ? JSON.parse(process.env.STOCK_FINANCIALS_JSON)
  : fs.existsSync(privateFinancialsPath)
    ? JSON.parse(fs.readFileSync(privateFinancialsPath, "utf8"))
    : {};

try {
  for (const [index, item] of catalog.entries()) {
    const existing = await prisma.product.findUnique({
      where: { stockId: item.stockId },
    });
    const internal = financials[item.stockId] || {};
    if (existing) {
      if (process.argv.includes("--fill-internal")) {
        await prisma.product.update({
          where: { id: existing.id },
          data: {
            serial: serials[item.stockId] || "",
            cost: internal.cost || "",
            salePrice: internal.salePrice || "",
            closePrice: internal.closePrice || "",
            profit: internal.profit || "",
          },
        });
      }
      continue;
    }
    await prisma.product.create({
      data: {
        stockId: item.stockId,
        brand: item.brand,
        model: item.model,
        year: item.year || "",
        color: item.color || "",
        serial: serials[item.stockId] || "",
        cost: internal.cost || "",
        salePrice: internal.salePrice || "",
        closePrice: internal.closePrice || "",
        profit: internal.profit || "",
        category: item.category,
        description: item.description || "",
        specs: item.specs,
        sortOrder: index,
        images: {
          create: item.photos.map((photo, imageIndex) => ({
            path: photo,
            sortOrder: imageIndex,
          })),
        },
      },
    });
  }
  console.log(`Catálogo listo: ${await prisma.product.count()} productos.`);
} finally {
  await prisma.$disconnect();
}
