# Myah Agent Safety Rules

Semgrep ruleset tuned for Hermes agent skills — code that runs inside the Myah agent container. Each rule targets a specific unsafe pattern.

## Rules

### ERROR (blocks merge)

| Rule | What it catches |
|---|---|
| `myah.shell-injection-python` | `subprocess.run(..., shell=True)` with any dynamic string |
| `myah.shell-injection-node` | `child_process.exec/execSync` with template literals or variables |
| `myah.eval-python` | `eval(x)` / `exec(x)` where x is not a string literal |
| `myah.eval-js` | `eval(x)` / `new Function(x)` with dynamic input |
| `myah.os-system` | Any `os.system()` call |
| `myah.curl-pipe-shell` | Shell snippets containing `curl ... | bash` or `wget ... | sh` |
| `myah.obfuscation-base64-exec` | `base64.b64decode(...)` followed by exec/eval |
| `myah.writes-to-system-dir` | File writes to `/etc/`, `/root/`, `/boot/`, `/sys/`, `~/.ssh/`, `~/.aws/` |

### WARNING (informational)

| Rule | What it catches |
|---|---|
| `myah.disables-ssl` | `verify=False` in `requests.*`, `rejectUnauthorized: false` in Node |
| `myah.hardcoded-ip` | Any IPv4 in string literals (excludes localhost) |
| `myah.rm-rf-root` | `rm -rf` anywhere near `/` or `$HOME` |
| `myah.powershell-invoke-expression` | `Invoke-Expression` / `iex` in PowerShell |

### INFO (surfaces but never blocks)

| Rule | What it catches |
|---|---|
| `myah.network-fetch-no-timeout` | `fetch(url)` / `requests.get(url)` without timeout kwarg |

## Severity mapping

| Semgrep severity | Myah status | Blocks merge |
|---|---|---|
| ERROR | `fail` | Yes |
| WARNING | `warn` | No |
| INFO | `info` | No |

## Run locally

```bash
# Scan everything
semgrep --config semgrep-rules/myah-agent-safety.yml skills/

# Scan a single skill
semgrep --config semgrep-rules/myah-agent-safety.yml skills/test-echo/

# Only show ERROR rules
semgrep --config semgrep-rules/myah-agent-safety.yml --severity=ERROR skills/
```

## False positives

If a rule fires on safe code, you can suppress it inline:

```python
# nosemgrep: myah.hardcoded-ip
API_HOST = "10.0.0.1"  # Intentional: local-only dev endpoint
```

Or open a PR to adjust the rule — every rule is in this repo.

## Version

Ruleset version: **1**

Bump this version in `myah-agent-safety.yml` metadata when rules change. The
audit pipeline re-scans every skill whenever the ruleset version changes.
