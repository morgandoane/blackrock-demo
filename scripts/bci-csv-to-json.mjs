import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Papa from "papaparse";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const csvPath = process.argv[2] || path.join(root, "bci-interactions.csv");
const outPath = path.join(root, "src", "data", "bci-interactions.json");

const raw = fs.readFileSync(csvPath, "utf8");
const parsed = Papa.parse(raw, { header: true, skipEmptyLines: true });
if (parsed.errors.length) {
  console.error(parsed.errors);
  process.exit(1);
}

function slugify(text) {
  const s = String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return s || "interaction";
}

const usedIds = new Map();
function uniqueIdFromAction(action) {
  const base = slugify(action);
  let id = base;
  let n = 1;
  while (usedIds.has(id)) {
    n += 1;
    id = `${base}-${n}`;
  }
  usedIds.set(id, true);
  return id;
}

const rows = parsed.data.map((row) => ({
  id: uniqueIdFromAction(String(row.action ?? "").trim()),
  action: String(row.action ?? "").trim(),
  tool: String(row.tool ?? "").trim(),
  domain: String(row.domain ?? "").trim(),
  consequence: Number(row.consequence),
  reversibility: Number(row.reversibility),
  routineness: Number(row.routineness),
  commitment_friction: Number(row.commitment_friction),
  context_richness: Number(row.context_richness),
  composition_complexity: Number(row.composition_complexity),
  commitment_mechanism: String(row.commitment_mechanism ?? "").trim(),
  context_inputs: String(row.context_inputs ?? "").trim(),
  composition_output: String(row.composition_output ?? "").trim(),
  notes: String(row.notes ?? "").trim(),
}));

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(rows, null, 2), "utf8");
console.log(`Wrote ${rows.length} rows to ${outPath}`);
