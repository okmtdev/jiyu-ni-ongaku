const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, 'dist');

function copyRecursive(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', 'dist', 'functions', '.git'].includes(entry.name)) continue;
      copyRecursive(srcPath, destPath);
    } else {
      if (['.gitignore', 'build.js', 'package.json', 'LICENSE', '.env.example'].includes(entry.name)) continue;
      if (entry.name === 'README.md') continue;
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

if (fs.existsSync(DIST)) fs.rmSync(DIST, { recursive: true });
copyRecursive(__dirname, DIST);

console.log('Build complete! Files copied to dist/');
console.log('Deploy with: gsutil -m rsync -r dist gs://YOUR_BUCKET_NAME/');
