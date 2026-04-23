# Safe code — these should NOT trigger any rules

# subprocess with shell=False (safe)
subprocess.run(["ls", "-la"], shell=False)
subprocess.run(["git", "status"])

# Literal eval of a static string (edge case, but safe)
eval("1 + 1")  # nosemgrep: myah.eval-python — static literal

# Requests with verify=True (default, safe)
import requests
requests.get("https://api.example.com/data")

# Fetch with timeout (safe)
fetch("https://api.example.com", { timeout: 5000 })

# Normal file write to working directory (safe)
with open("output.txt", "w") as f:
    f.write("hello")

# localhost IP (explicitly allowed)
HOST = "127.0.0.1"
API_URL = "http://localhost:8080"
