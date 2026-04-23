#!/bin/bash
# Safe shell scripts — should NOT trigger rules

# Normal rm with specific path (safe-ish, not near / or $HOME)
rm -rf /tmp/old-build/

# curl to file, not pipe
curl -o installer.sh https://example.com/install.sh
bash installer.sh
