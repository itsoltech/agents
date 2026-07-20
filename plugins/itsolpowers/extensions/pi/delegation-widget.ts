import type { ExtensionContext, ThemeColor } from "@earendil-works/pi-coding-agent";
import { truncateToWidth } from "@earendil-works/pi-tui";

export type DelegationWidgetStatus =
  | "queued"
  | "running"
  | "completed"
  | "partial"
  | "blocked"
  | "failed"
  | "invalid-envelope"
  | "cancelled"
  | "interrupted";

/** The display-only subset of a coordinator record consumed by the widget. */
export interface DelegationWidgetRecord {
  id?: string;
  taskId?: string;
  delegationId?: string;
  agent: string;
  workItemId?: string;
  description?: string;
  task?: string;
  status: DelegationWidgetStatus | string;
  activity?: string;
  latestActivity?: string;
  output?: string;
  preview?: string;
  queuedAt?: number;
  startedAt?: number;
  completedAt?: number;
  finishedAt?: number;
  endedAt?: number;
  updatedAt?: number;
  durationMs?: number;
  model?: string;
  modelSource?: string;
  thinking?: string;
  thinkingSource?: string;
}

export interface DelegationWidgetTheme {
  fg(color: ThemeColor, text: string): string;
  bold(text: string): string;
}

export interface DelegationWidgetRenderOptions {
  now?: number;
  frame?: number;
  maxLines?: number;
  terminalLingerMs?: number;
  theme?: DelegationWidgetTheme;
}

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const DEFAULT_MAX_LINES = 12;
const DEFAULT_TERMINAL_LINGER_MS = 5_000;
const ACTIVE_STATUSES = new Set(["queued", "running"]);

/**
 * Remove terminal control sequences from untrusted child text.
 *
 * This state machine deliberately consumes unterminated CSI/string sequences to
 * end-of-input as well as complete ANSI, OSC hyperlink, DCS, APC, PM and SOS
 * sequences. Carriage returns and disallowed C0/C1 controls never reach the TUI.
 */
export function sanitizeTerminalText(text: unknown, multiline: boolean): string {
  const input = typeof text === "string" ? text : text == null ? "" : String(text);
  let output = "";

  const consumeString = (start: number): number => {
    for (let index = start; index < input.length; index++) {
      const code = input.charCodeAt(index);
      if (code === 0x07 || code === 0x9c) return index + 1;
      if (code === 0x1b && input.charCodeAt(index + 1) === 0x5c) return index + 2;
    }
    return input.length;
  };

  const consumeCsi = (start: number): number => {
    for (let index = start; index < input.length; index++) {
      const code = input.charCodeAt(index);
      if (code >= 0x40 && code <= 0x7e) return index + 1;
    }
    return input.length;
  };

  for (let index = 0; index < input.length;) {
    const code = input.charCodeAt(index);
    if (code === 0x1b) {
      const next = input.charCodeAt(index + 1);
      if (next === 0x5b) index = consumeCsi(index + 2); // CSI
      else if ([0x5d, 0x50, 0x58, 0x5e, 0x5f].includes(next)) index = consumeString(index + 2); // OSC/DCS/SOS/PM/APC
      else {
        // Consume a single ESC control sequence, including intermediates. A lone
        // or unterminated ESC is discarded rather than exposing its payload.
        index += 2;
        while (index < input.length) {
          const current = input.charCodeAt(index);
          index++;
          if (current >= 0x30 && current <= 0x7e) break;
        }
      }
      continue;
    }
    if (code === 0x9b) { // 8-bit CSI
      index = consumeCsi(index + 1);
      continue;
    }
    if ([0x90, 0x98, 0x9d, 0x9e, 0x9f].includes(code)) { // 8-bit DCS/SOS/OSC/PM/APC
      index = consumeString(index + 1);
      continue;
    }
    if (code === 0x0a) output += multiline ? "\n" : " ";
    else if (code === 0x09) output += multiline ? "  " : " ";
    else if (code >= 0x20 && code !== 0x7f && !(code >= 0x80 && code <= 0x9f)) output += input[index];
    index++;
  }

  if (!multiline) return output.replace(/\s+/g, " ").trim();
  return output
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function formatElapsed(milliseconds: number): string {
  const seconds = Math.max(0, Math.floor(milliseconds / 1_000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m${seconds % 60 ? ` ${seconds % 60}s` : ""}`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h${minutes % 60 ? ` ${minutes % 60}m` : ""}`;
}

function terminalAt(record: DelegationWidgetRecord): number | undefined {
  return record.completedAt ?? record.finishedAt ?? record.endedAt ?? record.updatedAt;
}

function isTerminal(record: DelegationWidgetRecord): boolean {
  return !ACTIVE_STATUSES.has(record.status);
}

function plainTheme(): DelegationWidgetTheme {
  return { fg: (_color, text) => text, bold: (text) => text };
}

function safe(value: unknown, fallback = "…"): string {
  return sanitizeTerminalText(value, false) || fallback;
}

function recordLines(
  record: DelegationWidgetRecord,
  now: number,
  frame: number,
  theme: DelegationWidgetTheme,
  last: boolean,
): string[] {
  const status = safe(record.status, "unknown");
  const terminal = isTerminal(record);
  const icon = status === "running"
    ? SPINNER_FRAMES[Math.abs(Math.floor(frame)) % SPINNER_FRAMES.length]
    : status === "queued"
      ? "◦"
      : status === "completed"
        ? "✓"
        : status === "failed" || status === "invalid-envelope" || status === "cancelled" || status === "interrupted"
          ? "✗"
          : "!";
  const color = status === "completed"
    ? "success"
    : status === "failed" || status === "invalid-envelope" || status === "cancelled" || status === "interrupted"
      ? "error"
      : status === "running"
        ? "accent"
        : "warning";
  const branch = last ? "└─" : "├─";
  const agent = safe(record.agent, "unknown-agent");
  const workItem = safe(record.workItemId, "default");
  const description = safe(record.description ?? record.task, "delegated task");
  const start = record.startedAt ?? record.queuedAt ?? now;
  const end = terminalAt(record) ?? now;
  const elapsed = record.durationMs ?? Math.max(0, end - start);
  const primary = [
    theme.fg("muted", branch),
    " ",
    theme.fg(color, icon),
    " ",
    theme.fg("accent", theme.bold(`${agent} [${workItem}]`)),
    theme.fg("muted", `  ${description} · ${formatElapsed(elapsed)}`),
  ].join("");

  const activity = safe(record.latestActivity ?? record.activity ?? (terminal ? record.preview ?? record.output : status), status);
  const model = safe(record.model, "default model");
  const thinking = safe(record.thinking, "default");
  const modelSource = safe(record.modelSource, "");
  const thinkingSource = safe(record.thinkingSource, "");
  const runtime = [
    `model ${model}${modelSource && modelSource !== "…" ? ` (${modelSource})` : ""}`,
    `reasoning ${thinking}${thinkingSource && thinkingSource !== "…" ? ` (${thinkingSource})` : ""}`,
  ].join(" · ");
  const secondary = `${last ? " " : "│"}    ${theme.fg("muted", `⎿ ${activity} · ${runtime}`)}`;
  return [primary, secondary];
}

/** Pure, deterministic widget renderer. All returned lines are width bounded. */
export function renderDelegationWidgetLines(
  records: readonly DelegationWidgetRecord[],
  width: number,
  options: DelegationWidgetRenderOptions = {},
): string[] {
  const availableWidth = Number.isFinite(width) ? Math.max(0, Math.floor(width)) : 0;
  if (availableWidth === 0) return [];
  const now = options.now ?? Date.now();
  const frame = options.frame ?? 0;
  const maxLines = Math.max(1, Math.floor(options.maxLines ?? DEFAULT_MAX_LINES));
  const terminalLingerMs = Math.max(0, options.terminalLingerMs ?? DEFAULT_TERMINAL_LINGER_MS);
  const theme = options.theme ?? plainTheme();

  const visible = records.filter((record) => {
    if (!isTerminal(record)) return true;
    const ended = terminalAt(record);
    return ended === undefined || now - ended <= terminalLingerMs;
  });
  const priority = (record: DelegationWidgetRecord) => record.status === "running" ? 0 : record.status === "queued" ? 1 : 2;
  const ordered = visible
    .map((record, index) => ({ record, index }))
    .sort((left, right) => priority(left.record) - priority(right.record) || left.index - right.index)
    .map(({ record }) => record);
  const running = visible.filter((record) => record.status === "running").length;
  const queued = visible.filter((record) => record.status === "queued").length;
  if (visible.length === 0) return [];
  const headingColor = running ? "success" : queued ? "warning" : "muted";
  const headingStatus = running || queued ? `${running} running · ${queued} queued` : "idle";
  const lines = [theme.fg(headingColor, theme.bold(`● Agents · ${headingStatus}`))];

  let omitted = 0;
  for (let index = 0; index < ordered.length; index++) {
    const candidate = recordLines(ordered[index], now, frame, theme, index === ordered.length - 1);
    const recordsAfter = ordered.length - index - 1;
    const reserveOverflow = recordsAfter > 0 ? 1 : 0;
    if (lines.length + candidate.length + reserveOverflow <= maxLines) {
      lines.push(...candidate);
      continue;
    }
    // In very small budgets, identity is more useful than an empty overflow-only
    // card. Keep the primary line when possible and count hidden detail as overflow.
    if (lines.length < maxLines && index === 0 && recordsAfter === 0) {
      lines.push(candidate[0]);
      break;
    }
    omitted = ordered.length - index;
    break;
  }
  if (omitted > 0 && maxLines > 1) {
    const overflow = theme.fg("dim", `└─ … ${omitted} more agent${omitted === 1 ? "" : "s"}`);
    if (lines.length >= maxLines) lines[maxLines - 1] = overflow;
    else lines.push(overflow);
  }

  return lines.slice(0, maxLines).map((line) => truncateToWidth(line, availableWidth, "…"));
}

interface WidgetTui {
  requestRender(): void;
}

export type DelegationWidgetContext = Pick<ExtensionContext, "mode" | "hasUI" | "ui">;

export interface DelegationWidgetControllerOptions {
  widgetId?: string;
  statusId?: string;
  intervalMs?: number;
  maxLines?: number;
  terminalLingerMs?: number;
  now?: () => number;
  setInterval?: typeof globalThis.setInterval;
  clearInterval?: typeof globalThis.clearInterval;
  records?: () => readonly DelegationWidgetRecord[];
}

/** Session-scoped lifecycle for the live above-editor widget. */
export class DelegationWidgetController {
  private readonly options: Required<Pick<DelegationWidgetControllerOptions,
    "widgetId" | "statusId" | "intervalMs" | "maxLines" | "terminalLingerMs" | "now">> & DelegationWidgetControllerOptions;
  private context?: DelegationWidgetContext;
  private tui?: WidgetTui;
  private records: readonly DelegationWidgetRecord[] = [];
  private timer?: ReturnType<typeof globalThis.setInterval>;
  private frame = 0;
  private registered = false;
  private disposed = false;
  private lastStatus?: string;
  private component?: { render(width: number): string[]; invalidate(): void };

  constructor(options: DelegationWidgetControllerOptions = {}) {
    this.options = {
      ...options,
      widgetId: options.widgetId ?? "itsol-delegation-agents",
      statusId: options.statusId ?? "itsol-delegation",
      intervalMs: options.intervalMs ?? 120,
      maxLines: options.maxLines ?? DEFAULT_MAX_LINES,
      terminalLingerMs: options.terminalLingerMs ?? DEFAULT_TERMINAL_LINGER_MS,
      now: options.now ?? Date.now,
    };
  }

  startSession(context: DelegationWidgetContext): void {
    if (this.context === context && this.registered) return;
    if (this.context) this.clearUi();
    this.context = context;
    this.disposed = false;
    this.registered = false;
    this.tui = undefined;
    if (context.mode === "tui") {
      context.ui.setWidget(this.options.widgetId, (tui, theme) => {
        this.tui = tui;
        const component = {
          render: (width: number) => renderDelegationWidgetLines(this.currentRecords(), width, {
            now: this.options.now(),
            frame: this.frame,
            maxLines: this.options.maxLines,
            terminalLingerMs: this.options.terminalLingerMs,
            theme,
          }),
          invalidate: () => {
            this.requestRender();
          },
        };
        this.component = component;
        return component;
      }, { placement: "aboveEditor" });
      this.registered = true;
    }
    this.syncLifecycle();
  }

  /** Alias useful to integrations that name lifecycle entry simply `start`. */
  start(context: DelegationWidgetContext): void {
    this.startSession(context);
  }

  setRecords(records: readonly DelegationWidgetRecord[]): void {
    this.records = [...records];
    this.syncLifecycle();
  }

  update(records?: readonly DelegationWidgetRecord[]): void {
    if (records) this.records = [...records];
    this.syncLifecycle();
  }

  requestRender(): void {
    if (this.disposed) return;
    this.tui?.requestRender();
  }

  invalidate(): void {
    this.component?.invalidate();
    this.requestRender();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.stopTimer();
    this.clearUi();
    this.context = undefined;
    this.tui = undefined;
    this.component = undefined;
    this.registered = false;
    this.lastStatus = undefined;
    this.records = [];
  }

  shutdown(): void {
    this.dispose();
  }

  private currentRecords(): readonly DelegationWidgetRecord[] {
    return this.options.records?.() ?? this.records;
  }

  private syncLifecycle(): void {
    if (this.disposed) return;
    const records = this.currentRecords();
    const now = this.options.now();
    const running = records.filter((record) => record.status === "running").length;
    const queued = records.filter((record) => record.status === "queued").length;
    const recentTerminal = records.some((record) => {
      if (!isTerminal(record)) return false;
      const ended = terminalAt(record);
      return ended !== undefined && now - ended <= this.options.terminalLingerMs;
    });
    // Running spinners and terminal expiry need frames. A queue-only card is
    // static and therefore intentionally consumes no animation timer.
    if (this.registered && (running > 0 || recentTerminal)) this.startTimer();
    else this.stopTimer();

    if (this.context?.mode === "tui") {
      const nextStatus = running || queued ? `Agents: ${running} running, ${queued} queued` : undefined;
      if (nextStatus !== this.lastStatus) {
        this.context.ui.setStatus(this.options.statusId, nextStatus);
        this.lastStatus = nextStatus;
      }
    }
    this.requestRender();
  }

  private startTimer(): void {
    if (this.timer !== undefined) return;
    const set = this.options.setInterval ?? globalThis.setInterval;
    this.timer = set(() => {
      if (this.disposed) return;
      this.frame++;
      this.syncLifecycle();
    }, this.options.intervalMs);
    (this.timer as { unref?: () => void }).unref?.();
  }

  private stopTimer(): void {
    if (this.timer === undefined) return;
    const clear = this.options.clearInterval ?? globalThis.clearInterval;
    clear(this.timer);
    this.timer = undefined;
  }

  private clearUi(): void {
    if (!this.context || this.context.mode !== "tui") return;
    if (this.registered) this.context.ui.setWidget(this.options.widgetId, undefined);
    this.context.ui.setStatus(this.options.statusId, undefined);
  }
}

export function createDelegationWidgetController(options: DelegationWidgetControllerOptions = {}): DelegationWidgetController {
  return new DelegationWidgetController(options);
}
