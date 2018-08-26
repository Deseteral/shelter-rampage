#!/usr/bin/env bash
npm run build
git subtree push --prefix dist origin gh-pages
