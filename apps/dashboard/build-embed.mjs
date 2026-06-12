import { build } from "esbuild";
import { gzipSync } from "node:zlib";
import fs from "node:fs";

// Self-contained IIFE: React + renderer inlined so any HTML page can use it.
await build({
  entryPoints: ["embed/embed.tsx"],
  bundle: true,
  format: "iife",
  outfile: "public/embed.js",
  jsx: "automatic",
  minify: true,
  target: "es2018",
  define: { "process.env.NODE_ENV": '"production"' },
});

const out = fs.readFileSync("public/embed.js");
const gz = gzipSync(out).length;
console.log(`public/embed.js  ${(out.length / 1024).toFixed(1)} KB  (${(gz / 1024).toFixed(1)} KB gzipped)`);
