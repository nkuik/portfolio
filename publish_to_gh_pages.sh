#!/bin/sh

THEME=$1

if [[ $(git status -s) ]]
then
    echo "The working directory is dirty. Please commit any pending changes."
    exit 1;
fi

echo "Deleting old publication"
rm -rf public
mkdir public
git worktree prune
rm -rf .git/worktrees/public/

echo "Checking out gh-pages branch into public"
git worktree add -B gh-pages public upstream/gh-pages

echo "Removing existing files"
rm -rf public/*

echo "Generating site"
hugo -t $THEME

echo "Generating commit message"
msg="rebuilding site `date`"
if [ $# -eq 1 ]
  then msg="$1"
fi

echo "Updating gh-pages branch"
cd public && git add --all && git commit -m "$msg"

echo "Pushing to gh-pages branch"
git push upstream gh-pages --force
