/** ITSOL Powers adapter for OpenCode. */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = path.resolve(__dirname, '../..');
const skillsDir = path.join(pluginRoot, 'skills');
const bootstrapPath = path.join(pluginRoot, 'hooks', 'bootstrap-context.md');

const toolMapping = `**Tool Mapping for OpenCode:**
- Load bundled skills with the native \`skill\` tool. Prefer \`itsolpowers/<skill-name>\` when namespaced; otherwise use the frontmatter name.
- Map ITSOL subagent guidance to OpenCode's native Task/@agent surfaces and permissions.
- Persist Initiative Delivery state and living documents under \`.itsol/initiatives/<id>/\`; use native Task/@agent workstreams phase by phase and update traceability only after validating results.
- For Initiative QA, create application-aware Task/@agent packets, execute real browser/CLI/API/desktop/mobile/data/infra checks, persist a fingerprint-bound verdict, and loop failures through remediation and applicable reviews before fresh QA.
- For Initiative Roadmap review, use a read-only Task/@agent panel for requirements, architecture, QA, self-review, and conditional security/data. Use fresh \`itsol-self-review\` for phase plans; resolve all material findings and never call Pi \`itsol_*\` tools.
- Map \`Read\`, \`Write\`, \`Edit\`, \`Bash\`, and task tracking to native equivalents.
- Delegated agents must use \`permission.task: deny\`; model and reasoning profiles remain advisory unless native agent config enforces them.`;

let bootstrapCache;

export const getBootstrapContent = () => {
  if (bootstrapCache !== undefined) return bootstrapCache;
  if (!fs.existsSync(bootstrapPath)) return (bootstrapCache = null);
  bootstrapCache = `${fs.readFileSync(bootstrapPath, 'utf8').trim()}\n\n${toolMapping}`;
  return bootstrapCache;
};

export const ItsolPowersPlugin = async () => ({
  config: async (config) => {
    config.skills = config.skills || {};
    config.skills.paths = config.skills.paths || [];
    if (!config.skills.paths.includes(skillsDir)) config.skills.paths.push(skillsDir);
  },

  'experimental.chat.messages.transform': async (_input, output) => {
    const bootstrap = getBootstrapContent();
    if (!bootstrap || !output.messages.length) return;

    const firstUser = output.messages.find((message) => message.info.role === 'user');
    if (!firstUser || !firstUser.parts.length) return;
    if (firstUser.parts.some((part) => part.type === 'text' && part.text.includes('You have ITSOL Powers.'))) {
      return;
    }

    const ref = firstUser.parts[0];
    firstUser.parts.unshift({ ...ref, type: 'text', text: bootstrap });
  }
});

export default ItsolPowersPlugin;
