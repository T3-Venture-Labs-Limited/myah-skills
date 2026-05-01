// These SHOULD trigger specific rules

// myah.shell-injection-node
const { exec, execSync } = require('child_process');
const userCmd = process.argv[2];
exec(userCmd);
execSync(`ls ${userCmd}`);

// myah.eval-js
eval(userCmd);
new Function(userCmd)();

// myah.disables-ssl
fetch('https://insecure.com', { rejectUnauthorized: false });

// myah.network-fetch-no-timeout
fetch('https://api.example.com');
