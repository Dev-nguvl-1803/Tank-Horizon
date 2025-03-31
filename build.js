const fs = require('fs');
const { execSync } = require('child_process');

const distDir = 'dist';

if (fs.existsSync(distDir)) {
    fs.rmdirSync(distDir, { recursive: true });
}

execSync('tsc');
console.log('Build successful!');
