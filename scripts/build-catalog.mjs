import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");
const snapshot = JSON.parse(
  fs.readFileSync(path.join(root, "data/drive-snapshot.json"), "utf8"),
);
const folderMap = JSON.parse(
  fs.readFileSync(path.join(root, "data/product-folders.json"), "utf8"),
);
const sourcePhotos = path.join(root, "WEB/fotos del catalogo");
const outputPhotos = path.join(root, "client/public/assets/products");
const filesByName = new Map();

function walk(directory) {
  if (!fs.existsSync(directory)) return;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (!filesByName.has(entry.name)) filesByName.set(entry.name, full);
  }
}
walk(sourcePhotos);

const catalog = snapshot.stock.map((row) => {
  const folderName = folderMap[row.id];
  const folder = snapshot.folders.find((item) => item.folder === folderName);
  const doc = snapshot.docs.find((item) => item.folder === folderName);
  const lines = (doc?.content || "")
    .replace(/^\uFEFF/, "")
    .replaceAll("\r", "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const specsAt = lines.findIndex((line) => /specs\s*:/i.test(line));
  const beforeSpecs = specsAt < 0 ? lines : lines.slice(0, specsAt);
  const description = beforeSpecs
    .slice(1)
    .filter((line) => !line.startsWith("✅") && !line.startsWith("📍"))
    .join("\n\n");
  const specs = (specsAt < 0 ? [] : lines.slice(specsAt + 1))
    .filter((line) => line.startsWith("▫"))
    .map((line) => line.replace(/^▫️?\s*/, ""));
  const photos = [];
  const orderedImages = [...(folder?.images || [])];
  if (row.id === "SG-001")
    orderedImages.sort((a, b) =>
      a === "1G4A7352-41.jpg" ? -1 : b === "1G4A7352-41.jpg" ? 1 : 0,
    );
  for (const filename of orderedImages.slice(0, 4)) {
    const source = filesByName.get(filename);
    if (!source) continue;
    const directory = path.join(outputPhotos, row.id);
    fs.mkdirSync(directory, { recursive: true });
    const destination = path.join(directory, `${photos.length + 1}.jpg`);
    execFileSync(
      "sips",
      [
        "-s",
        "format",
        "jpeg",
        "-s",
        "formatOptions",
        "78",
        "-Z",
        "1400",
        source,
        "--out",
        destination,
      ],
      { stdio: "ignore" },
    );
    photos.push(`/assets/products/${row.id}/${photos.length + 1}.jpg`);
  }
  const number = Number(row.id.slice(3));
  const category =
    number >= 19
      ? "amplificadores"
      : number >= 10 && number <= 12
        ? "acusticas"
        : "electricas";
  return {
    stockId: row.id,
    brand: row.brand,
    model: row.model,
    year: row.year,
    color: row.color,
    category,
    description,
    specs,
    photos,
    sourceDocument: doc
      ? `https://docs.google.com/document/d/${doc.id}/edit`
      : null,
  };
});

fs.writeFileSync(
  path.join(root, "data/catalog.json"),
  JSON.stringify(catalog, null, 2) + "\n",
);
console.log(
  `Generated ${catalog.length} products, ${catalog.reduce((sum, p) => sum + p.photos.length, 0)} photos`,
);
console.log(
  "Without photos:",
  catalog
    .filter((p) => !p.photos.length)
    .map((p) => p.stockId)
    .join(", "),
);
console.log(
  "Without description:",
  catalog
    .filter((p) => !p.description)
    .map((p) => p.stockId)
    .join(", "),
);
