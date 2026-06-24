#!/usr/bin/env bash
# fe-figma-gen plugin: pre-tasks hook
# 在生成 tasks.md 前检查是否需要 Figma 相关任务

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

# Check if figma-gen is configured
if [[ ! -f "$FE_FIGMA_GEN_FILE" ]]; then
    exit 0
fi

# Check if spec or plan mentions UI/component/page keywords
has_ui_tasks() {
    local has_ui=false
    
    if [[ -f "$SPEC_FILE" ]] && grep -qiE "(组件|页面|UI|界面|设计)" "$SPEC_FILE"; then
        has_ui=true
    fi
    
    if [[ -f "$PLAN_FILE" ]] && grep -qiE "(组件|页面|UI|界面|设计)" "$PLAN_FILE"; then
        has_ui=true
    fi
    
    $has_ui
}

# Provide hint if UI tasks are detected
if has_ui_tasks; then
    cat >&2 << EOF

📋 Figma 集成已配置

检测到需求涉及 UI 组件或页面开发。

配置文件: $FE_FIGMA_GEN_FILE

EOF
fi

exit 0
