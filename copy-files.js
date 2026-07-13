const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, 'src', 'openapi.yaml');
const distDir = path.join(__dirname, 'dist');
const dest = path.join(distDir, 'openapi.yaml');

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

fs.copyFileSync(src, dest);
console.log('Copied openapi.yaml to dist/');
