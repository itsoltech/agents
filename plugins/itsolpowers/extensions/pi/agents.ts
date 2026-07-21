import fs from "node:fs";
import path from "node:path";
import { parseFrontmatter } from "@earendil-works/pi-coding-agent";

export interface ItsolAgentConfig {
  name: string;
  description: string;
  skills: string[];
  systemPrompt: string;
  filePath: string;
}

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
      skills: stringList(frontmatter.skills).map(normalizeSkillName),
      systemPrompt: body.trim(),
      filePath,
    });
  }

  return agents.sort((left, right) => left.name.localeCompare(right.name));
}
