import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { Message } from "@earendil-works/pi-ai";
import {
  DEFAULT_MAX_BYTES,
  DEFAULT_MAX_LINES,
  formatSize,
  truncateHead,
  type ExtensionAPI,
} from "@earendil-works/pi-coding-agent";
import { Text } from "@earendil-works/pi-tui";
import { agentCanWrite, mapAgentTools, type ItsolAgentConfig } from "./agents.ts";
import type { ModelRouter } from "./model-router.ts";
import {
  ItsolDelegateParamsSchema,
  resolveTaskCwd,
  validateDelegation,
  type DelegatedTask,
  type ItsolDelegateParams,
} from "./policy.ts";
import type { RepoPolicyManager } from "./repo-policy.ts";
import type { TaskStateStore } from "./task-state.ts";
import { validateEnvelope } from "../../hooks/validate-subagent-stop.mjs";

export interface ChildUsage {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  cost: number;
  turns: number;
}

interface AgentActivity {
  text: string;
  elapsedMs: number;
}

export interface DelegationResult {
  agent: string;
  task: string;
  status: "completed" | "partial" | "blocked" | "failed" | "invalid-envelope";
  output: string;
  exitCode: number;
  stderr: string;
  usage: ChildUsage;
  durationMs: number;
  activities: AgentActivity[];
  model?: string;
  modelSource: string;
  thinking: string;
  thinkingSource: string;
  fullOutputPath?: string;
}

interface RunningAgentProgress {
  agent: string;
  activity: string;
  elapsedMs: number;
  model: string;
  modelSource: string;
  thinking: string;
  thinkingSource: string;
}

interface DelegationDetails {
  taskId: string;
  results: DelegationResult[];
  progress?: RunningAgentProgress[];
}

export function formatDuration(durationMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (totalMinutes < 60) return `${totalMinutes}min${seconds ? ` ${seconds}s` : ""}`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h${minutes ? ` ${minutes}min` : ""}`;
}

function compact(text: string, maxLength = 72): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 1)}…` : normalized;
}

function displayPath(value: unknown, cwd: string): string {
  if (typeof value !== "string" || !value.trim()) return "…";
  const raw = value.replace(/^@/, "");
  const absolute = path.isAbsolute(raw) ? raw : path.resolve(cwd, raw);
  const relative = path.relative(cwd, absolute);
  if (relative && !relative.startsWith("..") && !path.isAbsolute(relative)) return relative;
  const home = os.homedir();
  return absolute.startsWith(home) ? `~${absolute.slice(home.length)}` : absolute;
}

export function summarizeToolActivity(toolName: string, args: Record<string, unknown>, cwd: string): string {
  switch (toolName) {
    case "read": {
      const file = displayPath(args.path ?? args.file_path, cwd);
      const offset = typeof args.offset === "number" ? `:${args.offset}` : "";
      return `reading ${compact(file)}${offset}`;
    }
    case "grep":
      return `searching “${compact(String(args.pattern ?? "…"), 36)}” in ${compact(displayPath(args.path ?? ".", cwd), 36)}`;
    case "find":
      return `finding ${compact(String(args.pattern ?? "*"), 36)} in ${compact(displayPath(args.path ?? ".", cwd), 36)}`;
    case "ls":
      return `listing ${compact(displayPath(args.path ?? ".", cwd))}`;
    case "bash":
      return `running: ${compact(String(args.command ?? "…").split("\n")[0])}`;
    case "write":
      return `writing ${compact(displayPath(args.path ?? args.file_path, cwd))}`;
    case "edit":
      return `editing ${compact(displayPath(args.path ?? args.file_path, cwd))}`;
    default:
      return `using tool ${compact(toolName)}`;
  }
}

function getPiInvocation(args: string[]): { command: string; args: string[] } {
  const currentScript = process.argv[1];
  const bunVirtualScript = currentScript?.startsWith("/$bunfs/root/");
  if (currentScript && !bunVirtualScript && fs.existsSync(currentScript)) {
    return { command: process.execPath, args: [currentScript, ...args] };
  }
  const executable = path.basename(process.execPath).toLowerCase();
  if (!/^(node|bun)(\.exe)?$/.test(executable)) return { command: process.execPath, args };
  return { command: "pi", args };
}

function finalAssistantOutput(messages: Message[]): string {
  for (let index = messages.length - 1; index >= 0; index--) {
    const message = messages[index];
    if (message.role !== "assistant") continue;
    return message.content
      .filter((part) => part.type === "text")
      .map((part) => part.text)
      .join("\n")
      .trim();
  }
  return "";
}

function envelopeStatus(output: string): DelegationResult["status"] {
  if (!validateEnvelope(output)) return "invalid-envelope";
  const match = output.match(/^Status: (completed|partial|blocked|failed)$/m);
  return (match?.[1] as DelegationResult["status"] | undefined) ?? "invalid-envelope";
}

async function saveFullOutput(agent: string, output: string): Promise<string> {
  const directory = await fs.promises.mkdtemp(path.join(os.tmpdir(), "itsolpowers-pi-"));
  const file = path.join(directory, `${agent.replace(/[^a-z0-9-]/gi, "_")}.md`);
  await fs.promises.writeFile(file, output, { encoding: "utf8", mode: 0o600 });
  return file;
}

async function truncateForParent(agent: string, output: string): Promise<{ text: string; fullOutputPath?: string }> {
  const truncated = truncateHead(output, { maxBytes: DEFAULT_MAX_BYTES, maxLines: DEFAULT_MAX_LINES });
  if (!truncated.truncated) return { text: output };
  const fullOutputPath = await saveFullOutput(agent, output);
  return {
    text: `${truncated.content}\n\n[Output truncated: ${truncated.outputLines} of ${truncated.totalLines} lines (${formatSize(truncated.outputBytes)} of ${formatSize(truncated.totalBytes)}). Full output: ${fullOutputPath}]`,
    fullOutputPath,
  };
}

function buildChildPrompt(
  pluginRoot: string,
  skillsDir: string,
  agent: ItsolAgentConfig,
  task: DelegatedTask,
  params: ItsolDelegateParams,
  effectiveRuntime: { model?: string; modelSource: string; thinking: string; thinkingSource: string },
): string {
  const preloadedSkills = agent.skills.map((skillName) => {
    const skillPath = path.join(skillsDir, skillName, "SKILL.md");
    if (!fs.existsSync(skillPath)) throw new Error(`Agent ${agent.name} references missing skill: ${skillName}`);
    return [
      `## Preloaded ITSOL skill: ${skillName}`,
      `Skill directory: ${path.dirname(skillPath)}`,
      fs.readFileSync(skillPath, "utf8").trim(),
    ].join("\n\n");
  });

  const writable = agentCanWrite(agent);
  const scopeInstructions = writable
    ? `You may modify only these paths: ${task.write_scope.join(", ")}. Do not modify forbidden paths: ${task.forbidden_scope.join(", ") || "none"}.`
    : "This is a read-only delegation. Do not modify files. Bash may be used only for non-mutating inspection or verification commands.";

  const packet = {
    workflow_state: params.workflow_state,
    execution_policy: params.execution_policy,
    done_when: params.done_when,
    delegated_task: task,
    effective_runtime: effectiveRuntime,
  };

  return [
    "# ITSOL Powers delegated Pi agent",
    "You run in an isolated Pi process. Nested delegation is unavailable and forbidden.",
    "Claude-style tool names in bundled instructions map to Pi tools: Read=read, Grep=grep, Glob=find, Bash=bash, Write=write, Edit/MultiEdit=edit.",
    scopeInstructions,
    "Validate the task packet before work. Preserve incomplete statuses and end with the exact required response envelope.",
    `Plugin root: ${pluginRoot}`,
    "## Task packet",
    "```json",
    JSON.stringify(packet, null, 2),
    "```",
    "## Agent instructions",
    agent.systemPrompt.replaceAll("${CLAUDE_PLUGIN_ROOT}", pluginRoot).replaceAll("itsolpowers:", ""),
    ...preloadedSkills,
  ].join("\n\n");
}

export async function runAgent(
  pluginRoot: string,
  skillsDir: string,
  agent: ItsolAgentConfig,
  task: DelegatedTask,
  params: ItsolDelegateParams,
  parentCwd: string,
  model: string | undefined,
  modelSource: string,
  thinking: string,
  thinkingSource: string,
  signal: AbortSignal | undefined,
  onProgress: (activity: string, elapsedMs: number) => void,
): Promise<DelegationResult> {
  const startedAt = Date.now();
  const prompt = buildChildPrompt(pluginRoot, skillsDir, agent, task, params, {
    model,
    modelSource,
    thinking,
    thinkingSource,
  });
  const temporaryDirectory = await fs.promises.mkdtemp(path.join(os.tmpdir(), "itsolpowers-pi-prompt-"));
  const promptPath = path.join(temporaryDirectory, `${agent.name}.md`);
  await fs.promises.writeFile(promptPath, prompt, { encoding: "utf8", mode: 0o600 });
  const childCwd = resolveTaskCwd(parentCwd, task.cwd);
  const activities: AgentActivity[] = [];
  let currentActivity = "analyzing task";
  const reportProgress = (activity?: string) => {
    if (activity && activity !== currentActivity) {
      currentActivity = activity;
      activities.push({ text: activity, elapsedMs: Date.now() - startedAt });
      if (activities.length > 20) activities.shift();
    } else if (activities.length === 0) {
      activities.push({ text: currentActivity, elapsedMs: Date.now() - startedAt });
    }
    onProgress(currentActivity, Date.now() - startedAt);
  };
  reportProgress();
  const progressTimer = setInterval(() => reportProgress(), 1000);
  progressTimer.unref();

  const args = [
    "--mode",
    "json",
    "--print",
    "--no-session",
    "--no-extensions",
    "--no-skills",
    "--tools",
    mapAgentTools(agent).join(","),
    "--thinking",
    thinking,
    "--append-system-prompt",
    promptPath,
  ];
  if (model) args.push("--model", model);
  args.push(`Task: ${task.task}`);

  const messages: Message[] = [];
  const usage: ChildUsage = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, cost: 0, turns: 0 };
  let stderr = "";
  let buffer = "";
  let aborted = false;

  try {
    const invocation = getPiInvocation(args);
    const exitCode = await new Promise<number>((resolve) => {
      const child = spawn(invocation.command, invocation.args, {
        cwd: childCwd,
        shell: false,
        stdio: ["ignore", "pipe", "pipe"],
        env: { ...process.env, ITSOLPOWERS_DELEGATED_AGENT: "1" },
      });
      let closed = false;

      const processLine = (line: string) => {
        if (!line.trim()) return;
        let event: any;
        try {
          event = JSON.parse(line);
        } catch {
          return;
        }
        if (event.type === "tool_execution_start" && event.toolName) {
          reportProgress(summarizeToolActivity(event.toolName, event.args ?? {}, childCwd));
          return;
        }
        if (event.type !== "message_end" || !event.message) return;
        const message = event.message as Message;
        messages.push(message);
        if (message.role === "assistant") {
          usage.turns++;
          usage.input += message.usage?.input ?? 0;
          usage.output += message.usage?.output ?? 0;
          usage.cacheRead += message.usage?.cacheRead ?? 0;
          usage.cacheWrite += message.usage?.cacheWrite ?? 0;
          usage.cost += message.usage?.cost?.total ?? 0;
          const toolCall = [...message.content].reverse().find((part) => part.type === "toolCall");
          if (toolCall?.type === "toolCall") {
            reportProgress(summarizeToolActivity(toolCall.name, toolCall.arguments, childCwd));
          } else {
            reportProgress("preparing response");
          }
        }
      };

      child.stdout.on("data", (data) => {
        buffer += data.toString();
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) processLine(line);
      });
      child.stderr.on("data", (data) => {
        stderr += data.toString();
      });
      child.on("error", (error) => {
        stderr += error.message;
        resolve(1);
      });
      child.on("close", (code) => {
        closed = true;
        if (buffer.trim()) processLine(buffer);
        resolve(code ?? 1);
      });

      const abort = () => {
        aborted = true;
        child.kill("SIGTERM");
        setTimeout(() => {
          if (!closed) child.kill("SIGKILL");
        }, 5000).unref();
      };
      if (signal?.aborted) abort();
      else signal?.addEventListener("abort", abort, { once: true });
    });

    const rawOutput = finalAssistantOutput(messages) || stderr.trim() || "(no output)";
    const displayOutput = await truncateForParent(agent.name, rawOutput);
    const status = aborted || exitCode !== 0 ? "failed" : envelopeStatus(rawOutput);
    return {
      agent: agent.name,
      task: task.task,
      status,
      output: displayOutput.text,
      exitCode,
      stderr,
      usage,
      durationMs: Date.now() - startedAt,
      activities,
      model: model ?? "default model",
      modelSource,
      thinking,
      thinkingSource,
      fullOutputPath: displayOutput.fullOutputPath,
    };
  } finally {
    clearInterval(progressTimer);
    await fs.promises.rm(temporaryDirectory, { recursive: true, force: true });
  }
}

export function registerItsolDelegate(
  pi: ExtensionAPI,
  pluginRoot: string,
  agents: ItsolAgentConfig[],
  store: TaskStateStore,
  modelRouter: ModelRouter,
  repoPolicy: RepoPolicyManager,
  resetHandlers: Array<() => void>,
): void {
  const skillsDir = path.join(pluginRoot, "skills");
  const agentsByName = new Map(agents.map((agent) => [agent.name, agent]));
  const activeByTask = new Map<string, number>();
  resetHandlers.push(() => activeByTask.clear());

  pi.registerTool({
    name: "itsol_delegate",
    label: "ITSOL Delegate",
    description: "Delegate one or more independent tasks to bundled ITSOL agents in isolated Pi processes. Task state may be loaded by task_id from itsol_task_state. Models and reasoning resolve from task.model, configured profile+role mappings, execution policy, or the main model. Enforces agent ceilings, parallel ceilings, stop ordering, artifact authorization, and non-overlapping write scopes. Model-visible output is limited to 50KB/2000 lines, with larger reports saved to private temporary files.",
    promptSnippet: "Delegate bounded work to an ITSOL specialist agent",
    promptGuidelines: [
      "Use itsol_delegate only after loading itsol-workflow-mode, itsol-execution-policy, and itsol-subagent-workflow.",
      "Before itsol_delegate, persist complete workflow state, execution policy, and done_when with itsol_task_state; subsequent calls may reuse them by task_id.",
      "For cheap exploration with itsol_delegate, set task.model to an exact available provider/model id within execution_policy.model_profile; omit it when the child should inherit the main model.",
    ],
    parameters: ItsolDelegateParamsSchema,

    async execute(_toolCallId, input, signal, onUpdate, ctx) {
      const params = store.resolveDelegation(input);
      const single = params.task ? [params.task] : [];
      const parallel = params.tasks ?? [];
      if ((single.length ? 1 : 0) + (parallel.length ? 1 : 0) !== 1) {
        throw new Error("Provide exactly one of task or tasks");
      }
      const tasks = single.length ? single : parallel;
      const inheritedModel = ctx.model ? `${ctx.model.provider}/${ctx.model.id}` : undefined;
      const resolutions = new Map(tasks.map((task) => {
        const agent = agentsByName.get(task.agent);
        if (!agent) throw new Error(`Unknown ITSOL agent: ${task.agent}`);
        return [task.agent, modelRouter.resolve(task, agent, params.execution_policy, inheritedModel, ctx)] as const;
      }));
      repoPolicy.validateDelegation(params, tasks);
      validateDelegation(params, tasks, agentsByName, store.getUsedAgents(params.task_id), {
        modelControlEnforced: [...resolutions.values()].every((resolution) => resolution.profileEnforced),
      });
      const active = activeByTask.get(params.task_id) ?? 0;
      if (active + tasks.length > params.execution_policy.max_parallel) {
        throw new Error(
          `Delegation would run ${active + tasks.length} children concurrently, but max_parallel is ${params.execution_policy.max_parallel}`,
        );
      }
      activeByTask.set(params.task_id, active + tasks.length);
      store.beginDelegation(params.task_id, tasks.map((task) => task.agent));

      const progress = new Map<string, RunningAgentProgress>(
        tasks.map((task) => {
          const resolution = resolutions.get(task.agent)!;
          return [task.agent, {
            agent: task.agent,
            activity: "queued",
            elapsedMs: 0,
            model: resolution.model ?? "default model",
            modelSource: `${resolution.source}:${resolution.role}`,
            thinking: resolution.thinking,
            thinkingSource: resolution.thinkingSource,
          }];
        }),
      );
      const update = (agent: string, activity: string, elapsedMs: number) => {
        const resolution = resolutions.get(agent)!;
        progress.set(agent, {
          agent,
          activity,
          elapsedMs,
          model: resolution.model ?? "default model",
          modelSource: `${resolution.source}:${resolution.role}`,
          thinking: resolution.thinking,
          thinkingSource: resolution.thinkingSource,
        });
        const current = [...progress.values()];
        onUpdate?.({
          content: [{
            type: "text",
            text: current.map((item) => `${item.agent}: ${item.activity} · ${formatDuration(item.elapsedMs)}`).join("\n"),
          }],
          details: { taskId: params.task_id, results: [], progress: current } satisfies DelegationDetails,
        });
      };

      let results: DelegationResult[] = [];
      try {
        results = await Promise.all(
          tasks.map((task) => {
            const agent = agentsByName.get(task.agent)!;
            const resolution = resolutions.get(agent.name)!;
            update(agent.name, "analyzing task", 0);
            return runAgent(
              pluginRoot,
              skillsDir,
              agent,
              task,
              params,
              ctx.cwd,
              resolution.model,
              `${resolution.source}:${resolution.role}`,
              resolution.thinking,
              resolution.thinkingSource,
              signal,
              (activity, elapsedMs) => update(agent.name, activity, elapsedMs),
            );
          }),
        );
      } finally {
        const remaining = Math.max(0, (activeByTask.get(params.task_id) ?? tasks.length) - tasks.length);
        if (remaining === 0) activeByTask.delete(params.task_id);
        else activeByTask.set(params.task_id, remaining);
        store.finishDelegation(
          params.task_id,
          tasks.map((task) => task.agent),
          results.map((result) => ({
            ...result,
            role: resolutions.get(result.agent)?.role,
          })),
        );
      }

      const summaries = results.map((result) => [
        `## ${result.agent} — ${result.status}`,
        result.output,
        `Duration: ${formatDuration(result.durationMs)}. Model: ${result.model ?? "default"} (${result.modelSource}). Thinking: ${result.thinking} (${result.thinkingSource}). Usage: ${result.usage.input} input, ${result.usage.output} output, $${result.usage.cost.toFixed(4)}`,
      ].join("\n\n"));
      const combined = await truncateForParent(`delegation-${params.task_id}`, summaries.join("\n\n---\n\n"));

      return {
        content: [{ type: "text", text: combined.text }],
        details: { taskId: params.task_id, results } satisfies DelegationDetails,
      };
    },

    renderCall(args, theme) {
      const tasks = args.task ? [args.task] : (args.tasks ?? []);
      const names = tasks.map((task) => task.agent).join(", ") || "...";
      return new Text(
        `${theme.fg("toolTitle", theme.bold("itsol_delegate "))}${theme.fg("accent", names)}${theme.fg("muted", ` [${args.task_id ?? "task"}]`)}`,
        0,
        0,
      );
    },

    renderResult(result, { expanded }, theme) {
      const details = result.details as DelegationDetails | undefined;
      if (!details?.results.length && details?.progress?.length) {
        const text = details.progress.map((item) => [
          theme.fg("warning", "⏳"),
          theme.fg("toolTitle", theme.bold(item.agent)),
          theme.fg("muted", ": "),
          theme.fg("accent", item.activity),
          theme.fg("dim", ` · ${formatDuration(item.elapsedMs)}`),
          "\n  ",
          theme.fg("dim", "model: "),
          theme.fg("muted", item.model),
          theme.fg("dim", ` (${item.modelSource})`),
          theme.fg("dim", " · thinking: "),
          theme.fg("muted", item.thinking),
          theme.fg("dim", ` (${item.thinkingSource})`),
        ].join("")).join("\n");
        return new Text(text, 0, 0);
      }
      if (!details?.results.length) {
        const content = result.content[0];
        return new Text(content?.type === "text" ? content.text : "(no output)", 0, 0);
      }
      const lines = details.results.map((item) => {
        const color = item.status === "completed" ? "success" : item.status === "failed" ? "error" : "warning";
        let text = `${theme.fg(color, item.status === "completed" ? "✓" : "!")} ${theme.fg("accent", item.agent)} — ${item.status}`;
        const activityTrail = item.activities.slice(-3).map((activity) => activity.text).join(" → ");
        if (activityTrail) text += `\n${theme.fg("muted", activityTrail)}`;
        if (expanded) text += `\n${item.output}`;
        const stats = [
          `model: ${item.model ?? "default"} (${item.modelSource})`,
          `thinking: ${item.thinking} (${item.thinkingSource})`,
          formatDuration(item.durationMs),
          `$${item.usage.cost.toFixed(4)}`,
        ].join(" · ");
        text += `\n${theme.fg("dim", stats)}`;
        return text;
      });
      if (!expanded) lines.push(theme.fg("muted", "Expand tool output to view delegated reports."));
      return new Text(lines.join("\n\n"), 0, 0);
    },
  });
}
