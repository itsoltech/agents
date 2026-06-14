/**
 * ITSOL Powers plugin for OpenCode.
 *
 * Registers the ITSOL Powers skills directory and injects the router skill as
 * bootstrap context so OpenCode sessions start with the same routing behavior
 * as Claude Code/Codex sessions.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const extractAndStripFrontmatter = (content) => {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, content };

  const frontmatterStr = match[1];
  const body = match[2];
  const frontmatter = {};

  for (const line of frontmatterStr.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      const value = line.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, '');
      frontmatter[key] = value;
    }
  }

  return { frontmatter, content: body };
};

let bootstrapCache = undefined;

export const ItsolPowersPlugin = async () => {
  const skillsDir = path.resolve(__dirname, '../../skills');

  const getBootstrapContent = () => {
    if (bootstrapCache !== undefined) return bootstrapCache;

    const skillPath = path.join(skillsDir, 'using-itsolpowers', 'SKILL.md');
    if (!fs.existsSync(skillPath)) {
      bootstrapCache = null;
      return null;
    }

    const fullContent = fs.readFileSync(skillPath, 'utf8');
    const { content } = extractAndStripFrontmatter(fullContent);

    const toolMapping = `**Tool Mapping for OpenCode:**
When ITSOL skills reference tools or runtimes you do not have, substitute OpenCode equivalents:
- \`Task\` tool or Claude Code subagents -> use OpenCode's native subagent system, usually @mention
- \`Skill\` tool -> OpenCode's native \`skill\` tool
- \`TodoWrite\` -> \`todowrite\`
- \`Read\`, \`Write\`, \`Edit\`, \`Bash\` -> your native OpenCode tools

Use OpenCode's native \`skill\` tool to list and load bundled ITSOL skills. If OpenCode displays bundled skill names with a namespace, prefer \`itsolpowers/<skill-name>\`; otherwise use the skill's frontmatter name directly.`;

    bootstrapCache = `<EXTREMELY_IMPORTANT>
You have ITSOL Powers.

**IMPORTANT: The using-itsolpowers skill content is included below. It is ALREADY LOADED - you are currently following it. Do NOT use the skill tool to load "using-itsolpowers" again unless the user explicitly asks to inspect it.**

${content}

${toolMapping}
</EXTREMELY_IMPORTANT>`;

    return bootstrapCache;
  };

  return {
    config: async (config) => {
      config.skills = config.skills || {};
      config.skills.paths = config.skills.paths || [];
      if (!config.skills.paths.includes(skillsDir)) {
        config.skills.paths.push(skillsDir);
      }
    },

    'experimental.chat.messages.transform': async (_input, output) => {
      const bootstrap = getBootstrapContent();
      if (!bootstrap || !output.messages.length) return;

      const firstUser = output.messages.find((message) => message.info.role === 'user');
      if (!firstUser || !firstUser.parts.length) return;

      const alreadyInjected = firstUser.parts.some(
        (part) => part.type === 'text' && part.text.includes('EXTREMELY_IMPORTANT')
      );
      if (alreadyInjected) return;

      const ref = firstUser.parts[0];
      firstUser.parts.unshift({ ...ref, type: 'text', text: bootstrap });
    }
  };
};

export default ItsolPowersPlugin;
