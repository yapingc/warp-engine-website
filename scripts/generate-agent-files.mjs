/**
 * generate-agent-files.mjs
 *
 * 从 skills/ 和 rules/ 目录读取 canonical 源文件，生成各 AI agent 识别的技能与规则文件。
 *
 * skills/ → 每个 agent 生成一个独立技能文件（如 .claude/commands/、.cursor/rules/）
 * rules/  → 每个 agent 生成独立规则文件 + 组合文件（如 CLAUDE.md、AGENTS.md）
 *
 * 支持 Claude Code、Cursor、Copilot、Windsurf、Trae、CodeMaker、Cline、Codex/OpenCode/Amp、OpenHands。
 *
 * 用法：
 *   node scripts/generate-agent-files.mjs           # 生成全部 agent
 *   node scripts/generate-agent-files.mjs claude     # 仅生成指定 agent
 *   node scripts/generate-agent-files.mjs --list     # 列出支持的 agent
 *   node scripts/generate-agent-files.mjs --clean    # 清理所有生成的文件
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const SKILLS_DIR = path.join(PROJECT_ROOT, 'skills');
const RULES_DIR = path.join(PROJECT_ROOT, 'rules');

// ─── 解析源文件（skills 和 rules 共用） ──────────────────────────────────────────

function parseSourceFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const frontmatterMatch = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  if (!frontmatterMatch) {
    return { name: path.basename(filePath, '.md'), meta: {}, body: raw };
  }

  const meta = {};
  const yamlLines = frontmatterMatch[1].split('\n');
  let currentKey = null;

  for (const line of yamlLines) {
    const kvMatch = line.match(/^(\w+):\s*(.*)$/);
    if (kvMatch) {
      const [, key, value] = kvMatch;
      if (value.trim() === '') {
        meta[key] = [];
        currentKey = key;
      } else {
        meta[key] = value.trim();
        currentKey = null;
      }
    } else if (currentKey && line.match(/^\s+-\s+(.*)$/)) {
      const item = line.match(/^\s+-\s+(.*)$/)[1].trim().replace(/^"(.*)"$/, '$1');
      meta[currentKey].push(item);
    }
  }

  return {
    name: meta.name || path.basename(filePath, '.md'),
    meta,
    body: frontmatterMatch[2].trim(),
  };
}

// ─── 判断规则是否适用于某 agent ─────────────────────────────────────────────────

function isRuleForAgent(rule, agentKey) {
  const agents = rule.meta.agents;
  if (!agents) return true; // 无限定则适用所有
  if (agents === 'all') return true;
  if (Array.isArray(agents)) return agents.includes(agentKey);
  return String(agents) === agentKey;
}

// ─── Skills: 各 agent 格式生成器 ─────────────────────────────────────────────────

function buildSkillClaudeCommand(skill) {
  return `---\ndescription: ${skill.meta.description || ''}\n---\n\n${skill.body}\n`;
}

function buildSkillCursorRule(skill) {
  return `---\ndescription: ${skill.meta.description || ''}\nglobs:\nalwaysApply: false\n---\n\n${skill.body}\n`;
}

function buildSkillCopilotInstruction(skill) {
  return `---\napplyTo: "**"\n---\n\n# ${skill.name}\n\n${skill.meta.description || ''}\n\n${skill.body}\n`;
}

function buildSkillWindsurfRule(skill) {
  return `# ${skill.name}\n\n${skill.meta.description || ''}\n\n${skill.body}\n`;
}

function buildSkillTraeRule(skill) {
  return `---\ndescription: ${skill.meta.description || ''}\nglobs:\nalwaysApply: false\n---\n\n${skill.body}\n`;
}

function buildSkillCodeMakerRule(skill) {
  return `---\ndescription: ${skill.meta.description || ''}\nalwaysApply: false\nglobs:\n---\n\n${skill.body}\n`;
}

function buildSkillClineRule(skill) {
  return `# ${skill.name}\n\n${skill.meta.description || ''}\n\n${skill.body}\n`;
}

function buildSkillCodexSkill(skill) {
  return `# ${skill.name}\n\n${skill.meta.description || ''}\n\n${skill.body}\n`;
}

// ─── Rules: 各 agent 独立文件格式生成器 ──────────────────────────────────────────

function buildRuleClaudeFile(rule) {
  return `---\ndescription: ${rule.meta.description || ''}\n---\n\n${rule.body}\n`;
}

function buildRuleCursorFile(rule) {
  return `---\ndescription: ${rule.meta.description || ''}\nalwaysApply: true\n---\n\n${rule.body}\n`;
}

function buildRuleTraeFile(rule) {
  return `---\ndescription: ${rule.meta.description || ''}\nalwaysApply: true\n---\n\n${rule.body}\n`;
}

function buildRuleCodeMakerFile(rule) {
  return `---\ndescription: ${rule.meta.description || ''}\nalwaysApply: true\nglobs:\n---\n\n${rule.body}\n`;
}

function buildRuleClineFile(rule) {
  return `# ${rule.name}\n\n${rule.body}\n`;
}

function buildRuleWindsurfFile(rule) {
  return `# ${rule.name}\n\n${rule.body}\n`;
}

function buildRuleOpenHandsFile(rule) {
  const name = rule.meta.openhands_name || rule.name;
  const triggers = rule.meta.openhands_triggers || [];
  let yaml = `---\nname: ${name}\ntype: repo\nagent: CodeActAgent\n`;
  if (triggers.length > 0) {
    yaml += 'triggers:\n';
    for (const t of triggers) {
      yaml += `  - "${t}"\n`;
    }
  }
  yaml += `---\n\n${rule.body}\n`;
  return yaml;
}

// ─── Rules: 组合文件生成器 ───────────────────────────────────────────────────────

function buildClaudeMd(rules) {
  const sections = rules.map((rule) => {
    const tag = rule.name.toUpperCase().replace(/-/g, '_');
    return `<!-- ${tag}_RULES_START -->\n${rule.body}\n<!-- ${tag}_RULES_END -->`;
  });
  return sections.join('\n\n') + '\n';
}

function buildAgentsMd(rules) {
  // AGENTS.md 只包含 agents: all 的规则
  return rules.map((rule) => rule.body).join('\n\n') + '\n';
}

function buildCopilotInstructionsMd(rules) {
  return rules.map((rule) => rule.body).join('\n\n') + '\n';
}

function buildCodexAgentsMd(rules) {
  return rules.map((rule) => rule.body).join('\n\n') + '\n';
}

// ─── Agent 定义 ───────────────────────────────────────────────────────────────

const AGENTS = {
  claude: {
    name: 'Claude Code',
    skillGenerate: (skill) => ({
      path: `.claude/commands/${skill.name}.md`,
      content: buildSkillClaudeCommand(skill),
    }),
    ruleGenerate: (rule) => ({
      path: `.claude/rules/${rule.name}.md`,
      content: buildRuleClaudeFile(rule),
    }),
    combinedRuleFile: 'CLAUDE.md',
    buildCombinedRules: (rules) => buildClaudeMd(rules),
  },
  cursor: {
    name: 'Cursor',
    skillGenerate: (skill) => ({
      path: `.cursor/rules/${skill.name}.mdc`,
      content: buildSkillCursorRule(skill),
    }),
    ruleGenerate: (rule) => ({
      path: `.cursor/rules/${rule.name}.mdc`,
      content: buildRuleCursorFile(rule),
    }),
  },
  copilot: {
    name: 'GitHub Copilot',
    skillGenerate: (skill) => ({
      path: `.github/instructions/${skill.name}.instructions.md`,
      content: buildSkillCopilotInstruction(skill),
    }),
    combinedRuleFile: '.github/copilot-instructions.md',
    buildCombinedRules: (rules) => buildCopilotInstructionsMd(rules),
  },
  windsurf: {
    name: 'Windsurf',
    skillGenerate: (skill) => ({
      path: `.windsurf/rules/${skill.name}.md`,
      content: buildSkillWindsurfRule(skill),
    }),
    ruleGenerate: (rule) => ({
      path: `.windsurf/rules/${rule.name}.md`,
      content: buildRuleWindsurfFile(rule),
    }),
  },
  trae: {
    name: 'Trae',
    skillGenerate: (skill) => ({
      path: `.trae/rules/${skill.name}.md`,
      content: buildSkillTraeRule(skill),
    }),
    ruleGenerate: (rule) => ({
      path: `.trae/rules/${rule.name}.md`,
      content: buildRuleTraeFile(rule),
    }),
  },
  codemaker: {
    name: 'CodeMaker',
    skillGenerate: (skill) => ({
      path: `.codemaker/rules/${skill.name}.mdc`,
      content: buildSkillCodeMakerRule(skill),
    }),
    ruleGenerate: (rule) => ({
      path: `.codemaker/rules/${rule.name}.mdc`,
      content: buildRuleCodeMakerFile(rule),
    }),
  },
  cline: {
    name: 'Cline',
    skillGenerate: (skill) => ({
      path: `.cline/rules/${skill.name}.md`,
      content: buildSkillClineRule(skill),
    }),
    ruleGenerate: (rule) => ({
      path: `.cline/rules/${rule.name}.md`,
      content: buildRuleClineFile(rule),
    }),
  },
  codex: {
    name: 'Codex / OpenCode / Amp',
    skillGenerate: (skill) => ({
      path: `.agents/skills/${skill.name}.md`,
      content: buildSkillCodexSkill(skill),
    }),
    combinedRuleFile: 'AGENTS.md',
    buildCombinedRules: (rules) => buildCodexAgentsMd(rules),
  },
  openhands: {
    name: 'OpenHands',
    ruleGenerate: (rule) => ({
      path: `.openhands/microagents/${rule.meta.openhands_name || rule.name}.md`,
      content: buildRuleOpenHandsFile(rule),
    }),
  },
};

// ─── 文件读取 ────────────────────────────────────────────────────────────────

function getSourceFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => path.join(dir, f));
}

// ─── 生成逻辑 ────────────────────────────────────────────────────────────────

function generateSkillsForAgent(agentKey, skills) {
  const agent = AGENTS[agentKey];
  if (!agent || !agent.skillGenerate) return 0;

  let count = 0;
  for (const skill of skills) {
    const result = agent.skillGenerate(skill);
    const fullPath = path.join(PROJECT_ROOT, result.path);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, result.content, 'utf-8');
    console.log(`  [skill] ${agent.name}: ${result.path}`);
    count++;
  }
  return count;
}

function generateRulesForAgent(agentKey, allRules) {
  const agent = AGENTS[agentKey];
  if (!agent) return 0;

  const applicableRules = allRules.filter((r) => isRuleForAgent(r, agentKey));
  if (applicableRules.length === 0) return 0;

  let count = 0;

  // 1. 生成独立规则文件（如果 agent 定义了 ruleGenerate）
  if (agent.ruleGenerate) {
    for (const rule of applicableRules) {
      const result = agent.ruleGenerate(rule);
      const fullPath = path.join(PROJECT_ROOT, result.path);
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, result.content, 'utf-8');
      console.log(`  [rule]  ${agent.name}: ${result.path}`);
      count++;
    }
  }

  // 2. 生成组合规则文件（如果 agent 定义了 combinedRuleFile）
  if (agent.combinedRuleFile && agent.buildCombinedRules) {
    const combined = agent.buildCombinedRules(applicableRules);
    const fullPath = path.join(PROJECT_ROOT, agent.combinedRuleFile);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, combined, 'utf-8');
    console.log(`  [combined] ${agent.name}: ${agent.combinedRuleFile}`);
    count++;
  }

  return count;
}

// ─── 清理 ────────────────────────────────────────────────────────────────────

function cleanAllGeneratedFiles(skills, rules) {
  let count = 0;

  for (const agentKey of Object.keys(AGENTS)) {
    const agent = AGENTS[agentKey];

    // 清理技能文件
    if (agent.skillGenerate) {
      for (const skill of skills) {
        const result = agent.skillGenerate(skill);
        const fullPath = path.join(PROJECT_ROOT, result.path);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
          console.log(`  已删除: ${result.path}`);
          count++;
        }
      }
    }

    // 清理独立规则文件
    if (agent.ruleGenerate) {
      for (const rule of rules) {
        if (!isRuleForAgent(rule, agentKey)) continue;
        const result = agent.ruleGenerate(rule);
        const fullPath = path.join(PROJECT_ROOT, result.path);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
          console.log(`  已删除: ${result.path}`);
          count++;
        }
      }
    }

    // 清理组合规则文件
    if (agent.combinedRuleFile) {
      const fullPath = path.join(PROJECT_ROOT, agent.combinedRuleFile);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        console.log(`  已删除: ${agent.combinedRuleFile}`);
        count++;
      }
    }
  }

  return count;
}

// ─── 主流程 ──────────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);

  if (args.includes('--list')) {
    console.log('\n支持的 AI agent:\n');
    for (const [key, agent] of Object.entries(AGENTS)) {
      const caps = [];
      if (agent.skillGenerate) caps.push('skills');
      if (agent.ruleGenerate || agent.combinedRuleFile) caps.push('rules');
      console.log(`  ${key.padEnd(12)} → ${agent.name} (${caps.join(', ')})`);
    }
    console.log('\n用法: node scripts/generate-agent-files.mjs [agent1 agent2 ...]\n');
    return;
  }

  const skillFiles = getSourceFiles(SKILLS_DIR);
  const ruleFiles = getSourceFiles(RULES_DIR);

  if (skillFiles.length === 0 && ruleFiles.length === 0) {
    console.log('skills/ 和 rules/ 目录均为空，无内容可生成。');
    return;
  }

  const skills = skillFiles.map(parseSourceFile);
  const rules = ruleFiles.map(parseSourceFile);

  if (skills.length > 0) {
    console.log(`\n找到 ${skills.length} 个技能: ${skills.map((s) => s.name).join(', ')}`);
  }
  if (rules.length > 0) {
    console.log(`找到 ${rules.length} 个规则: ${rules.map((r) => r.name).join(', ')}`);
  }
  console.log('');

  if (args.includes('--clean')) {
    const count = cleanAllGeneratedFiles(skills, rules);
    console.log(`\n已清理 ${count} 个文件。\n`);
    return;
  }

  const targetAgents =
    args.length > 0
      ? args.filter((a) => !a.startsWith('--'))
      : Object.keys(AGENTS);

  let total = 0;
  for (const agentKey of targetAgents) {
    if (!AGENTS[agentKey]) {
      console.error(`  未知 agent: ${agentKey}`);
      continue;
    }
    total += generateSkillsForAgent(agentKey, skills);
    total += generateRulesForAgent(agentKey, rules);
  }

  console.log(`\n完成，共生成 ${total} 个文件。\n`);
}

main();
