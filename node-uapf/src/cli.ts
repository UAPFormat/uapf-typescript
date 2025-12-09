#!/usr/bin/env node
import { loadUapf, validateUapf } from "./parser.js";

const [, , cmd, arg] = process.argv;

if (cmd === "validate" && arg) {
  validateUapf(arg);
  console.log("UAPF file is valid.");
} else if (cmd === "inspect" && arg) {
  const pkg = loadUapf(arg, false);
  console.log(JSON.stringify(pkg.manifest, null, 2));
} else {
  console.log("Usage: uapf validate <file.uapf> | uapf inspect <file.uapf>");
}
