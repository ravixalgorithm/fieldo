import { build } from "esbuild";
import { gzipSync } from "node:zlib";
import fs from "node:fs";

// Framer code-component bundle: inline all @fieldo packages, leave react +
// framer to the host. ESM so Framer's module loader can import it.
const result = await build({
  entryPoints: ["src/FieldoForm.tsx"],
  bundle: true,
  format: "esm",
  outfile: "dist/FieldoForm.js",
  external: ["react", "react-dom", "framer"],
  jsx: "automatic",
  minify: true,
  metafile: true,
  target: "es2020",
});

const out = fs.readFileSync("dist/FieldoForm.js");
const gz = gzipSync(out).length;
console.log(`dist/FieldoForm.js  ${(out.length / 1024).toFixed(1)} KB  (${(gz / 1024).toFixed(1)} KB gzipped)`);
if (gz > 150 * 1024) {
  console.error("FAIL: bundle exceeds 150KB gzipped budget (PRD 5.3.6)");
  process.exit(1);
}
