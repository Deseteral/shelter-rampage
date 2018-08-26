#!/usr/bin/env bash
echo "Uploading 'dist' directory to GitHub Pages..."
npm run build
git subtree push --prefix dist origin gh-pages
