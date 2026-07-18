import fs from "node:fs";
import path from "node:path";
import { parseFrontmatter } from "@earendil-works/pi-coding-agent";

export interface ItsolAgentConfig {
  name: string;
  description: string;
  model?: string;
  effort?: string;
  skills: string[];
  tools?: string[];
  disallowedTools: string[];
  systemPrompt: string;
  filePath: string;
}

const TOOL_NAME_MAP: Record<string, string> = {
  Read: "read",
  Grep: "grep",
  Glob: "find",
  Bash: "bash",
  Write: "write",
  Edit: "edit",
  MultiEdit: "edit",
};

const DEFAULT_TOOLS = ["read", "bash", "edit", "write", "grep", "find", "ls"];

function stringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String).map((item) => item.trim()).filter(Boolean);
  }
  if (typeof value !== "string") return [];
  const trimmed = value.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    return trimmed
      .slice(1, -1)
      .split(",")
      .map((item) => item.trim().replace(/^['"]|['"]$/g, ""))
      .filter(Boolean);
  }
  return trimmed.split(",").map((item) => item.trim()).filter(Boolean);
}

export function normalizeSkillName(value: string): string {
  const name = value.split(":").at(-1)?.split("/").at(-1)?.trim() ?? "";
  if (!/^[a-z0-9-]+$/.test(name)) {
    throw new Error(`Invalid ITSOL skill name: ${value}`);
  }
  return name;
}

export function mapAgentTools(agent: ItsolAgentConfig): string[] {
  const requested = agent.tools?.length ? agent.tools : DEFAULT_TOOLS;
  const denied = new Set(
    agent.disallowedTools.flatMap((tool) => {
      const mapped = TOOL_NAME_MAP[tool] ?? tool.toLowerCase();
      return mapped === "agent" ? ["itsol_delegate", "subagent"] : [mapped];
    }),
  );

  return [...new Set(requested.map((tool) => TOOL_NAME_MAP[tool] ?? tool.toLowerCase()))]
    .filter((tool) => tool !== "agent" && tool !== "itsol_delegate" && tool !== "subagent")
    .filter((tool) => !denied.has(tool));
}

export function agentCanWrite(agent: ItsolAgentConfig): boolean {
  const tools = new Set(mapAgentTools(agent));
  return tools.has("write") || tools.has("edit");
}

export function discoverItsolAgents(agentsDir: string): ItsolAgentConfig[] {
  if (!fs.existsSync(agentsDir)) return [];

  const agents: ItsolAgentConfig[] = [];
  for (const entry of fs.readdirSync(agentsDir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
    const filePath = path.join(agentsDir, entry.name);
    const content = fs.readFileSync(filePath, "utf8");
    const { frontmatter, body } = parseFrontmatter<Record<string, unknown>>(content);
    const name = typeof frontmatter.name === "string" ? frontmatter.name.trim() : "";
    const description = typeof frontmatter.description === "string" ? frontmatter.description.trim() : "";
    if (!name || !description || !/^[a-z0-9-]+$/.test(name)) continue;

    agents.push({
      name,
      description,
      model: typeof frontmatter.model === "string" ? frontmatter.model : undefined,
      effort: typeof frontmatter.effort === "string" ? frontmatter.effort : undefined,
      skills: stringList(frontmatter.skills).map(normalizeSkillName),
      tools: stringList(frontmatter.tools),
      disallowedTools: stringList(frontmatter.disallowedTools),
      systemPrompt: body.trim(),
      filePath,
    });
  }

  return agents.sort((left, right) => left.name.localeCompare(right.name));
}
