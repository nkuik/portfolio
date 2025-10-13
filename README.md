# Blog

My blog with a blend of personal and professional (mostly professional) writings.

## Setup

This site uses Hugo with the [hugo-coder](https://github.com/luizdepra/hugo-coder) theme as a git submodule.

### Initial Setup

If you've just cloned this repository, you need to initialize the theme submodule:

```bash
git submodule update --init --recursive
```

### Building the Site

To build the site and generate the static files in the `docs/` directory:

```bash
hugo
```

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
