#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";

import { synchronizeAgentContracts } from "./lib/agent-contract.mjs";

const defaultPluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

try {
  const args = process.argv.slice(2);
  let check = false;
  let pluginRoot = defaultPluginRoot;
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--check") {
      check = true;
    } else if (argument === "--root") {
      const value = args[index + 1];
      if (!value) throw new Error("--root requires a directory");
      pluginRoot = path.resolve(value);
      index += 1;
    } else {
      throw new Error(`unknown argument: ${argument}`);
    }
  }

  const result = synchronizeAgentContracts({ pluginRoot, check });
  if (result.issues.length > 0) {
    for (const issue of result.issues) console.error(issue);
    process.exitCode = 1;
  } else if (check) {
    console.log(`agent-contract check: PASS (${result.contracts.length} agents)`);
  } else {
    console.log(`agent-contract generation: PASS (${result.contracts.length} agents, ${result.written.length} written)`);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
