import {existsSync, mkdirSync, writeFileSync} from 'node:fs';

const MODULES = 1000;
const SPEC_FILES = 100;

if (!existsSync('src')) {
  mkdirSync('src/modules', {recursive: true});
  const names = [];
  for (let i = 0; i < MODULES; i++) {
    writeFileSync(`src/modules/m${i}.js`, `export const v${i} = ${i};\n`);
    names.push(`v${i}`);
  }
  writeFileSync(
    'src/index.js',
    names.map((name, i) => `import {${name}} from './modules/m${i}.js';`).join('\n') +
      `\nexport const total = ${names.join(' + ')};\n`,
  );
}

if (!existsSync('test')) {
  mkdirSync('test');
  const total = (MODULES * (MODULES - 1)) / 2;
  for (let i = 0; i < SPEC_FILES; i++) {
    writeFileSync(
      `test/file-${i}.test.js`,
      `import {expect, test} from 'vitest';\nimport {total} from '../src/index.js';\n\n` +
        `test('loads ${MODULES} modules', () => {\n  expect(total).toBe(${total});\n});\n`,
    );
  }
}
