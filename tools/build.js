const fs = require('fs');
const babel = require('@babel/core');
const rimraf = require('rimraf');

rimraf.sync('./dist');
fs.mkdirSync('./dist');

const inputHtml = fs.readFileSync('./src/index.html', { encoding: 'utf8' });

const options = {
  presets: ['minify'],
  plugins: ['@babel/plugin-syntax-object-rest-spread'],
};

const { code } = babel.transformFileSync('./src/game.js', options);

const outputHtml = [
  inputHtml.split('\n').filter(l => l.length > 0),
  `<script>${code}</script>`,
].join('');

fs.writeFileSync('./dist/index.html', outputHtml, { encoding: 'utf8' });

const { size } = fs.statSync('./dist/index.html');
const percent = ((size / 31337) * 100).toFixed(2);
console.log(`${size} bytes, ${percent}%`);
