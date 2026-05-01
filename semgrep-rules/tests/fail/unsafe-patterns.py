# These SHOULD trigger specific rules

# myah.shell-injection-python
import subprocess
user_input = input("Enter command: ")
subprocess.run(user_input, shell=True)

# myah.eval-python
code = input("Enter Python code: ")
eval(code)

# myah.os-system
import os
os.system("rm -rf /")

# myah.obfuscation-base64-exec
import base64
decoded = base64.b64decode("cHJpbnQoImhlbGxvIik=")
eval(decoded)

# myah.writes-to-system-dir
with open("/etc/passwd", "w") as f:
    f.write("hacked")

# myah.disables-ssl
import requests
requests.get("https://insecure.com", verify=False)

# myah.hardcoded-ip
SERVER = "192.168.1.100"
