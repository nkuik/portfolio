#!/bin/bash

# TODO: should replace with: https://github.com/klakegg/actions-hugo

git clone https://github:$INPUT_GITHUB_TOKEN@github.com/$GITHUB_REPOSITORY.git

git config --global user.name $INPUT_GITHUB_USER
git config --global user.email "nathan@nathankuik.com"

pushd $(echo $GITHUB_REPOSITORY | awk -F'/' '{print $2}')
git checkout $GITHUB_HEAD_REF
git submodule update --init

hugo

git add .
git commit -m "Build site for $GITHUB_HEAD_REF"
git push -f origin $GITHUB_HEAD_REF
