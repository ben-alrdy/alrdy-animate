const fs = require('fs-extra');
const path = require('path');
const pkg = require('../package.json');

const version = pkg.version;
const cdnPath = path.join(__dirname, '../cdn');

async function deployCDN() {
  // Ensure cdn directory exists
  await fs.ensureDir(cdnPath);
  
  // Create version directory
  const versionPath = path.join(cdnPath, `v${version}`);
  await fs.ensureDir(versionPath);
  
  // Copy dist files to version directory
  await fs.copy(path.join(__dirname, '../dist'), versionPath);
  
  // Update latest
  const latestPath = path.join(cdnPath, 'latest');
  await fs.remove(latestPath);
  await fs.copy(versionPath, latestPath);
  
  console.log(`Deployed version ${version} to cdn/`);
}

deployCDN().catch(console.error); 