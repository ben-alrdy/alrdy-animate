const fs = require('fs');
const path = require('path');

// Critical chunks that should be preloaded for optimal performance
const CRITICAL_CHUNKS = [
  'gsap-core',
  'gsap-text',
  'gsap-appear',
  'gsap-nav',
  'gsap-accordion',
  'gsap-draggable'
];

function generatePreloadHints() {
  const chunksDir = path.join(__dirname, '../dist/chunks');
  const distDir = path.join(__dirname, '../dist');
  const packageJson = require('../package.json');
  const version = packageJson.version;

  // Check if chunks directory exists
  if (!fs.existsSync(chunksDir)) {
    console.error('Error: dist/chunks directory not found. Run `npm run build` first.');
    process.exit(1);
  }

  // Read all chunk files
  const chunkFiles = fs.readdirSync(chunksDir)
    .filter(file => file.endsWith('.js') && !file.endsWith('.LICENSE.txt'));

  // Filter for critical chunks
  const criticalChunkFiles = chunkFiles.filter(file => {
    return CRITICAL_CHUNKS.some(critical => file.startsWith(critical));
  });

  if (criticalChunkFiles.length === 0) {
    console.warn('Warning: No critical chunks found in dist/chunks/');
    return;
  }

  // Generate HTML preload hints
  const localHints = criticalChunkFiles.map(file => {
    return `<link rel="modulepreload" href="/dist/chunks/${file}">`;
  }).join('\n');

  const unpkgHints = criticalChunkFiles.map(file => {
    return `<link rel="modulepreload" href="https://unpkg.com/alrdy-animate@${version}/dist/chunks/${file}">`;
  }).join('\n');

  const jsdelivrHints = criticalChunkFiles.map(file => {
    return `<link rel="modulepreload" href="https://cdn.jsdelivr.net/npm/alrdy-animate@${version}/dist/chunks/${file}">`;
  }).join('\n');

  // Create output HTML content
  const outputHtml = `<!-- AlrdyAnimate Preload Hints - v${version} -->
<!-- Generated: ${new Date().toISOString()} -->

<!-- Option 1: Local paths (if self-hosting) -->
${localHints}

<!-- Option 2: UNPKG (npm CDN - Recommended) -->
${unpkgHints}

<!-- Option 3: JSDelivr (npm CDN - Alternative) -->
${jsdelivrHints}

<!--
Usage Instructions:
1. Copy the appropriate hints (local or CDN) to your HTML <head> section
2. Place them BEFORE your main AlrdyAnimate.js script tag
3. Only include hints for chunks you're actually using via gsapFeatures
4. Update these hints after each version upgrade

Performance Impact:
- Reduces chunk loading time by 50-100ms
- Most beneficial for performance-critical landing pages
- Hints are cached, so they benefit repeat visitors

Example:
<head>
  <!-- Preload critical chunks -->
  <link rel="modulepreload" href="...gsap-core.xxx.js">
  <link rel="modulepreload" href="...gsap-text.xxx.js">
  
  <!-- Main script -->
  <script src="https://cdn.jsdelivr.net/npm/alrdy-animate@${version}/dist/AlrdyAnimate.js"></script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/alrdy-animate@${version}/dist/AlrdyAnimate.css">
</head>
-->
`;

  // Write to dist/preload-hints.html
  const outputPath = path.join(distDir, 'preload-hints.html');
  fs.writeFileSync(outputPath, outputHtml);

  // Console output
  console.log('\n✓ Preload hints generated successfully!\n');
  console.log(`Version: ${version}`);
  console.log(`Critical chunks found: ${criticalChunkFiles.length}\n`);
  console.log('Chunks included:');
  criticalChunkFiles.forEach(file => {
    console.log(`  - ${file}`);
  });
  console.log(`\nOutput saved to: ${outputPath}`);
  console.log('\nTo use these hints, copy the appropriate section from preload-hints.html');
  console.log('and paste it in your HTML <head> before the main script tag.\n');
}

// Run the generator
try {
  generatePreloadHints();
} catch (error) {
  console.error('Error generating preload hints:', error);
  process.exit(1);
}

