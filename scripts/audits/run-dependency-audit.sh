#!/usr/bin/env bash
set -euo pipefail

# Run dependency audit on a skill directory
# Usage: SKILL_DIR=skills/test-echo ./run-dependency-audit.sh

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

OUTPUT_FILE="${OUTPUT_DIR}/deps.json"
HAS_DEPS=false
VULNS=0
FINDINGS="[]"

# Check for package.json (Node.js)
if [[ -f "$SKILL_DIR/package.json" ]]; then
  HAS_DEPS=true
  echo "Found package.json in ${SLUG}, running npm audit..."
  
  cd "$SKILL_DIR"
  
  # Generate package-lock if missing
  if [[ ! -f package-lock.json ]]; then
    npm install --package-lock-only --ignore-scripts 2>&1 || true
  fi
  
  # Run npm audit and capture JSON
  if npm audit --json > npm-audit-output.json 2>&1; then
    # npm audit exits 0 when no vulnerabilities
    VULNS=0
    FINDINGS="[]"
  else
    # npm audit exits non-zero when vulnerabilities found
    if [[ -f npm-audit-output.json ]]; then
      VULNS=$(cat npm-audit-output.json | jq -r '.metadata.vulnerabilities.total // 0' 2>&1 || echo "0")
      FINDINGS=$(cat npm-audit-output.json | jq -r '[.advisories // {} | to_entries[] | {
        package: .value.module_name,
        installed_version: .value.findings[0].version,
        severity: .value.severity,
        cve: (.value.cves[0] // null),
        advisory_url: .value.url,
        fixed_in: (.value.patched_versions // null)
      }]' 2>&1 || echo "[]")
    fi
  fi
  
  rm -f npm-audit-output.json
  cd - > /dev/null
fi

# Check for requirements.txt or pyproject.toml (Python)
if [[ -f "$SKILL_DIR/requirements.txt" ]] || [[ -f "$SKILL_DIR/pyproject.toml" ]]; then
  HAS_DEPS=true
  echo "Found Python deps in ${SLUG}, running pip-audit..."
  
  if command -v pip-audit &> /dev/null; then
    cd "$SKILL_DIR"
    pip-audit --format json --output pip-audit-output.json 2>&1 || true
    
    if [[ -f pip-audit-output.json ]]; then
      PYTHON_VULNS=$(cat pip-audit-output.json | jq 'length' 2>&1 || echo "0")
      if [[ "$PYTHON_VULNS" -gt 0 ]]; then
        PYTHON_FINDINGS=$(cat pip-audit-output.json | jq '[.[] | {
          package: .name,
          installed_version: .version,
          severity: (.fix_versions | if length > 0 then "high" else "moderate" end),
          cve: .vuln_id,
          advisory_url: (.aliases // [] | map(select(startswith("CVE"))) | .[0] // null),
          fixed_in: (.fix_versions // []) | join(", ")
        }]' 2>&1 || echo "[]")
        
        # Merge with existing findings
        if [[ "$FINDINGS" == "[]" ]]; then
          FINDINGS="$PYTHON_FINDINGS"
        else
          FINDINGS=$(echo "$FINDINGS $PYTHON_FINDINGS" | jq -s 'add' 2>&1 || echo "[]")
        fi
        
        VULNS=$((VULNS + PYTHON_VULNS))
      fi
      rm -f pip-audit-output.json
    fi
    
    cd - > /dev/null
  else
    echo "Warning: pip-audit not installed, skipping Python dependency check" >&2
  fi
fi

# Determine status
if [[ "$HAS_DEPS" == false ]]; then
  STATUS="not_applicable"
elif [[ "$VULNS" -eq 0 ]]; then
  STATUS="pass"
else
  # Any vulnerabilities = warn (not fail) in v1
  STATUS="warn"
fi

# Write output
cat > "$OUTPUT_FILE" << EOF
{
  "has_deps": $HAS_DEPS,
  "vulnerabilities_count": $VULNS,
  "findings": $FINDINGS
}
EOF

echo "Dependency audit results written to ${OUTPUT_FILE}"
echo "Status: ${STATUS}, Vulnerabilities: ${VULNS}"
