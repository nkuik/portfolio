# Deployment Migration Guide

This document explains the changes made to optimize the Hugo blog deployment process.

## What Changed?

### Before (Old Setup)
- Built artifacts (`docs/` folder) were committed to the repository
- GitHub Pages served directly from the `docs/` folder on the `main` branch
- PR workflow force-pushed built files back to PR branches
- Using Hugo v0.151.0
- No caching of build resources

### After (New Setup)
- Built artifacts are no longer committed (added to `.gitignore`)
- GitHub Actions builds and deploys the site automatically
- Uses the latest Hugo version with extended support
- PR workflow only validates builds and runs Lighthouse CI tests
- Optimized for GitHub Pages deployment via GitHub Actions

## Benefits of the New Approach

1. **Cleaner Repository**: No more 6.5MB of generated HTML/CSS/JS committed to git
2. **Faster Git Operations**: Smaller repository size means faster clones and pulls
3. **Automated Deployment**: Push to main automatically deploys to production
4. **Better Version Control**: Only track source files, not generated output
5. **Latest Hugo Version**: Always use the latest stable Hugo release
6. **Improved CI/CD**: Separate PR validation from production deployment
7. **Standard Practice**: Follows Hugo and GitHub Pages best practices

## Migration Steps

### 1. Enable GitHub Actions for Pages

In your GitHub repository settings:
1. Go to **Settings** → **Pages**
2. Under "Build and deployment" → "Source", select **GitHub Actions**
3. Save the changes

### 2. Remove docs/ folder from main branch (Optional Cleanup)

After the new workflow is working, you can clean up the `docs/` folder from git history:

```bash
# On main branch
git rm -r docs/
git commit -m "Remove docs/ folder - now using GitHub Actions for deployment"
git push origin main
```

Note: This step is optional. The new workflow will work regardless, but removing `docs/` will clean up your repository.

### 3. Verify Deployment

1. Merge this PR to main
2. Check the "Actions" tab to see the deployment workflow run
3. Verify the site is live at https://nathankuik.com/

## Workflow Files

- **`.github/workflows/deploy.yaml`**: Production deployment (runs on push to main)
- **`.github/workflows/build-site.yaml`**: PR validation (runs on pull requests)

## Configuration Changes

- **`config.toml`**: Removed `publishDir = "docs"` (now uses default `public/`)
- **`.gitignore`**: Added `docs` and `resources/_gen/` to exclude generated files
- **`lighthouserc.json`**: Updated to use `./public` directory

## Troubleshooting

### Site not deploying?
- Check the Actions tab for workflow runs
- Ensure GitHub Pages is set to deploy from GitHub Actions (not from a branch)
- Verify the workflow has proper permissions

### Custom domain not working?
- The CNAME file was in the `docs/` folder. Add it to `static/CNAME` instead
- GitHub Actions will copy it to the root of the deployed site

### Need to revert?
The old workflow is preserved in git history. You can revert these changes and re-enable deployment from the `docs/` folder in GitHub Pages settings.
