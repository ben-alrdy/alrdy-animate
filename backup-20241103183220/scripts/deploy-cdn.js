const fs = require('fs-extra');
const path = require('path');
const pkg = require('../package.json');

async function deployCDN() {
  const version = pkg.version;
  const cdnPath = path.join(__dirname, '../cdn');
  
  // Ensure cdn directory exists
  await fs.ensureDir(cdnPath);
  
  // Create version directory
  const versionPath = path.join(cdnPath, `v${version}`);
  await fs.ensureDir(versionPath);
  
  // Copy dist files to both version directory and cdn root
  await fs.copy(path.join(__dirname, '../dist'), versionPath);
  await fs.copy(path.join(__dirname, '../dist'), cdnPath);
  
  console.log(`Deployed version ${version} to cdn/`);
}

deployCDN().catch(console.error); 