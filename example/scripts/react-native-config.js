#!/usr/bin/env node
/**
 * Prints the React Native CLI config for React Native's SPM tooling
 * (`npx react-native spm`), which runs this via `--config-command`.
 *
 * The community CLI finds the iOS project by looking for a Podfile, and this
 * example has none: Heracross is Swift Package Manager only. Without one the
 * CLI reports `project.ios` as null and the SPM tooling cannot start, so this
 * fills it in with the same shape the CLI would have produced.
 */
const { execFileSync } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');
const cli = path.join(
  path.dirname(require.resolve('react-native/package.json', { paths: [root] })),
  'cli.js'
);

const config = JSON.parse(
  execFileSync(process.execPath, [cli, 'config'], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  })
);

config.project.ios ??= {
  sourceDir: path.join(root, 'ios'),
  xcodeProject: {
    name: 'HeracrossExample.xcodeproj',
    path: '.',
    isWorkspace: false,
  },
};

process.stdout.write(JSON.stringify(config));
