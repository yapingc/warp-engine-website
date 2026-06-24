#!/usr/bin/env bash
# fe-rule plugin: pre-plan hook
# 在 /speckit.plan 执行前检查前端规则是否存在

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$PLUGIN_ROOT/../../.." && pwd)"

# Source detection utility
source "$PLUGIN_ROOT/utils/detect.sh"

# Check if this is a frontend project
if ! is_frontend_project; then
    # Not a frontend project, skip this hook
    exit 0
fi

FE_RULE_FILE="$REPO_ROOT/.specify/memory/fe-rule.md"

if [[ ! -f "$FE_RULE_FILE" ]]; then
    cat >&2 << 'EOF'
⚠️  前端项目检测到，但缺少前端技术栈规则文档

建议操作：
1. 运行 /speckit.fe-rule.scan 自动分析现有项目生成规则
2. 或运行 /speckit.fe-rule.wizard 通过向导手动配置规则

前端规则文档用于确保技术栈约束在整个开发流程中得到遵守。

是否继续执行 /speckit.plan？（将使用通用流程，不包含前端特定约束）
EOF
    # Return non-zero to signal warning (but don't block execution)
    exit 10
fi

echo "✓ 前端规则文档已存在: $FE_RULE_FILE" >&2
exit 0
