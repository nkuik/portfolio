# Blog

My blog with a blend of personal and professional (mostly professional) writings.

## Setup

This site uses Hugo with the [hugo-coder](https://github.com/luizdepra/hugo-coder) theme as a git submodule.

### Initial Setup

If you've just cloned this repository, you need to initialize the theme submodule:

```bash
git submodule update --init --recursive
```

### Building the Site Locally

To build the site and generate the static files in the `public/` directory:

```bash
hugo
```

For development with live reload:

```bash
hugo server
```

### Deployment

The site is automatically deployed to GitHub Pages using GitHub Actions:

- **Pull Requests**: When you create a PR, the build workflow validates the site builds correctly and runs Lighthouse CI tests
- **Main Branch**: When changes are merged to main, the site is automatically built and deployed to GitHub Pages

The deployment workflow uses Hugo's latest version and the official GitHub Pages deployment action for optimal performance.

### Updating the Theme

If you need to update the hugo-coder theme to the latest version:

```bash
cd themes/hugo-coder
git fetch origin
git checkout main
git pull
cd ../..
```

Then rebuild the site with `hugo`.

## Configuration

Key configuration options are in `config.toml`:

- **Copyright year**: Update the `copyright` parameter under `[params]` to change the footer copyright year
- **Pagination**: The `pagerSize` under `[pagination]` controls how many posts appear per page
