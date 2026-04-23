// Safe code — these should NOT trigger any rules

// Using spawn with shell:false (safe)
const { spawn } = require('child_process');
spawn('git', ['status'], { shell: false });

// Fetch with timeout (safe)
fetch('https://api.example.com', { timeout: 5000 });

// Normal file write (safe)
const fs = require('fs');
fs.writeFileSync('output.txt', 'hello');
