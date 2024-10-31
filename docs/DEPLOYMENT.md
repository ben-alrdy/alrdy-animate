# Deployment Guide

This document explains the automated deployment process for AlrdyAnimate, including npm publishing and CDN updates.

## Setup

### Prerequisites
1. npm account (create at npmjs.com)
2. GitHub repository access
3. Local development environment

### Initial Setup
```bash
# Login to npm
npm login

# Verify login
npm whoami  # Should show your username
```

## Development Workflow

### 1. Local Development
```bash
# Start development server with hot reload, i.e. changes are reflected immediately locally (no need to run build)
npm run dev

# Build for testing
npm run build
```

### 2. Testing Before Release
```bash
# Clean and rebuild
npm run build

# Create local package for testing
npm pack
```

## Release Process

### 1. Version Update
Choose one command based on the type of update:

```bash
npm version patch  # Bug fixes (2.1.2 -> 2.1.3)
npm version minor  # New features (2.1.2 -> 2.2.0)
npm version major  # Breaking changes (2.1.2 -> 3.0.0)
```

This automatically:
- Updates version in package.json
- Creates new build
- Updates CDN files (accessible via jsdelivr.net through GitHub)
- Creates git commit and tag
- Updates 'latest' tag on GitHub
- Pushes to GitHub
- Publishes to npm

### 2. Automated Scripts
The process uses these npm scripts:
```json
{
  "scripts": {
    "build": "npm run clean && webpack",
    "build:cdn": "npm run build && node scripts/deploy-cdn.js",
    "version": "npm run build:cdn && git add cdn",
    "postversion": "git tag -f latest && git push && git push --tags && git push origin latest -f && npm publish"
  }
}
```

### 3. CDN Structure
The build process maintains this structure:
```
/cdn
├── v2.1.3/                    # Version-specific files
│   ├── AlrdyAnimate.js
│   ├── AlrdyAnimate.css
│   └── chunks/
├── AlrdyAnimate.js           # Latest version
├── AlrdyAnimate.css
└── chunks/
```

## CDN Usage

### Latest Version
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/ben-alrdy/alrdy-animate@latest/cdn/AlrdyAnimate.css">
<script src="https://cdn.jsdelivr.net/gh/ben-alrdy/alrdy-animate@latest/cdn/AlrdyAnimate.js"></script>
```

### Specific Version
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/ben-alrdy/alrdy-animate@2.1.3/cdn/v2.1.3/AlrdyAnimate.css">
<script src="https://cdn.jsdelivr.net/gh/ben-alrdy/alrdy-animate@2.1.3/cdn/v2.1.3/AlrdyAnimate.js"></script>
```

## Troubleshooting

### Common Issues

1. **npm publish fails**
   - Check if you're logged in: `npm whoami`
   - Ensure version number is unique
   - Verify package.json is valid

2. **CDN files not updating**
   - Check if build:cdn script ran successfully
   - Verify git push succeeded
   - Wait for CDN cache to clear (usually a few minutes)

3. **Version tag issues**
   ```bash
   # Force update latest tag
   git tag -f latest
   git push origin latest -f
   ```

## Manual Override

If needed, you can run steps manually:
```bash
# 1. Build
npm run build

# 2. Update CDN
npm run build:cdn

# 3. Commit changes
git add .
git commit -m "Update version x.x.x"

# 4. Create/update tags
git tag vx.x.x
git tag -f latest

# 5. Push to GitHub
git push
git push --tags
git push origin latest -f

# 6. Publish to npm
npm publish
```