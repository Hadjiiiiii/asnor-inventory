import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const readme = readFileSync(new URL("../../README.md", import.meta.url), "utf8");

test("README links the live demo", () => {
  assert.match(readme, /https:\/\/asnor-inventory\.vercel\.app/);
});

test("README shows the demo GIF", () => {
  assert.match(readme, /!\[[^\]]*\]\(docs\/demo\.gif\)/);
});

test("README has a Mermaid architecture diagram", () => {
  assert.match(readme, /^```mermaid$/m);
});

test("README has a Demo login section", () => {
  assert.match(readme, /^#+ Demo login$/im);
});
