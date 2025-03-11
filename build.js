const { exec } = require('child_process');
const fs = require('fs');

fs.rmdirSync('./dist', { recursive: true, force: true });

exec('tsc', (err, stdout, stderr) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log(stdout);
    if (stderr) {
        console.error(stderr);
    }

    console.log("Build completed successfully.");
});