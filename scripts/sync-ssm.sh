#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MANIFEST="$PROJECT_ROOT/copilot/api/manifest.yml"
ENV_FILE="$PROJECT_ROOT/apps/api/.env"

APP="${1:-fine}"
ENV="${2:-dev}"

if [[ ! -f "$MANIFEST" ]]; then
  echo "ERROR: Manifest not found at $MANIFEST" >&2
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: .env file not found at $ENV_FILE" >&2
  exit 1
fi

# Extract "  KEY: /path" lines from the secrets block
in_secrets=false
while IFS= read -r line; do
  if echo "$line" | grep -q '^secrets:'; then
    in_secrets=true
    continue
  fi
  if $in_secrets; then
    # Stop at next top-level key (non-indented, non-empty)
    if echo "$line" | grep -q '^[^ ]'; then
      break
    fi
    # Skip blank lines
    [[ -z "$(echo "$line" | tr -d '[:space:]')" ]] && continue

    env_var="$(echo "$line" | sed 's/^ *//' | cut -d: -f1)"
    ssm_path="$(echo "$line" | sed 's/^ *//' | cut -d: -f2 | sed 's/^ *//')"
    [[ -z "$env_var" || -z "$ssm_path" ]] && continue

    # Check if parameter already exists
    if aws ssm get-parameter --name "$ssm_path" --no-paginate &>/dev/null; then
      echo "SKIP $ssm_path (already exists)"
      continue
    fi

    # Look up value from .env
    value="$(grep "^${env_var}=" "$ENV_FILE" | head -1 | cut -d= -f2-)"
    if [[ -z "$value" ]]; then
      echo "ERROR: $env_var not found in $ENV_FILE — cannot create $ssm_path" >&2
      exit 1
    fi

    aws ssm put-parameter \
      --name "$ssm_path" \
      --type String \
      --value "$value" \
      --tags "Key=copilot-application,Value=$APP" "Key=copilot-environment,Value=$ENV" \
      --no-paginate >/dev/null

    echo "CREATED $ssm_path"
  fi
done < "$MANIFEST"
