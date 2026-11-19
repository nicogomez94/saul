import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { PrismaClient } from "../generated/client/index.js";
import { PrismaPg } from "@prisma/adapter-pg";

const base = process.env.TEST_BASE_URL || "http://localhost:3001";
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const stockId = "SG-TEST-INTEGRATION";
const testEmail = "test.integration@example.org";
const snapshot = JSON.parse(
  fs.readFileSync("data/drive-snapshot.json", "utf8"),
);
const privateFinancials = JSON.parse(
  fs.readFileSync(".private/stock-financials.json", "utf8"),
);

test("el catálogo público coincide con los 28 registros de la hoja de Drive", async () => {
  const response = await fetch(base + "/api/products");
  assert.equal(response.status, 200);
  const products = await response.json();
  assert.equal(products.length, snapshot.stock.length);
  for (const row of snapshot.stock) {
    const product = products.find((item) => item.stockId === row.id);
    assert.ok(product, `Falta ${row.id}`);
    assert.equal(product.brand, row.brand);
    assert.equal(product.model, row.model);
    assert.equal(product.year, row.year);
    assert.equal(product.color, row.color);
    assert.equal("serial" in product, false);
    for (const field of ["cost", "salePrice", "closePrice", "profit"]) {
      assert.equal(field in product, false);
    }
  }
});

test("catálogo y panel persisten productos, fotos y estados", async () => {
  let cookie = "";
  const priorWhatsApp =
    (await prisma.setting.findUnique({ where: { key: "whatsappNumber" } }))
      ?.value || "";
  try {
    let response = await fetch(base + "/api/admin/products");
    assert.equal(response.status, 401);

    response = await fetch(base + "/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
      }),
    });
    assert.equal(response.status, 200);
    cookie = response.headers.get("set-cookie")?.split(";")[0] || "";
    assert.ok(cookie);
    const headers = { "Content-Type": "application/json", Cookie: cookie };

    response = await fetch(base + "/api/admin/products", {
      headers: { Cookie: cookie },
    });
    const adminProducts = await response.json();
    for (const row of snapshot.stock) {
      const product = adminProducts.find((item) => item.stockId === row.id);
      assert.ok(product, `Falta ${row.id} en el panel`);
      const financials = privateFinancials[row.id] || {};
      for (const field of ["cost", "salePrice", "closePrice", "profit"]) {
        assert.equal(product[field], financials[field] || "");
      }
    }

    response = await fetch(base + "/api/subscribers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail }),
    });
    assert.equal(response.status, 201);
    response = await fetch(base + "/api/admin/subscribers", {
      headers: { Cookie: cookie },
    });
    assert.ok((await response.json()).some((item) => item.email === testEmail));

    response = await fetch(base + "/api/admin/settings", {
      method: "PUT",
      headers,
      body: JSON.stringify({ whatsappNumber: "5491112345678" }),
    });
    assert.equal(response.status, 200);
    response = await fetch(base + "/api/config");
    assert.equal((await response.json()).whatsappNumber, "5491112345678");

    const payload = {
      stockId,
      brand: "Prueba",
      model: "Integración",
      year: "2026",
      color: "Natural",
      serial: "TEST",
      cost: "100",
      salePrice: "200",
      closePrice: "150",
      profit: "50",
      category: "electricas",
      description: "Pieza temporal.",
      specs: ["Prueba"],
      status: "draft",
    };
    response = await fetch(base + "/api/admin/products", {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    assert.equal(response.status, 201);
    let product = await response.json();
    assert.equal(product.cost, "100");

    const form = new FormData();
    const bytes = fs.readFileSync("client/public/assets/products/SG-002/1.jpg");
    form.append(
      "images",
      new Blob([bytes], { type: "image/jpeg" }),
      "test.jpg",
    );
    response = await fetch(base + `/api/admin/products/${product.id}/images`, {
      method: "POST",
      headers: { Cookie: cookie },
      body: form,
    });
    assert.equal(response.status, 201);
    product = await response.json();
    assert.equal(product.images.length, 1);

    const imageUrl = base + product.images[0].src;
    assert.equal((await fetch(imageUrl)).status, 404);
    assert.equal(
      (await fetch(imageUrl, { headers: { Cookie: cookie } })).status,
      200,
    );

    response = await fetch(base + `/api/admin/products/${product.id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        ...payload,
        model: "Integración editada",
        status: "published",
      }),
    });
    assert.equal(response.status, 200);
    response = await fetch(base + `/api/products/${stockId}`);
    const publicProduct = await response.json();
    assert.equal(publicProduct.model, "Integración editada");
    assert.equal("cost" in publicProduct, false);
    assert.equal("salePrice" in publicProduct, false);
    assert.equal("closePrice" in publicProduct, false);
    assert.equal("profit" in publicProduct, false);

    response = await fetch(base + `/api/admin/products/${product.id}`, {
      method: "DELETE",
      headers: { Cookie: cookie },
    });
    assert.equal(response.status, 200);
    assert.equal((await fetch(base + `/api/products/${stockId}`)).status, 404);
  } finally {
    await prisma.product.deleteMany({ where: { stockId } });
    await prisma.subscriber.deleteMany({ where: { email: testEmail } });
    await prisma.setting.upsert({
      where: { key: "whatsappNumber" },
      create: { key: "whatsappNumber", value: priorWhatsApp },
      update: { value: priorWhatsApp },
    });
    await prisma.$disconnect();
  }
});
