const fs = require('fs');

const jsSize = fs.statSync('./dist/engine.js').size;
const htmlSize = fs.statSync('./dist/index.html').size;
const size = jsSize + htmlSize;
const percent = ((size / 31337) * 100).toFixed(2);

console.log(`${size} bytes, ${percent}%`);
