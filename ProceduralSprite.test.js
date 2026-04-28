// ProceduralSprite.test.js — run with: node ProceduralSprite.test.js

'use strict';
const { drawSprite } = require('./ProceduralSprite.js');

let passed = 0, failed = 0;
function ok(cond, msg) {
  if (cond) { console.log(`  PASS: ${msg}`); passed++; }
  else       { console.error(`  FAIL: ${msg}`); failed++; }
}

console.log('\n[1] Determinism');
const a = drawSprite('CAT', 42, 140);
const b = drawSprite('CAT', 42, 140);
ok(a === b,                             'same word+seed → identical SVG');
ok(a !== drawSprite('CAT', 99, 140),   'different seed → different SVG');
ok(a !== drawSprite('DOG', 42, 140),   'different word → different SVG');

console.log('\n[2] SVG structure');
ok(a.startsWith('<svg'),                              'output starts with <svg');
ok(a.endsWith('</svg>'),                              'output ends with </svg>');
ok(a.includes('xmlns="http://www.w3.org/2000/svg"'), 'has xmlns attr');
ok(!a.includes('var(--'),                             'no CSS variables');
ok(!a.includes('class='),                             'no class attributes');
ok(!a.includes('<rect'),                              'no background rect (transparent)');
ok(a.includes('fill="none"'),                         'line-art style: fill=none present');

console.log('\n[3] Size scaling');
for (const sz of [32, 64, 140, 200, 512]) {
  const svg = drawSprite('DOG', 1, sz);
  ok(svg.includes(`viewBox="0 0 ${sz} ${sz}"`), `size ${sz}: viewBox`);
  ok(svg.includes(`width="${sz}"`),               `size ${sz}: width`);
  ok(svg.includes(`height="${sz}"`),              `size ${sz}: height`);
}

console.log('\n[4] Default size = 140');
ok(drawSprite('FOX', 0).includes('viewBox="0 0 140 140"'), 'default size is 140');

console.log('\n[5] SATAN special case');
const satan = drawSprite('SATAN', 0, 140);
ok(satan.includes('#FF2233'), 'SATAN uses red line color #FF2233');

console.log('\n[6] High charSum gets crown');
// 'ZZZZZZ' = 6×90 = 540 > 500
const big   = drawSprite('ZZZZZZ', 0, 140);
const small = drawSprite('A', 0, 140);
ok(big !== small, 'high charSum word produces different output (crown)');
ok(big.includes('<polygon'), 'crown adds a polygon element');

console.log('\n[7] All archetypes produce valid SVG');
for (const w of ['BEAR','CAT','DOG','BIRD','FOX','REPTILE','RABBIT','SATAN']) {
  const svg = drawSprite(w, 7, 100);
  ok(svg.startsWith('<svg') && svg.endsWith('</svg>'), `${w}: valid SVG`);
  ok(!svg.includes('NaN'),       `${w}: no NaN`);
  ok(!svg.includes('undefined'), `${w}: no undefined`);
}

console.log('\n[8] String seed stability');
ok(drawSprite('CAT','hello',140) === drawSprite('CAT','hello',140), 'string seed stable');

console.log(`\n${'─'.repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
