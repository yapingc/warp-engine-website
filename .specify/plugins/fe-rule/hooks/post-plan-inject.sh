#!/usr/bin/env bash
# fe-rule plugin: post-plan hook
# 在 plan.md 生成后注入前端约束章节

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$PLUGIN_ROOT/../../.." && pwd)"

# Source common functions
source "$REPO_ROOT/.specify/scripts/bash/common.sh"

# Get feature paths
eval $(get_feature_paths)

FE_RULE_FILE="$REPO_ROOT/.specify/memory/fe-rule.md"
PLAN_FILE="$IMPL_PLAN"

# Check if fe-rule exists
if [[ ! -f "$FE_RULE_FILE" ]]; then
    exit 0
fi

# Check if plan.md exists
if [[ ! -f "$PLAN_FILE" ]]; then
    echo "ERROR: plan.md not found at $PLAN_FILE" >&2
    exit 1
fi

# Check if frontend constraints section already exists
if grep -q "## 前端专属约束" "$PLAN_FILE"; then
    echo "前端约束章节已存在，跳过注入" >&2
    exit 0
fi

# Extract key information from fe-rule.md
extract_fe_rule_summary() {
    local rule_file="$1"

    cat << EOF

---

## 前端专属约束

> 此章节由 fe-rule 插件自动注入，基于 \`.specify/memory/fe-rule.md\`

### 技术栈规则

EOF

    # Extract framework
    if grep -q "## 项目技术栈" "$rule_file"; then
        sed -n '/## 项目技术栈/,/## /p' "$rule_file" | head -n -1
    fi

    cat << EOF

### 代码结构约定

EOF

    # Extract code structure
    if grep -q "## 代码结构" "$rule_file"; then
        sed -n '/## 代码结构/,/## /p' "$rule_file" | head -n -1
    fi

    cat << EOF

### 编码规范

EOF

    # Extract coding standards
    if grep -q "## 编码规范" "$rule_file"; then
        sed -n '/## 编码规范/,/## /p' "$rule_file" | head -n -1
    fi

    cat << EOF

**完整规则**: 详见 [\`.specify/memory/fe-rule.md\`]($REPO_ROOT/.specify/memory/fe-rule.md)

EOF
}

# Find insertion point (before "## Constitution Check" or at end)
if grep -q "## Constitution Check" "$PLAN_FILE"; then
    # Insert before Constitution Check
    INSERTION_LINE=$(grep -n "## Constitution Check" "$PLAN_FILE" | head -1 | cut -d: -f1)
    INSERTION_LINE=$((INSERTION_LINE - 1))

    # Create temp file with injection
    head -n "$INSERTION_LINE" "$PLAN_FILE" > "$PLAN_FILE.tmp"
    extract_fe_rule_summary "$FE_RULE_FILE" >> "$PLAN_FILE.tmp"
    tail -n +"$((INSERTION_LINE + 1))" "$PLAN_FILE" >> "$PLAN_FILE.tmp"

    mv "$PLAN_FILE.tmp" "$PLAN_FILE"
else
    # Append to end
    extract_fe_rule_summary "$FE_RULE_FILE" >> "$PLAN_FILE"
fi

echo "✓ 前端约束章节已注入到 plan.md" >&2
exit 0
