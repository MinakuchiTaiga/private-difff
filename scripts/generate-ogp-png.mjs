import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';

const svg = readFileSync('public/ogp.svg', 'utf8');
const fontFiles = [join('public', 'noto-sans-jp-japanese-700-normal.ttf')];

const resvg = new Resvg(svg, {
  fitTo: { mode: 'width', value: 1200 },
  font: {
    fontFiles,
    loadSystemFonts: true,
  },
});

writeFileSync('public/ogp.png', resvg.render().asPng());
console.log('generated public/ogp.png with embedded Noto Sans JP fonts');
