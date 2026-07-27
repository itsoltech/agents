#!/usr/bin/env node

import { writeFile } from "node:fs/promises";

import {
  auditContext,
  formatAuditHuman,
  stableJson,
} from "./lib/context-audit.mjs";

function parseArguments(argumentsList) {
  const parsed = {
    format: "human",
    output: null,
    pluginRoot: null,
    revision: null,
  };
  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    if (argument === "--plugin-root") {
      parsed.pluginRoot = argumentsList[++index];
    } else if (argument === "--revision") {
      parsed.revision = argumentsList[++index];
    } else if (argument === "--format") {
      parsed.format = argumentsList[++index];
    } else if (argument === "--output") {
      parsed.output = argumentsList[++index];
    } else {
      throw new Error(`unknown argument: ${argument}`);
    }
  }
  if (!parsed.pluginRoot || !parsed.revision) {
    throw new Error("--plugin-root and --revision are required");
  }
  if (!["human", "json"].includes(parsed.format)) {
    throw new Error("--format must be human or json");
  }
  return parsed;
}

try {
  const options = parseArguments(process.argv.slice(2));
  const report = await auditContext({
    pluginRoot: options.pluginRoot,
    revision: options.revision,
  });
  const output =
    options.format === "json" ? stableJson(report) : formatAuditHuman(report);
  if (options.output) {
    await writeFile(options.output, output);
  } else {
    process.stdout.write(output);
  }
} catch (error) {
  console.error(`context audit: FAIL: ${error.message}`);
  process.exitCode = 1;
}
