#!/usr/bin/env node

import { runContextEvalCli } from "./lib/context-eval-validation.mjs";

process.exitCode = await runContextEvalCli(process.argv.slice(2));
