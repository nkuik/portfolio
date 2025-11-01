# GitHub Pages Setup Instructions

After merging the deployment optimization PR, follow these steps to complete the setup:

## Required: Enable GitHub Actions for Pages

1. Go to your repository settings: https://github.com/nkuik/portfolio/settings/pages
2. Under **"Build and deployment"**:
   - Change **Source** from "Deploy from a branch" to **"GitHub Actions"**
3. Click **Save**

That's it! The site will automatically deploy when you push to the main branch.

## Verify It's Working

1. Check the Actions tab: https://github.com/nkuik/portfolio/actions
2. You should see a "Deploy Hugo site to Pages" workflow run
3. Once complete, verify your site at: https://nathankuik.com/

## Optional: Clean Up Build Artifacts

After confirming the new deployment works, you can remove the `docs/` folder from the main branch:

```bash
git checkout main
git pull
git rm -r docs/
git commit -m "Remove docs/ folder - now deployed via GitHub Actions"
git push origin main
```

This removes ~6.5MB of generated files from your repository.

## Troubleshooting

**Site not deploying?**
- Verify GitHub Pages source is set to "GitHub Actions" (not "Deploy from a branch")
- Check the Actions tab for error messages

**Custom domain not working?**
- The CNAME file should be in `static/CNAME` (it already is in your repo)
- Verify DNS settings for nathankuik.com point to GitHub Pages

**Need help?**
- See DEPLOYMENT_MIGRATION.md for detailed troubleshooting
- Check workflow logs in the Actions tab
