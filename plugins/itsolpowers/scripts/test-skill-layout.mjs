#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const pluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const skillsRoot = path.join(pluginRoot, "skills");
const wordCount = (value) => value.match(/\S+/g)?.length ?? 0;

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(absolute) : [absolute];
  });
}

const skillFiles = fs.readdirSync(skillsRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name !== "_shared")
  .map((entry) => path.join(skillsRoot, entry.name, "SKILL.md"))
  .filter((absolute) => fs.existsSync(absolute))
  .sort();
const guideFiles = walk(skillsRoot)
  .filter((absolute) => absolute.endsWith(`${path.sep}references${path.sep}guide.md`));

assert.equal(guideFiles.length, 0, "guide.md routing indirection must stay merged into SKILL.md");
assert.equal(skillFiles.length, 116, "unexpected discoverable skill count");

let totalWords = 0;
let largest = { path: "", words: 0 };
const forbiddenHeadings = /^## (?:Zakres|Przeniesione sekcje|Jak używać|Jak uzywac|How To Use)$/m;
const markdownLink = /\[[^\]]+\]\(([^)]+)\)/g;

for (const skillFile of skillFiles) {
  const relative = path.relative(pluginRoot, skillFile).split(path.sep).join("/");
  const markdown = fs.readFileSync(skillFile, "utf8");
  assert(!markdown.includes("references/guide.md"), `${relative} references removed guide.md`);
  assert(!forbiddenHeadings.test(markdown), `${relative} contains migration or routing boilerplate`);

  const words = wordCount(markdown);
  totalWords += words;
  if (words > largest.words) largest = { path: relative, words };
  assert(words <= 2_000, `${relative} exceeds the 2,000-word SKILL.md budget`);

  for (const match of markdown.matchAll(markdownLink)) {
    const target = match[1].split("#", 1)[0].split("?", 1)[0];
    if (!target || /^(?:https?:|mailto:)/.test(target)) continue;
    const resolved = path.resolve(path.dirname(skillFile), decodeURIComponent(target));
    assert(
      resolved.startsWith(`${pluginRoot}${path.sep}`),
      `${relative} link escapes the plugin: ${match[1]}`,
    );
    assert(fs.existsSync(resolved), `${relative} link target is missing: ${match[1]}`);
  }
}

for (const root of [
  path.join(pluginRoot, "agents"),
  path.join(pluginRoot, "scripts", "agent-sources"),
]) {
  for (const file of walk(root).filter((absolute) => absolute.endsWith(".md"))) {
    const markdown = fs.readFileSync(file, "utf8");
    assert(
      !markdown.includes("references/guide.md"),
      `${path.relative(pluginRoot, file)} references removed guide.md`,
    );
  }
}

assert(totalWords <= 40_000, `combined SKILL.md budget exceeded: ${totalWords} words`);
process.stdout.write(
  `skill layout fixtures: PASS (${skillFiles.length} skills; ${totalWords} words; largest ${largest.path} ${largest.words} words; 0 guide.md files)\n`,
);
