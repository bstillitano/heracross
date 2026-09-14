// React Native's SPM setup writes HERMES_CLI_PATH into the Xcode project as an
// absolute path on this machine, and writes it again on every run. Make it
// relative to the project, so the committed project holds no local paths.
//
// The example's hermes-compiler is a real directory in example/node_modules,
// not a symlink, so the relative form resolves the way the absolute one does.

const fs = require('node:fs');
const path = require('node:path');

const project = path.join(
  __dirname,
  '..',
  'ios',
  'HeracrossExample.xcodeproj',
  'project.pbxproj'
);
const relative =
  '"$(SRCROOT)/../node_modules/hermes-compiler/hermesc/osx-bin/hermesc"';

const text = fs.readFileSync(project, 'utf8');
const updated = text.replace(
  /HERMES_CLI_PATH = "[^"$]*\/node_modules\/hermes-compiler\/hermesc\/osx-bin\/hermesc";/g,
  `HERMES_CLI_PATH = ${relative};`
);

const remaining = updated.match(/HERMES_CLI_PATH = "\/[^"]*";/g);
if (remaining) {
  console.error(`Unexpected absolute HERMES_CLI_PATH left: ${remaining.join(', ')}`);
  process.exit(1);
}

if (updated !== text) {
  fs.writeFileSync(project, updated);
  console.log('Made HERMES_CLI_PATH relative to the project.');
}
