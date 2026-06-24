#!/usr/bin/env bash
# Figma integration detection utility

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"

# Check if fe-figma-gen.md exists
has_figma_config() {
    [[ -f "$REPO_ROOT/.specify/memory/fe-figma-gen.md" ]]
}

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

# Main detection logic
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    if has_figma_config; then
        echo "HAS_FIGMA_CONFIG=true"
    else
        echo "HAS_FIGMA_CONFIG=false"
    fi
fi
