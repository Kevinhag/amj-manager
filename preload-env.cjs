require('dotenv').config();
const { execSync } = require('child_process');

const command = process.argv[2];
execSync(command, { stdio: 'inherit' });
