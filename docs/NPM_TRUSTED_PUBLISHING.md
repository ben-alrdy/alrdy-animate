# npm Trusted Publishing Setup

This repository uses npm's trusted publishing (provenance) feature for secure, automated package publishing.

## What is Trusted Publishing?

Trusted publishing uses GitHub Actions OIDC tokens to authenticate with npm, eliminating the need for long-lived access tokens. Each published package includes cryptographic provenance that proves it was built from specific source code.

## Setup Steps

### 1. Configure Trusted Publisher on npm (One-time setup)

**No tokens needed!** Instead, you configure npm to trust your GitHub Actions workflow:

1. Go to https://www.npmjs.com/package/alrdy-animate/access
2. Scroll to the **"Trusted publishers"** section
3. Click **"Add trusted publisher"**
4. Select **"GitHub Actions"**
5. Fill in the configuration:
   - **Organization/User**: `ben-alrdy` (your GitHub username/org)
   - **Repository**: `alrdy-animate`
   - **Workflow filename**: `publish.yml`
   - **Environment name**: Leave empty (optional)
6. Click **"Add"**

That's it! No secrets to manage, no tokens to rotate.

### 2. Verify Workflow Permissions

The workflow is already configured with the correct permissions:
- `contents: read` - To checkout code
- `id-token: write` - To generate OIDC tokens for authentication and provenance

## How to Publish

The publishing process is now automated:

```bash
# For patch releases (bug fixes)
npm version patch

# For minor releases (new features)
npm version minor

# For major releases (breaking changes)
npm version major
```

When you run `npm version`, it will:
1. Update version in `package.json`
2. Build CDN files
3. Commit changes
4. Create version tag (e.g., `v7.1.11`)
5. Update `latest` tag
6. Push to GitHub with tags

Then GitHub Actions will automatically:
1. Detect the new version tag
2. Build the package
3. Authenticate with npm using OIDC (no tokens needed)
4. Publish to npm with automatic provenance attestation

## Verifying Provenance

After publishing, anyone can verify the package provenance:

```bash
npm audit signatures
```

Or view it on npm:
https://www.npmjs.com/package/alrdy-animate?activeTab=provenance

## Benefits

- ✅ **Zero Token Management**: No tokens to create, store, rotate, or revoke
- ✅ **Enhanced Security**: Short-lived OIDC credentials that expire in minutes
- ✅ **Automatic Provenance**: Cryptographic proof of source code origin (no `--provenance` flag needed)
- ✅ **No Secret Exposure**: Eliminates risk of accidentally committing tokens
- ✅ **Automation**: Publish happens automatically on tag push
- ✅ **Supply Chain Trust**: Verifiable build environment for package consumers

## Troubleshooting

### Workflow not triggering
- Ensure tag format matches `v*.*.*` (e.g., `v7.1.11`)
- Check that tags were pushed: `git push --tags`

### Publish fails with "Unable to authenticate" or ENEEDAUTH error
- **Most Common Issue**: Verify trusted publisher configuration on npmjs.com exactly matches:
  - Organization/User: `ben-alrdy` (must match your GitHub username/org exactly)
  - Repository: `alrdy-animate` (check your actual GitHub repo name - it must match exactly, case-sensitive)
  - Workflow filename: `publish.yml` (case-sensitive, include `.yml` - this is just the filename, not the full path)
- Ensure workflow has `id-token: write` permission (already configured)
- Confirm you're using GitHub-hosted runners (not self-hosted)
- Verify npm version is 11.5.1+ (workflow now upgrades to latest)
- Check the workflow logs for OIDC token availability (ACTIONS_ID_TOKEN_REQUEST_URL should be set)
- Ensure the workflow file is located at `.github/workflows/publish.yml`
- **Important**: The trusted publisher must be added on npmjs.com BEFORE the workflow runs - it won't work retroactively

### Provenance not showing
- With trusted publishing, provenance is automatic (no flag needed)
- Confirm workflow has `id-token: write` permission
- Verify you're using a recent npm CLI version (10.5.0+)

## Migration Notes

The previous local publishing process (`npm publish` in `postversion` script) has been removed and replaced with GitHub Actions automation using OIDC trusted publishing. This eliminates the need for npm tokens entirely while ensuring all publishes include automatic provenance attestations in a controlled CI environment.

## How It Works

<cite index="1-3,1-4">Trusted publishing enables you to securely publish npm packages directly from CI/CD workflows using OpenID Connect (OIDC) for authentication, allowing you to publish packages without npm tokens by configuring packages to accept publishes from specific GitHub Actions workflows</cite>.

<cite index="10-19,10-20">When your CI workflow runs, GitHub Actions generates a short-lived OIDC identity token—a cryptographically signed JWT that includes claims about the workflow context, including details like the repository, workflow file, commit SHA, and more</cite>. <cite index="1-6">Each publish is authenticated using short-lived, workflow-specific credentials that cannot be exfiltrated or reused</cite>.
