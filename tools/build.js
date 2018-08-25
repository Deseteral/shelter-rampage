const fs = require('fs');
const babel = require('@babel/core');
const rimraf = require('rimraf');

const dev = process.argv[2] === '--dev';
const distDir = dev ? 'dev' : 'dist';

rimraf.sync(`./${distDir}`);
fs.mkdirSync(`./${distDir}`);

const inputHtml = fs.readFileSync('./src/index.html', { encoding: 'utf8' });

function writeFiles(htmlFileName, isDev) {
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

  fs.writeFileSync(`./${distDir}/${htmlFileName}.htm`, outputHtml, { encoding: 'utf8' });
  if (isDev) fs.writeFileSync(`./${distDir}/game.js`, code, { encoding: 'utf8' });
}

writeFiles('index', false);
if (dev) writeFiles('index-dev', dev);

const { size } = fs.statSync(`./${distDir}/index.htm`);
const percent = ((size / 31337) * 100).toFixed(2);
console.log(`${size} bytes, ${percent}%`);
