#!/usr/bin/env node
// Runs the Swift unit tests in ios/Tests on an iOS simulator.
//
// `HERACROSS_TESTS=1` makes ios/Package.swift resolvable on its own, without
// the React Native packages an app provides (see the manifest). The simulator is
// the booted one if there is one, otherwise an iPhone on the newest iOS runtime.

const { execFileSync } = require('node:child_process');
const path = require('node:path');

function pickSimulator() {
  const { devices } = JSON.parse(
    execFileSync('xcrun', ['simctl', 'list', 'devices', 'available', '--json'], {
      encoding: 'utf8',
    })
  );
  const version = (runtime) =>
    (runtime.match(/iOS-(\d+)-(\d+)/) ?? [0, 0, 0]).slice(1).map(Number);
  const runtimes = Object.keys(devices)
    .filter((runtime) => runtime.includes('SimRuntime.iOS'))
    .sort((a, b) => {
      const [aMajor, aMinor] = version(a);
      const [bMajor, bMinor] = version(b);
      return bMajor - aMajor || bMinor - aMinor;
    });
  const all = runtimes.flatMap((runtime) => devices[runtime]);
  const device =
    all.find((candidate) => candidate.state === 'Booted') ??
    all.find((candidate) => candidate.name.startsWith('iPhone'));
  if (!device) {
    throw new Error('No available iOS simulator. Install an iOS runtime in Xcode.');
  }
  return device;
}

const device = pickSimulator();
console.log(`Testing on ${device.name} (${device.udid})`);

try {
  execFileSync(
    'xcodebuild',
    [
      'test',
      '-scheme',
      'Heracross',
      '-destination',
      `platform=iOS Simulator,id=${device.udid}`,
      '-derivedDataPath',
      '.build/xcode',
      'CODE_SIGNING_ALLOWED=NO',
    ],
    {
      cwd: path.join(__dirname, '..', 'ios'),
      env: { ...process.env, HERACROSS_TESTS: '1' },
      stdio: 'inherit',
    }
  );
} catch (error) {
  process.exit(error.status ?? 1);
}
