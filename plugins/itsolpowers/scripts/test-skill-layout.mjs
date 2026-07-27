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
let totalDescriptionChars = 0;
let longestDescription = { name: "", chars: 0 };
const descriptions = new Map();
const forbiddenHeadings = /^## (?:Zakres|Przeniesione sekcje|Jak używać|Jak uzywac|How To Use)$/m;
const markdownLink = /\[[^\]]+\]\(([^)]+)\)/g;

for (const skillFile of skillFiles) {
  const relative = path.relative(pluginRoot, skillFile).split(path.sep).join("/");
  const markdown = fs.readFileSync(skillFile, "utf8");
  const frontmatter = markdown.match(/^---\n([\s\S]*?)\n---\n/);
  assert(frontmatter, `${relative} is missing YAML frontmatter`);
  const name = frontmatter[1].match(/^name:\s*"?([^"\n]+)"?\s*$/m)?.[1];
  const description = frontmatter[1].match(/^description:\s*"([^"\n]+)"\s*$/m)?.[1];
  assert(name, `${relative} is missing a single-line name`);
  assert(description, `${relative} is missing a quoted single-line description`);
  assert.equal(name, path.basename(path.dirname(skillFile)), `${relative} name must match its directory`);
  assert(!descriptions.has(name), `${relative} duplicates skill name ${name}`);
  assert(description.length <= 110, `${relative} description exceeds 110 characters`);
  descriptions.set(name, description);
  totalDescriptionChars += description.length;
  if (description.length > longestDescription.chars) {
    longestDescription = { name, chars: description.length };
  }

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

const routingContracts = [
  ["itsol-codex-doctor", "itsol-codex-setup", "without changing"],
  ["itsol-codex-setup", "itsol-codex-doctor", "change"],
  ["itsol-workflow-mode", "itsol-execution-policy", "governed"],
  ["itsol-execution-policy", "itsol-workflow-mode", "model"],
  ["itsol-initiative-delivery", "itsol-functional-planning", "multi-phase"],
  ["itsol-functional-planning", "itsol-initiative-delivery", "user-visible"],
  ["agent-browser-interaction-debugging", "agent-browser-qa-reporting", "stale refs"],
  ["agent-browser-qa-reporting", "agent-browser-interaction-debugging", "verdicts"],
  ["electron-security-hardening", "electron-desktop-review", "CSP"],
  ["electron-desktop-review", "electron-security-hardening", "release risk"],
  ["tanstack-query-react-nextjs-debugging", "react-nextjs-debugging", "stale data"],
  ["tanstack-query-svelte-review", "svelte-review", "runes"],
  ["infra-container-build-review", "infra-container-runtime-review", "SBOMs"],
  ["infra-container-runtime-review", "infra-container-build-review", "health checks"],
];

for (const [expectedSkill, contrastingSkill, signal] of routingContracts) {
  const expected = descriptions.get(expectedSkill);
  const contrasting = descriptions.get(contrastingSkill);
  assert(expected, `routing contract references missing skill ${expectedSkill}`);
  assert(contrasting, `routing contract references missing skill ${contrastingSkill}`);
  assert(
    expected.toLowerCase().includes(signal.toLowerCase()),
    `${expectedSkill} description lost routing signal "${signal}"`,
  );
  assert(
    !contrasting.toLowerCase().includes(signal.toLowerCase()),
    `${contrastingSkill} description collides on routing signal "${signal}"`,
  );
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
assert(
  totalDescriptionChars <= 10_500,
  `combined skill description budget exceeded: ${totalDescriptionChars} characters`,
);
process.stdout.write(
  `skill layout fixtures: PASS (${skillFiles.length} skills; ${totalDescriptionChars} description characters; longest ${longestDescription.name} ${longestDescription.chars} characters; ${routingContracts.length} routing contracts; ${totalWords} body words; largest ${largest.path} ${largest.words} words; 0 guide.md files)\n`,
);
