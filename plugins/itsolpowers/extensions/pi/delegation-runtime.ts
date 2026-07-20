import fs from "node:fs";
import path from "node:path";

export type DelegationRecordStatus = "queued" | "running" | "completed" | "partial" | "blocked" | "failed" | "invalid-envelope" | string;

export interface CanonicalWriteScope {
  /** Canonical absolute path (or the canonical non-glob prefix for a wildcard scope). */
  path: string;
  /** Canonical repository root, or canonical effective cwd outside a repository. */
  domain: string;
  wildcard: boolean;
  root: boolean;
  original: string;
}

function foldCase(value: string): string {
  return process.platform === "win32" || process.platform === "darwin" ? value.toLocaleLowerCase("en-US") : value;
}

function canonicalExistingPrefix(value: string, caseFold = true): string {
  let cursor = path.resolve(value);
  const suffix: string[] = [];
  while (!fs.existsSync(cursor)) {
    const parent = path.dirname(cursor);
    if (parent === cursor) break;
    suffix.unshift(path.basename(cursor));
    cursor = parent;
  }
  let canonical = cursor;
  try {
    canonical = fs.realpathSync.native(cursor);
  } catch {
    canonical = path.resolve(cursor);
  }
  const resolved = path.resolve(canonical, ...suffix);
  return caseFold ? foldCase(resolved) : resolved;
}

function isBoundaryAncestor(parent: string, child: string): boolean {
  const relative = path.relative(parent, child);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function repositoryDomain(cwd: string): string {
  let cursor = cwd;
  while (true) {
    if (fs.existsSync(path.join(cursor, ".git"))) return cursor;
    const parent = path.dirname(cursor);
    if (parent === cursor) return cwd;
    cursor = parent;
  }
}

/** Resolve a writable scope conservatively against the child cwd. */
export function canonicalizeWriteScope(cwd: string, scope: string): CanonicalWriteScope {
  // Find repository ownership before conservative case folding so case-sensitive
  // macOS volumes can still discover a mixed-case .git ancestor.
  const canonicalCwdRaw = canonicalExistingPrefix(cwd, false);
  const canonicalCwd = foldCase(canonicalCwdRaw);
  const original = scope || ".";
  const wildcardIndex = original.search(/[*?[\]{}]/);
  const wildcard = wildcardIndex >= 0;
  let resolvable = wildcard ? original.slice(0, wildcardIndex) : original;
  // A partial filename before a glob is not an ownership boundary. Its parent is.
  if (wildcard && resolvable && !/[\\/]$/.test(resolvable)) resolvable = path.dirname(resolvable);
  if (!resolvable) resolvable = ".";
  const absoluteRaw = canonicalExistingPrefix(
    path.isAbsolute(resolvable) ? resolvable : path.resolve(canonicalCwdRaw, resolvable),
    false,
  );
  const absolute = foldCase(absoluteRaw);
  const domain = foldCase(repositoryDomain(canonicalCwdRaw));
  return {
    path: absolute,
    domain,
    wildcard,
    root: !wildcard && absolute === canonicalCwd,
    original,
  };
}

/** Return true when two canonical ownership scopes cannot safely be active together. */
export function writeScopesConflict(left: CanonicalWriteScope, right: CanonicalWriteScope): boolean {
  // Wildcard scopes are canonicalized to their conservative static directory
  // prefix, so disjoint prefixes are safe while shared/ancestor prefixes conflict.
  return isBoundaryAncestor(left.path, right.path) || isBoundaryAncestor(right.path, left.path);
}

export interface DelegationRuntimeProgress {
  activity: string;
  elapsedMs?: number;
}

export interface DelegationRunnerContext<TPacket> {
  packet: TPacket;
  taskId: string;
  delegationId: string;
  recordId: string;
  agent: string;
  workItemId: string;
  signal: AbortSignal;
  progress(update: string | DelegationRuntimeProgress): void;
  generation: number;
}

export type DelegationRunner<TPacket, TResult> = (context: DelegationRunnerContext<TPacket>) => Promise<TResult>;

export interface DelegationAdmissionItem<TPacket> {
  agent: string;
  workItemId: string;
  description: string;
  packet: TPacket;
  cwd: string;
  writeScopes?: readonly string[];
  model?: string;
  modelSource?: string;
  thinking?: string;
  thinkingSource?: string;
}

export interface DelegationAdmission<TPacket> {
  taskId: string;
  maxParallel: number;
  items: readonly DelegationAdmissionItem<TPacket>[];
  runInBackground?: boolean;
  delegationId?: string;
  signal?: AbortSignal;
}

export interface DelegationRecordSnapshot<TPacket = unknown, TResult = unknown> {
  id: string;
  taskId: string;
  delegationId: string;
  agent: string;
  workItemId: string;
  description: string;
  packet: TPacket;
  status: DelegationRecordStatus;
  activity: string;
  queuedAt: number;
  startedAt?: number;
  finishedAt?: number;
  model?: string;
  modelSource?: string;
  thinking?: string;
  thinkingSource?: string;
  writeScopes: readonly CanonicalWriteScope[];
  result?: TResult;
}

export interface DelegationGroupSnapshot<TPacket = unknown, TResult = unknown> {
  taskId: string;
  delegationId: string;
  runInBackground: boolean;
  createdAt: number;
  status: "active" | "terminal";
  records: readonly DelegationRecordSnapshot<TPacket, TResult>[];
}

export interface BackgroundDelegationAcknowledgement {
  taskId: string;
  delegationId: string;
  accepted: number;
  running: number;
  queued: number;
  workItems: ReadonlyArray<{ agent: string; workItemId: string }>;
  message: "Background acknowledgement only; this is not completion evidence. Results will arrive as a follow-up.";
}

export type DelegationHookPhase = "record-change" | "record-terminal" | "group-terminal";

export interface DelegationRuntimeHooks<TPacket, TResult> {
  /** Called synchronously before records become visible or runners start. Throw to reject admission atomically. */
  onAdmit?(group: DelegationGroupSnapshot<TPacket, TResult>): void;
  onRecordChange?(record: DelegationRecordSnapshot<TPacket, TResult>): void;
  /** Awaited before a completed record frees its task slot. Suitable for durable terminal accounting. */
  onRecordTerminal?(record: DelegationRecordSnapshot<TPacket, TResult>): void | Promise<void>;
  onGroupTerminal?(group: DelegationGroupSnapshot<TPacket, TResult>): void | Promise<void>;
  /** Observer failures are contained so scheduling and settlement remain live. This callback must not throw. */
  onHookError?(error: unknown, phase: DelegationHookPhase, snapshot: DelegationRecordSnapshot<TPacket, TResult> | DelegationGroupSnapshot<TPacket, TResult>): void;
}

export interface DelegationCoordinatorOptions<TPacket, TResult> {
  runner: DelegationRunner<TPacket, TResult>;
  hooks?: DelegationRuntimeHooks<TPacket, TResult>;
  now?: () => number;
  createDelegationId?: () => string;
  resultStatus?: (result: TResult) => DelegationRecordStatus;
  failureResult?: (error: unknown, record: DelegationRecordSnapshot<TPacket, TResult>) => TResult;
  cancellationResult?: (reason: string, record: DelegationRecordSnapshot<TPacket, TResult>) => TResult;
  maxOutstandingRecords?: number;
  maxBackgroundGroups?: number;
  reportStorageBytes?: () => number;
  maxReportStorageBytes?: number;
  reportReserveBytes?: number;
  shutdownTimeoutMs?: number;
}

interface RuntimeRecord<TPacket, TResult> extends DelegationRecordSnapshot<TPacket, TResult> {
  controller?: AbortController;
  terminal: boolean;
  terminalHookCalled: boolean;
}

interface RuntimeGroup<TPacket, TResult> {
  taskId: string;
  delegationId: string;
  runInBackground: boolean;
  createdAt: number;
  records: RuntimeRecord<TPacket, TResult>[];
  settled: boolean;
  resolve: (snapshot: DelegationGroupSnapshot<TPacket, TResult>) => void;
  promise: Promise<DelegationGroupSnapshot<TPacket, TResult>>;
  signal?: AbortSignal;
  abortListener?: () => void;
}

const ACKNOWLEDGEMENT = "Background acknowledgement only; this is not completion evidence. Results will arrive as a follow-up." as const;

export class DelegationCoordinator<TPacket, TResult> {
  private readonly groups = new Map<string, RuntimeGroup<TPacket, TResult>>();
  private readonly records = new Map<string, RuntimeRecord<TPacket, TResult>>();
  private readonly queues = new Map<string, RuntimeRecord<TPacket, TResult>[]>();
  private readonly runningByTask = new Map<string, number>();
  private readonly parallelByTask = new Map<string, number>();
  private readonly runningPromises = new Set<Promise<void>>();
  private readonly runningPromiseByRecord = new Map<string, Promise<void>>();
  private readonly lingeringRunnerIds = new Set<string>();
  private readonly lingeringWriteScopes = new Map<string, readonly CanonicalWriteScope[]>();
  private generation = 1;
  private closing = false;
  private shutdownPromise?: Promise<void>;
  private sequence = 0;

  constructor(private readonly options: DelegationCoordinatorOptions<TPacket, TResult>) {}

  startSession(): number {
    if (this.activeRecordCount > 0) throw new Error("Cannot replace a delegation session while agents are active; call shutdown first");
    for (const [delegationId, group] of this.groups) {
      if (group.settled) this.releaseGroup(delegationId);
    }
    this.queues.clear();
    this.runningByTask.clear();
    this.parallelByTask.clear();
    this.generation++;
    this.closing = false;
    this.shutdownPromise = undefined;
    return this.generation;
  }

  get sessionGeneration(): number { return this.generation; }
  get isClosing(): boolean { return this.closing; }
  get activeRecordCount(): number { return [...this.records.values()].filter((record) => !record.terminal).length; }
  get lingeringRunnerCount(): number { return this.lingeringRunnerIds.size; }

  admit(input: DelegationAdmission<TPacket>): BackgroundDelegationAcknowledgement | Promise<DelegationGroupSnapshot<TPacket, TResult>> {
    if (this.closing) throw new Error("Delegation runtime is shutting down");
    if (!input.items.length) throw new Error("Delegation requires at least one work item");
    if (!Number.isInteger(input.maxParallel) || input.maxParallel < 0) throw new Error("maxParallel must be a non-negative integer");
    if (input.maxParallel === 0) throw new Error("Cannot delegate non-empty work when max_parallel is 0");

    const maxRecords = this.options.maxOutstandingRecords ?? 32;
    if (this.activeRecordCount + input.items.length > maxRecords) {
      throw new Error(`Delegation backpressure: at most ${maxRecords} queued/running work items are allowed`);
    }
    const runInBackground = input.runInBackground !== false;
    const backgroundGroups = [...this.groups.values()].filter((group) => group.runInBackground).length;
    const maxGroups = this.options.maxBackgroundGroups ?? 16;
    if (runInBackground && backgroundGroups >= maxGroups) {
      throw new Error(`Delegation backpressure: at most ${maxGroups} outstanding background groups are allowed`);
    }
    const storage = this.options.reportStorageBytes?.() ?? 0;
    const reserve = this.options.reportReserveBytes ?? 100 * 1024;
    const storageLimit = this.options.maxReportStorageBytes ?? 8 * 1024 * 1024;
    if (runInBackground && storage + reserve > storageLimit) {
      throw new Error("Delegation backpressure: persisted background-report storage limit would be exceeded");
    }

    const existingLimit = this.parallelByTask.get(input.taskId);
    if (existingLimit !== undefined && existingLimit !== input.maxParallel) {
      throw new Error(`Task ${input.taskId} already has active work pinned to max_parallel=${existingLimit}`);
    }

    const delegationId = input.delegationId ?? this.options.createDelegationId?.() ?? `delegation-${this.generation}-${++this.sequence}`;
    if (this.groups.has(delegationId)) throw new Error(`Duplicate delegation_id: ${delegationId}`);
    const now = this.now();
    const seen = new Set<string>();
    const candidates = input.items.map((item, index): RuntimeRecord<TPacket, TResult> => {
      const identity = `${input.taskId}\u0000${item.agent}\u0000${item.workItemId}`;
      if (seen.has(identity) || [...this.records.values()].some((record) => !record.terminal && `${record.taskId}\u0000${record.agent}\u0000${record.workItemId}` === identity)) {
        throw new Error(`Duplicate active work item: ${item.agent} [${item.workItemId}] for task ${input.taskId}`);
      }
      seen.add(identity);
      const scopes = (item.writeScopes ?? []).map((scope) => canonicalizeWriteScope(item.cwd, scope));
      return {
        id: `${this.generation}:${delegationId}:${index}:${item.agent}:${item.workItemId}`,
        taskId: input.taskId,
        delegationId,
        agent: item.agent,
        workItemId: item.workItemId,
        description: item.description,
        packet: item.packet,
        status: "queued",
        activity: "queued",
        queuedAt: now,
        model: item.model,
        modelSource: item.modelSource,
        thinking: item.thinking,
        thinkingSource: item.thinkingSource,
        writeScopes: scopes,
        terminal: false,
        terminalHookCalled: false,
      };
    });

    const active = [...this.records.values()].filter((record) => !record.terminal);
    for (let index = 0; index < candidates.length; index++) {
      const others = [...active, ...candidates.slice(0, index)];
      for (const candidateScope of candidates[index].writeScopes) {
        for (const [recordId, lingeringScopes] of this.lingeringWriteScopes) {
          if (lingeringScopes.some((scope) => writeScopesConflict(candidateScope, scope))) {
            throw new Error(`Write scope conflict: ${candidates[index].agent} [${candidates[index].workItemId}] overlaps lingering runner ${recordId}`);
          }
        }
        for (const owner of others) {
          const conflict = owner.writeScopes.some((ownerScope) => writeScopesConflict(candidateScope, ownerScope));
          if (conflict) throw new Error(`Write scope conflict: ${candidates[index].agent} [${candidates[index].workItemId}] overlaps active ${owner.agent} [${owner.workItemId}]`);
        }
      }
    }

    let resolve!: (snapshot: DelegationGroupSnapshot<TPacket, TResult>) => void;
    const promise = new Promise<DelegationGroupSnapshot<TPacket, TResult>>((done) => { resolve = done; });
    const group: RuntimeGroup<TPacket, TResult> = {
      taskId: input.taskId, delegationId, runInBackground, createdAt: now, records: candidates,
      settled: false, resolve, promise, signal: input.signal,
    };
    // This is the transaction boundary exposed to task-state integration. No map/queue is changed before it succeeds.
    this.options.hooks?.onAdmit?.(this.snapshotGroupValue(group));
    this.groups.set(delegationId, group);
    this.parallelByTask.set(input.taskId, input.maxParallel);
    const queue = this.queues.get(input.taskId) ?? [];
    queue.push(...candidates);
    this.queues.set(input.taskId, queue);
    for (const record of candidates) {
      this.records.set(record.id, record);
      this.emitRecord(record);
    }

    let preCancelled = false;
    if (!runInBackground && input.signal) {
      const cancel = () => { void this.cancelGroup(delegationId, "Foreground delegation was cancelled"); };
      group.abortListener = cancel;
      if (input.signal.aborted) {
        preCancelled = true;
        cancel();
      } else input.signal.addEventListener("abort", cancel, { once: true });
    }
    if (!preCancelled) this.drain(input.taskId);

    if (!runInBackground) return group.promise;
    const snapshot = this.snapshotGroupValue(group);
    return {
      taskId: input.taskId,
      delegationId,
      accepted: candidates.length,
      running: snapshot.records.filter((record) => record.status === "running").length,
      queued: snapshot.records.filter((record) => record.status === "queued").length,
      workItems: candidates.map(({ agent, workItemId }) => ({ agent, workItemId })),
      message: ACKNOWLEDGEMENT,
    };
  }

  enqueue(input: DelegationAdmission<TPacket>): BackgroundDelegationAcknowledgement | Promise<DelegationGroupSnapshot<TPacket, TResult>> {
    return this.admit(input);
  }

  waitForGroup(delegationId: string): Promise<DelegationGroupSnapshot<TPacket, TResult>> {
    const group = this.groups.get(delegationId);
    if (!group) throw new Error(`Unknown delegation group: ${delegationId}`);
    return group.promise;
  }

  getRecord(id: string): DelegationRecordSnapshot<TPacket, TResult> | undefined {
    const record = this.records.get(id);
    return record ? this.snapshotRecord(record) : undefined;
  }

  getGroup(delegationId: string): DelegationGroupSnapshot<TPacket, TResult> | undefined {
    const group = this.groups.get(delegationId);
    return group ? this.snapshotGroupValue(group) : undefined;
  }

  snapshotRecords(): readonly DelegationRecordSnapshot<TPacket, TResult>[] {
    return [...this.records.values()].map((record) => this.snapshotRecord(record));
  }

  snapshotGroups(): readonly DelegationGroupSnapshot<TPacket, TResult>[] {
    return [...this.groups.values()].map((group) => this.snapshotGroupValue(group));
  }

  activeWriteScopes(): readonly { recordId: string; scope: CanonicalWriteScope }[] {
    const active = [...this.records.values()].filter((record) => !record.terminal)
      .flatMap((record) => record.writeScopes.map((scope) => ({ recordId: record.id, scope: { ...scope } })));
    const lingering = [...this.lingeringWriteScopes.entries()]
      .flatMap(([recordId, scopes]) => scopes.map((scope) => ({ recordId, scope: { ...scope } })));
    return [...active, ...lingering];
  }

  /** Remove a terminal group after its notification/retrieval obligation has been durably consumed. */
  releaseGroup(delegationId: string): boolean {
    const group = this.groups.get(delegationId);
    if (!group || !group.settled) return false;
    this.groups.delete(delegationId);
    for (const record of group.records) this.records.delete(record.id);
    return true;
  }

  async cancelGroup(delegationId: string, reason = "Delegation cancelled"): Promise<void> {
    const group = this.groups.get(delegationId);
    if (!group || group.settled) return;
    for (const record of group.records) {
      if (record.terminal) continue;
      if (record.status === "running") record.controller?.abort(reason);
      else await this.finishRecord(record, this.cancellationResult(reason, record), true);
    }
    this.drain(group.taskId);
  }

  shutdown(reason = "Delegation cancelled by session shutdown"): Promise<void> {
    if (this.shutdownPromise) return this.shutdownPromise;
    this.closing = true;
    const oldGeneration = this.generation;
    this.generation++;
    this.shutdownPromise = (async () => {
      for (const record of this.records.values()) {
        if (record.terminal) continue;
        if (record.status === "running") record.controller?.abort(reason);
        else await this.finishRecord(record, this.cancellationResult(reason, record), true);
      }
      const running = [...this.runningPromises];
      if (running.length) {
        await Promise.race([
          Promise.allSettled(running),
          new Promise<void>((resolve) => setTimeout(resolve, this.options.shutdownTimeoutMs ?? 6_000)),
        ]);
      }
      for (const record of this.records.values()) {
        if (record.terminal) continue;
        if (record.startedAt !== undefined && this.runningPromiseByRecord.has(record.id)) {
          this.lingeringRunnerIds.add(record.id);
          if (record.writeScopes.length) this.lingeringWriteScopes.set(record.id, record.writeScopes.map((scope) => ({ ...scope })));
        }
        await this.finishRecord(record, this.cancellationResult(reason, record), true);
      }
      this.queues.clear();
      this.runningByTask.clear();
      this.parallelByTask.clear();
      // oldGeneration is intentionally captured: runner callbacks from it are stale after the increment above.
      void oldGeneration;
    })();
    return this.shutdownPromise;
  }

  private drain(taskId: string): void {
    if (this.closing) return;
    const queue = this.queues.get(taskId);
    const limit = this.parallelByTask.get(taskId) ?? 0;
    let running = this.runningByTask.get(taskId) ?? 0;
    while (queue?.length && running < limit) {
      const record = queue.shift()!;
      if (record.terminal) continue;
      running++;
      this.runningByTask.set(taskId, running);
      this.startRecord(record);
    }
    if (queue && queue.length === 0) this.queues.delete(taskId);
  }

  private startRecord(record: RuntimeRecord<TPacket, TResult>): void {
    const generation = this.generation;
    record.status = "running";
    record.activity = "analyzing task";
    record.startedAt = this.now();
    record.controller = new AbortController();
    this.emitRecord(record);
    let runningPromise!: Promise<void>;
    runningPromise = Promise.resolve().then(() => this.options.runner({
      packet: record.packet,
      taskId: record.taskId,
      delegationId: record.delegationId,
      recordId: record.id,
      agent: record.agent,
      workItemId: record.workItemId,
      signal: record.controller!.signal,
      generation,
      progress: (update) => {
        if (generation !== this.generation || record.terminal) return;
        record.activity = typeof update === "string" ? update : update.activity;
        this.emitRecord(record);
      },
    })).then(async (result) => {
      if (generation !== this.generation || record.terminal) return;
      await this.finishRecord(record, result);
    }, async (error) => {
      if (generation !== this.generation || record.terminal) return;
      await this.finishRecord(record, this.failureResult(error, record));
    }).finally(() => {
      this.runningPromises.delete(runningPromise);
      this.runningPromiseByRecord.delete(record.id);
      this.lingeringRunnerIds.delete(record.id);
      this.lingeringWriteScopes.delete(record.id);
    });
    this.runningPromises.add(runningPromise);
    this.runningPromiseByRecord.set(record.id, runningPromise);
  }

  private async finishRecord(record: RuntimeRecord<TPacket, TResult>, result: TResult, duringShutdown = false): Promise<void> {
    if (record.terminal) return;
    record.terminal = true;
    record.result = result;
    record.status = this.options.resultStatus?.(result) ?? String((result as { status?: unknown })?.status ?? "completed");
    record.finishedAt = this.now();
    record.activity = record.status;
    record.controller = undefined;
    this.emitRecord(record);
    if (!record.terminalHookCalled) {
      record.terminalHookCalled = true;
      const snapshot = this.snapshotRecord(record);
      try {
        await this.options.hooks?.onRecordTerminal?.(snapshot);
      } catch (error) {
        this.reportHookError(error, "record-terminal", snapshot);
      }
    }
    const running = this.runningByTask.get(record.taskId) ?? 0;
    if (record.startedAt !== undefined) {
      if (running <= 1) this.runningByTask.delete(record.taskId);
      else this.runningByTask.set(record.taskId, running - 1);
    } else {
      const queue = this.queues.get(record.taskId);
      if (queue) this.queues.set(record.taskId, queue.filter((item) => item !== record));
    }
    await this.maybeFinishGroup(record.delegationId);
    if (!duringShutdown) this.drain(record.taskId);
    this.cleanupTaskLimit(record.taskId);
  }

  private async maybeFinishGroup(delegationId: string): Promise<void> {
    const group = this.groups.get(delegationId);
    if (!group || group.settled || group.records.some((record) => !record.terminal)) return;
    group.settled = true;
    if (group.signal && group.abortListener) group.signal.removeEventListener("abort", group.abortListener);
    const snapshot = this.snapshotGroupValue(group);
    try {
      await this.options.hooks?.onGroupTerminal?.(snapshot);
    } catch (error) {
      this.reportHookError(error, "group-terminal", snapshot);
    } finally {
      group.resolve(snapshot);
    }
  }

  private cleanupTaskLimit(taskId: string): void {
    if ([...this.records.values()].some((record) => record.taskId === taskId && !record.terminal)) return;
    this.parallelByTask.delete(taskId);
  }

  private failureResult(error: unknown, record: RuntimeRecord<TPacket, TResult>): TResult {
    if (this.options.failureResult) return this.options.failureResult(error, this.snapshotRecord(record));
    return { status: "failed", output: error instanceof Error ? error.message : String(error) } as TResult;
  }

  private cancellationResult(reason: string, record: RuntimeRecord<TPacket, TResult>): TResult {
    if (this.options.cancellationResult) return this.options.cancellationResult(reason, this.snapshotRecord(record));
    return { status: "failed", output: reason } as TResult;
  }

  private emitRecord(record: RuntimeRecord<TPacket, TResult>): void {
    const snapshot = this.snapshotRecord(record);
    try {
      this.options.hooks?.onRecordChange?.(snapshot);
    } catch (error) {
      this.reportHookError(error, "record-change", snapshot);
    }
  }

  private reportHookError(
    error: unknown,
    phase: DelegationHookPhase,
    snapshot: DelegationRecordSnapshot<TPacket, TResult> | DelegationGroupSnapshot<TPacket, TResult>,
  ): void {
    try { this.options.hooks?.onHookError?.(error, phase, snapshot); } catch { /* observer errors must not stop scheduling */ }
  }

  private snapshotRecord(record: RuntimeRecord<TPacket, TResult>): DelegationRecordSnapshot<TPacket, TResult> {
    return {
      id: record.id, taskId: record.taskId, delegationId: record.delegationId,
      agent: record.agent, workItemId: record.workItemId, description: record.description,
      packet: record.packet, status: record.status, activity: record.activity,
      queuedAt: record.queuedAt, startedAt: record.startedAt, finishedAt: record.finishedAt,
      model: record.model, modelSource: record.modelSource, thinking: record.thinking,
      thinkingSource: record.thinkingSource, writeScopes: record.writeScopes.map((scope) => ({ ...scope })),
      result: record.result,
    };
  }

  private snapshotGroupValue(group: RuntimeGroup<TPacket, TResult>): DelegationGroupSnapshot<TPacket, TResult> {
    return {
      taskId: group.taskId, delegationId: group.delegationId,
      runInBackground: group.runInBackground, createdAt: group.createdAt,
      status: group.records.every((record) => record.terminal) ? "terminal" : "active",
      records: group.records.map((record) => this.snapshotRecord(record)),
    };
  }

  private now(): number { return this.options.now?.() ?? Date.now(); }
}

/** More explicit alias for integration code. */
export const DelegationRuntime = DelegationCoordinator;

export function createDelegationCoordinator<TPacket, TResult>(
  options: DelegationCoordinatorOptions<TPacket, TResult>,
): DelegationCoordinator<TPacket, TResult> {
  return new DelegationCoordinator(options);
}
