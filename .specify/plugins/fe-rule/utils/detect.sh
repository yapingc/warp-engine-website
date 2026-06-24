#!/usr/bin/env bash
# Frontend project detection utility

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"

# Detect if this is a frontend project
is_frontend_project() {
    local package_json="$REPO_ROOT/package.json"

    if [[ ! -f "$package_json" ]]; then
        return 1
    fi

    # Check for frontend framework keywords
    if grep -qE '"(react|vue|svelte|angular|next|nuxt|vite)"' "$package_json"; then
        return 0
    fi

    return 1
}

# Check if fe-rule.md exists
has_fe_rule() {
    [[ -f "$REPO_ROOT/.specify/memory/fe-rule.md" ]]
}

# Main detection logic
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    if is_frontend_project; then
        echo "IS_FRONTEND=true"
        if has_fe_rule; then
            echo "HAS_FE_RULE=true"
        else
            echo "HAS_FE_RULE=false"
        fi
    else
        echo "IS_FRONTEND=false"
    fi
fi
