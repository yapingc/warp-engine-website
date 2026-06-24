#!/usr/bin/env bash
# Plugin loader for Spec-Kit
# Executes plugin hooks at various lifecycle points

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
PLUGINS_CONFIG="$REPO_ROOT/.specify/plugins.json"

# Check if jq is available
if ! command -v jq &> /dev/null; then
    echo "WARNING: jq not found. Plugin system requires jq for JSON parsing." >&2
    echo "Install jq: https://stedolan.github.io/jq/download/" >&2
    exit 1
fi

# Parse command line arguments
HOOK_NAME=""
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --hook)
            HOOK_NAME="$2"
            shift 2
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        *)
            echo "Unknown argument: $1" >&2
            exit 1
            ;;
    esac
done

if [[ -z "$HOOK_NAME" ]]; then
    echo "Usage: $0 --hook <hook-name> [--verbose]" >&2
    echo "Available hooks: pre-plan, post-plan, pre-tasks, post-tasks" >&2
    exit 1
fi

# Check if plugins config exists
if [[ ! -f "$PLUGINS_CONFIG" ]]; then
    if $VERBOSE; then
        echo "No plugins.json found, skipping plugin hooks" >&2
    fi
    exit 0
fi

# Get list of enabled plugins
ENABLED_PLUGINS=$(jq -r '.plugins[] | select(.enabled == true) | .id' "$PLUGINS_CONFIG")

if [[ -z "$ENABLED_PLUGINS" ]]; then
    if $VERBOSE; then
        echo "No enabled plugins found" >&2
    fi
    exit 0
fi

# Execute hooks for each plugin
EXIT_CODE=0

for plugin_id in $ENABLED_PLUGINS; do
    # Get all hook scripts for this plugin and hook name
    # This supports multiple operations in a single hook (e.g., suggest + inject)
    HOOK_SCRIPTS=$(jq -r --arg pid "$plugin_id" --arg hook "$HOOK_NAME" \
        '.plugins[] | select(.id == $pid) | .hooks[$hook] | select(. != null) | to_entries[] | .value' \
        "$PLUGINS_CONFIG" 2>/dev/null || echo "")

    if [[ -z "$HOOK_SCRIPTS" ]]; then
        if $VERBOSE; then
            echo "Plugin '$plugin_id': No hook for '$HOOK_NAME'" >&2
        fi
        continue
    fi

    # Execute each hook script for this plugin
    while IFS= read -r HOOK_SCRIPT; do
        if [[ -z "$HOOK_SCRIPT" ]]; then
            continue
        fi

        HOOK_PATH="$REPO_ROOT/$HOOK_SCRIPT"

        if [[ ! -f "$HOOK_PATH" ]]; then
            echo "WARNING: Hook script not found: $HOOK_PATH" >&2
            continue
        fi

        if [[ ! -x "$HOOK_PATH" ]]; then
            echo "WARNING: Hook script not executable: $HOOK_PATH" >&2
            echo "Run: chmod +x $HOOK_PATH" >&2
            continue
        fi

        # Extract operation name from script filename (e.g., post-plan-inject.sh -> inject)
        OPERATION_NAME=$(basename "$HOOK_SCRIPT" | sed 's/.*-\([^-]*\)\.sh$/\1/')

        if $VERBOSE; then
            echo "Executing plugin '$plugin_id' hook '$HOOK_NAME' [$OPERATION_NAME]: $HOOK_PATH" >&2
        fi

        # Execute hook and capture exit code
        set +e
        "$HOOK_PATH"
        HOOK_EXIT=$?
        set -e

        # Handle different exit codes
        case $HOOK_EXIT in
            0)
                # Success
                if $VERBOSE; then
                    echo "Plugin '$plugin_id' hook '$HOOK_NAME' [$OPERATION_NAME]: OK" >&2
                fi
                ;;
            10)
                # Warning (non-blocking)
                if $VERBOSE; then
                    echo "Plugin '$plugin_id' hook '$HOOK_NAME' [$OPERATION_NAME]: WARNING (non-blocking)" >&2
                fi
                ;;
            20)
                # Suggestion (non-blocking)
                if $VERBOSE; then
                    echo "Plugin '$plugin_id' hook '$HOOK_NAME' [$OPERATION_NAME]: SUGGESTION" >&2
                fi
                ;;
            *)
                # Error
                echo "ERROR: Plugin '$plugin_id' hook '$HOOK_NAME' [$OPERATION_NAME] failed with exit code $HOOK_EXIT" >&2
                EXIT_CODE=$HOOK_EXIT
                ;;
        esac
    done <<< "$HOOK_SCRIPTS"
done

exit $EXIT_CODE
