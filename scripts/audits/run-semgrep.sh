#!/usr/bin/env bash
set -euo pipefail

# Run Semgrep safety check on a skill directory
# Usage: SKILL_DIR=skills/test-echo ./run-semgrep.sh

SKILL_DIR="${SKILL_DIR:-}"
if [[ -z "$SKILL_DIR" ]]; then
  echo "Error: SKILL_DIR environment variable required" >&2
  exit 1
fi

if [[ ! -d "$SKILL_DIR" ]]; then
  echo "Error: Directory not found: $SKILL_DIR" >&2
  exit 1
fi

SLUG=$(basename "$SKILL_DIR")
OUTPUT_DIR="audit-results/_raw/${SLUG}"
mkdir -p "$OUTPUT_DIR"

OUTPUT_FILE="${OUTPUT_DIR}/safety.json"

# Run Semgrep with our custom rules
# --json: Output JSON
# --exclude: Skip test directories within skills
echo "Scanning ${SLUG} for safety issues..."

semgrep \
  --config semgrep-rules/myah-agent-safety.yml \
  --json \
  --exclude tests/ \
  --exclude node_modules/ \
  --exclude .venv/ \
  "$SKILL_DIR" \
  > "$OUTPUT_FILE" 2>/dev/null || true

echo "Semgrep results written to ${OUTPUT_FILE}"
