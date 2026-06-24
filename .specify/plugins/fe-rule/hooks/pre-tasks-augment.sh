#!/usr/bin/env bash
# fe-rule plugin: pre-tasks hook
# 在 tasks.md 生成前增强任务，添加前端特定任务

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$PLUGIN_ROOT/../../.." && pwd)"

FE_RULE_FILE="$REPO_ROOT/.specify/memory/fe-rule.md"

# Check if fe-rule exists
if [[ ! -f "$FE_RULE_FILE" ]]; then
    exit 0
fi

# Output JSON with additional frontend tasks
cat << 'EOF'
{
  "plugin": "fe-rule",
  "additional_tasks": [
    {
      "phase": "setup",
      "task_id": "setup-1.1",
      "description": "初始化并验证前端项目设置",
      "details": "1. 检查并创建必要的项目结构（目录、配置文件等）\n2. 安装 fe-rule.md 中定义的依赖\n3. 验证所有配置符合技术栈约束\n4. 设置 ESLint、Prettier、TypeScript 等工具配置",
      "parallel": false,
      "dependencies": [],
      "reference": ".specify/memory/fe-rule.md"
    }
  ],
  "task_augmentations": {
    "validation": {
      "add_checks": [
        "ESLint 检查通过",
        "Prettier 格式化检查通过",
        "TypeScript 类型检查通过"
      ]
    }
  }
}
EOF

exit 0
