const fs = require('fs');
const babel = require('@babel/core');
const rimraf = require('rimraf');

const DEV_DIR = './dev';
const DIST_DIR = './dist';

rimraf.sync(DEV_DIR);
rimraf.sync(DIST_DIR);

fs.mkdirSync(DEV_DIR);
fs.mkdirSync(DIST_DIR);

const inputHtml = fs.readFileSync('./src/index.html', { encoding: 'utf8' });

function writeFiles(isDev) {
  const options = {
    sourceMaps: isDev ? 'inline' : false,
    presets: ['minify'],
    plugins: ['@babel/plugin-syntax-object-rest-spread'],
  };

  const { code } = babel.transformFileSync('./src/game.js', options);

  const outputHtml = [
    inputHtml.split('\n').filter(l => l.length > 0),
    isDev ? '<script src="game.js"></script>' : `<script>${code}</script>`,
  ].join('');

  const distDir = isDev ? DEV_DIR : DIST_DIR;

  fs.writeFileSync(`${distDir}/index.htm`, outputHtml, { encoding: 'utf8' });
  if (isDev) fs.writeFileSync(`${distDir}/game.js`, code, { encoding: 'utf8' });
}

writeFiles(false);
writeFiles(true);

const { size } = fs.statSync(`${DIST_DIR}/index.htm`);
const percent = ((size / 31337) * 100).toFixed(2);
console.log(`${size} bytes, ${percent}%`);
