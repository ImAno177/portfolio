import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const source = readFileSync(resolve(root, "src/data/assets.ts"), "utf8");
const paths = [...source.matchAll(/path: "([^"]+)"/g)].map((match) => match[1]);
const missing = paths.filter((path) => !existsSync(resolve(root, "public", path.replace(/^\//, ""))));

if (missing.length) {
  console.error("Missing production assets:\n" + missing.join("\n"));
  process.exit(1);
}

console.log(`Validated ${paths.length} production asset paths.`);
