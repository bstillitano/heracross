#!/usr/bin/env node
// Checks that the two copies of the React Native patch make the same change.
//
// patches/react-native+<version>.patch is for apps that use patch-package, and
// .yarn/patches/react-native-npm-<version>-<hash>.patch is the one this
// repository applies through the Yarn `resolutions` entry. They differ in their
// headers (patch-package paths start with node_modules/react-native/, Yarn's
// carry an index line and hunk section names), so compare what each hunk
// changes: the file it touches and its removed and added lines, in order.
//
// It also checks that both files are named for the React Native version in
// package.json, and that the Yarn resolution points at the Yarn patch.

const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const failures = [];

function single(dir, pattern) {
  const matches = fs
    .readdirSync(path.join(root, dir))
    .filter((name) => name.startsWith('react-native') && name.endsWith('.patch'));
  if (matches.length !== 1) {
    failures.push(
      `Expected one React Native patch in ${dir}/, found ${matches.length}: ${matches.join(', ') || 'none'}`
    );
    return null;
  }
  const match = matches[0].match(pattern);
  if (!match) {
    failures.push(`Unexpected patch file name ${dir}/${matches[0]}`);
    return null;
  }
  return { file: path.join(dir, matches[0]), version: match[1] };
}

// Returns [{ file, changes: [line, ...] }, ...], one entry per hunk.
function changes(file) {
  const hunks = [];
  let target = null;
  let hunk = null;
  for (const line of fs.readFileSync(path.join(root, file), 'utf8').split('\n')) {
    if (line.startsWith('diff --git ') || line.startsWith('index ')) {
      hunk = null;
    } else if (line.startsWith('--- ')) {
      hunk = null;
    } else if (line.startsWith('+++ ')) {
      target = line
        .slice(4)
        .replace(/^b\//, '')
        .replace(/^node_modules\/react-native\//, '');
      hunk = null;
    } else if (line.startsWith('@@')) {
      hunk = { file: target, changes: [] };
      hunks.push(hunk);
    } else if (hunk && (line.startsWith('+') || line.startsWith('-') || line.startsWith('\\'))) {
      hunk.changes.push(line);
    }
  }
  return hunks;
}

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const reactNative = pkg.devDependencies?.['react-native'];

const npmPatch = single('patches', /^react-native\+(.+)\.patch$/);
const yarnPatch = single('.yarn/patches', /^react-native-npm-(.+)-[0-9a-f]+\.patch$/);

for (const patch of [npmPatch, yarnPatch]) {
  if (patch && patch.version !== reactNative) {
    failures.push(
      `${patch.file} is for React Native ${patch.version}, but package.json has ${reactNative}`
    );
  }
}

if (yarnPatch) {
  const resolutions = Object.entries(pkg.resolutions ?? {}).filter(([key]) =>
    key.startsWith('react-native@')
  );
  const expected = `react-native@npm:${reactNative}`;
  const entry = resolutions.find(([key]) => key === expected);
  if (!entry) {
    failures.push(`package.json resolutions has no "${expected}" entry`);
  } else if (!entry[1].endsWith(`#~/${yarnPatch.file}`)) {
    failures.push(`The "${expected}" resolution does not point at ${yarnPatch.file}: ${entry[1]}`);
  }
}

if (npmPatch && yarnPatch) {
  const a = changes(npmPatch.file);
  const b = changes(yarnPatch.file);
  if (a.length === 0) {
    failures.push(`${npmPatch.file} has no hunks`);
  }
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    failures.push(`${npmPatch.file} and ${yarnPatch.file} make different changes`);
    const count = Math.max(a.length, b.length);
    for (let i = 0; i < count; i++) {
      if (JSON.stringify(a[i]) !== JSON.stringify(b[i])) {
        failures.push(
          `  hunk ${i + 1}:\n    ${npmPatch.file}: ${JSON.stringify(a[i])}\n    ${yarnPatch.file}: ${JSON.stringify(b[i])}`
        );
      }
    }
  }
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(
  `React Native ${reactNative} patches match: ${npmPatch.file} and ${yarnPatch.file}`
);
