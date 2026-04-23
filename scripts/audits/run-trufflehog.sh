#!/usr/bin/env bash
set -euo pipefail

# Run TruffleHog secret scan on a skill directory
# Usage: SKILL_DIR=skills/test-echo ./run-trufflehog.sh

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

OUTPUT_FILE="${OUTPUT_DIR}/secrets.json"

# Run TruffleHog in filesystem mode
# --no-update: Don't check for updates (CI-friendly)
# --json: Output JSON for parsing
# --fail: Exit non-zero if secrets found (we capture this but don't stop)
echo "Scanning ${SLUG} for secrets..."

if command -v trufflehog &> /dev/null; then
  trufflehog filesystem "$SKILL_DIR" \
    --no-update \
    --json \
    --fail \
    > "$OUTPUT_FILE" 2>&1 || true
else
  # Fallback: Docker-based TruffleHog
  docker run --rm -v "$(pwd):/scan" trufflesecurity/trufflehog:latest \
    filesystem /scan/"$SKILL_DIR" \
    --no-update \
    --json \
    --fail \
    > "$OUTPUT_FILE" 2>&1 || true
fi

echo "TruffleHog results written to ${OUTPUT_FILE}"
