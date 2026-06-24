#!/usr/bin/env bash
# fe-figma-gen plugin: post-plan hook
# 在 plan.md 生成后建议配置 Figma 集成（如果检测到 UI 相关需求）

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$PLUGIN_ROOT/../../.." && pwd)"

# Source common functions
source "$REPO_ROOT/.specify/scripts/bash/common.sh"

# Get feature paths
eval $(get_feature_paths)

SPEC_FILE="$FEATURE_SPEC"
PLAN_FILE="$IMPL_PLAN"
FE_FIGMA_GEN_FILE="$REPO_ROOT/.specify/memory/fe-figma-gen.md"

# Check if spec mentions UI/design/Figma keywords
has_ui_requirements() {
    local spec="$1"

    if [[ ! -f "$spec" ]]; then
        return 1
    fi

    # Check for UI-related keywords (case insensitive)
    if grep -qiE "(UI|页面|设计|Figma|界面|组件|布局)" "$spec"; then
        return 0
    fi

    return 1
}

# Check if already has figma-gen config
if [[ -f "$FE_FIGMA_GEN_FILE" ]]; then
    echo "✓ Figma 构建约束已配置: $FE_FIGMA_GEN_FILE" >&2
    exit 0
fi

# Check if spec has UI requirements
if has_ui_requirements "$SPEC_FILE"; then
    cat >&2 << 'EOF'

💡 检测到 UI 相关需求

建议配置 Figma 构建约束以支持设计到代码的自动生成：

1. 自动扫描: /speckit.fe-figma-gen.scan
   - 自动分析项目结构生成配置

2. 手动配置: /speckit.fe-figma-gen.wizard
   - 通过向导交互式配置

Figma 集成可以帮助你：
- 从 Figma 设计稿自动生成组件代码
- 确保设计与代码的一致性
- 复用共享组件和布局

是否需要配置？（可稍后运行上述命令）

EOF
    # Return special code to indicate suggestion
    exit 20
fi

exit 0
