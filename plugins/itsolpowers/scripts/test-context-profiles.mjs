#!/usr/bin/env node

import { runTargetArchitectureCli } from "./lib/context-target-architecture.mjs";

process.exitCode = await runTargetArchitectureCli([
  "--only",
  "profiles",
  ...process.argv.slice(2),
]);
