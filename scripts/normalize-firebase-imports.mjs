#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).map(s => {
    const [k,v] = s.split("=");
    return [k.replace(/^--/,""), v ?? true];
  })
);

const ROOT = args.root ? String(args.root) : "src";
const WRITE = !!args.write;

const exts = new Set([".ts",".tsx",".js",".jsx",".mjs",".cjs"]);
const target = "@/lib/firebase";
const skipDirs = new Set(["node_modules",".git","dist",".next",".output",".vercel",".netlify",".expo",".cache",".vite"]);

const patterns = [
  [/from\s+["']\*?lib\/firebase(?:\.([mc]?js|tsx?|jsx))?["']/g, `from '${target}'`],
  [/require\(\s*["']\*?lib\/firebase(?:\.([mc]?js|tsx?|jsx))?["']\s*\)/g, `require('${target}')`],
  [/from\s+["'](?:\.\.\/|\.\/)+(?:.*?\/)?lib\/firebase(?:\.([mc]?js|tsx?|jsx))?["']/g, `from '${target}'`],
  [/require\(\s*["'](?:\.\.\/|\.\/)+(?:.*?\/)?lib\/firebase(?:\.([mc]?js|tsx?|jsx))?["']\s*\)/g, `require('${target}')`],
  [/import\(\s*["']\*?lib\/firebase(?:\.([mc]?js|tsx?|jsx))?["']\s*\)/g, `import('${target}')`],
  [/import\(\s*["'](?:\.\.\/|\.\/)+(?:.*?\/)?lib\/firebase(?:\.([mc]?js|tsx?|jsx))?["']\s*\)/g, `import('${target}')`],
];

let changedFiles = 0, changedBytes = 0, touched = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (skipDirs.has(entry.name)) continue;
      walk(path.join(dir, entry.name));
    } else if (exts.has(path.extname(entry.name))) {
      const p = path.join(dir, entry.name);
      let src = fs.readFileSync(p, "utf8");
      const before = src;
      for (const [re, repl] of patterns) src = src.replace(re, repl);
      if (src !== before) {
        touched.push(p);
        changedFiles++;
        changedBytes += (src.length - before.length);
        if (WRITE) fs.writeFileSync(p, src);
      }
    }
  }
}

if (!fs.existsSync(ROOT) || !fs.statSync(ROOT).isDirectory()) {
  console.error(`Root "${ROOT}" not found or not a directory.`);
  process.exit(1);
}

walk(ROOT);

const mode = WRITE ? "APPLIED" : "DRY-RUN";
console.log(`[${mode}] Updated ${changedFiles} file(s), net byte diff ${changedBytes >= 0 ? "+" : ""}${changedBytes}.`);
if (touched.length) {
  console.log("Files:");
  for (const p of touched) console.log(" -", p);
} else {
  console.log("No imports needed normalization.");
}