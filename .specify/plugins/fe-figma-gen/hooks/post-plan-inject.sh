#!/usr/bin/env bash
# fe-figma-gen plugin: post-plan-inject hook
# 在 plan.md 生成后注入 Figma 构建约束章节

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$PLUGIN_ROOT/../../.." && pwd)"

# Source common functions
source "$REPO_ROOT/.specify/scripts/bash/common.sh"
source "$PLUGIN_ROOT/utils/detect.sh"

# Get feature paths
eval $(get_feature_paths)

FE_FIGMA_GEN_FILE="$REPO_ROOT/.specify/memory/fe-figma-gen.md"
PLAN_FILE="$IMPL_PLAN"

# Check if fe-figma-gen.md exists
if [[ ! -f "$FE_FIGMA_GEN_FILE" ]]; then
    exit 0
fi

# Check if plan.md exists
if [[ ! -f "$PLAN_FILE" ]]; then
    echo "ERROR: plan.md not found at $PLAN_FILE" >&2
    exit 1
fi

# Check if Figma constraints section already exists
if grep -q "## Figma 构建约束" "$PLAN_FILE"; then
    echo "Figma 约束章节已存在，跳过注入" >&2
    exit 0
fi

# Extract key information from fe-figma-gen.md
extract_figma_summary() {
    local figma_file="$1"

    cat << EOF

---

## Figma 构建约束

> 此章节由 fe-figma-gen 插件自动注入，基于 \`.specify/memory/fe-figma-gen.md\`

### 技术栈与依赖

EOF

    # Extract tech stack section
    if grep -q "## 技术栈与依赖" "$figma_file"; then
        sed -n '/## 技术栈与依赖/,/## /p' "$figma_file" | head -n -1
    fi

    cat << EOF

### Monorepo 与目录约定

EOF

    # Extract directory conventions
    if grep -q "## Monorepo 与目录约定" "$figma_file"; then
        sed -n '/## Monorepo 与目录约定/,/## /p' "$figma_file" | head -n -1
    fi

    cat << EOF

### Figma 标注约定

EOF

    # Extract Figma annotation rules
    if grep -q "## Figma 标注约定" "$figma_file"; then
        sed -n '/## Figma 标注约定/,/## /p' "$figma_file" | head -n -1
    fi

    cat << EOF

### 其他约束

EOF

    # Extract other constraints
    if grep -q "## 其他约束" "$figma_file"; then
        sed -n '/## 其他约束/,/$/p' "$figma_file"
    fi

    cat << EOF

**完整约束**: 详见 [\`.specify/memory/fe-figma-gen.md\`]($REPO_ROOT/.specify/memory/fe-figma-gen.md)

EOF
}

# Find insertion point (after "## 前端专属约束" if exists, otherwise before "## Constitution Check" or at end)
if grep -q "## 前端专属约束" "$PLAN_FILE"; then
    # Insert after 前端专属约束 section
    INSERTION_LINE=$(grep -n "## 前端专属约束" "$PLAN_FILE" | tail -1 | cut -d: -f1)

    # Find the end of the section (next ## or end of file)
    NEXT_SECTION_LINE=$(tail -n +"$((INSERTION_LINE + 1))" "$PLAN_FILE" | grep -n "^## " | head -1 | cut -d: -f1)

    if [[ -n "$NEXT_SECTION_LINE" ]]; then
        INSERTION_LINE=$((INSERTION_LINE + NEXT_SECTION_LINE - 1))
    else
        # Insert at end
        INSERTION_LINE=$(wc -l < "$PLAN_FILE")
    fi

    # Create temp file with injection
    head -n "$INSERTION_LINE" "$PLAN_FILE" > "$PLAN_FILE.tmp"
    extract_figma_summary "$FE_FIGMA_GEN_FILE" >> "$PLAN_FILE.tmp"
    tail -n +"$((INSERTION_LINE + 1))" "$PLAN_FILE" >> "$PLAN_FILE.tmp"

    mv "$PLAN_FILE.tmp" "$PLAN_FILE"
elif grep -q "## Constitution Check" "$PLAN_FILE"; then
    # Insert before Constitution Check
    INSERTION_LINE=$(grep -n "## Constitution Check" "$PLAN_FILE" | head -1 | cut -d: -f1)
    INSERTION_LINE=$((INSERTION_LINE - 1))

    # Create temp file with injection
    head -n "$INSERTION_LINE" "$PLAN_FILE" > "$PLAN_FILE.tmp"
    extract_figma_summary "$FE_FIGMA_GEN_FILE" >> "$PLAN_FILE.tmp"
    tail -n +"$((INSERTION_LINE + 1))" "$PLAN_FILE" >> "$PLAN_FILE.tmp"

    mv "$PLAN_FILE.tmp" "$PLAN_FILE"
else
    # Append to end
    extract_figma_summary "$FE_FIGMA_GEN_FILE" >> "$PLAN_FILE"
fi

echo "✓ Figma 构建约束章节已注入到 plan.md" >&2
exit 0
