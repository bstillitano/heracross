#!/usr/bin/env node
// Runs the Swift unit tests in ios/Tests on an iOS simulator.
//
// `HERACROSS_TESTS=1` makes ios/Package.swift resolvable on its own, without
// the React Native packages an app provides (see the manifest).
//
// The simulator must run iOS 16 or later, the minimum in ios/Package.swift. It
// is a booted one if there is one, otherwise an iPhone on the newest runtime.
//
// `node scripts/test-ios.js --list` prints the chosen simulator and exits.

const { execFileSync } = require('node:child_process');
const path = require('node:path');

const MINIMUM_IOS = 16;

// com.apple.CoreSimulator.SimRuntime.iOS-26-2 -> [26, 2]; iOS-17 -> [17, 0].
function runtimeVersion(runtime) {
  const match = runtime.match(/\.SimRuntime\.iOS-(\d+)(?:-(\d+))?(?:-(\d+))?$/);
  return match ? match.slice(1).filter((part) => part !== undefined).map(Number) : null;
}

function compareVersions(a, b) {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const difference = (a[i] ?? 0) - (b[i] ?? 0);
    if (difference !== 0) {
      return difference;
    }
  }
  return 0;
}

function pickSimulator(devices) {
  const runtimes = Object.keys(devices)
    .map((runtime) => ({ runtime, version: runtimeVersion(runtime) }))
    .filter(({ version }) => version && version[0] >= MINIMUM_IOS)
    .sort((a, b) => compareVersions(b.version, a.version));

  const candidates = runtimes.flatMap(({ runtime, version }) =>
    devices[runtime].map((device) => ({ ...device, version: version.join('.') }))
  );
  const device =
    candidates.find((candidate) => candidate.state === 'Booted') ??
    candidates.find((candidate) => candidate.name.startsWith('iPhone'));

  if (!device) {
    const found = Object.keys(devices)
      .filter((runtime) => runtime.includes('.SimRuntime.iOS-'))
      .map((runtime) => `${runtime} (${devices[runtime].length} devices)`);
    throw new Error(
      `No available iOS ${MINIMUM_IOS}+ simulator: need a booted simulator or an iPhone on iOS ${MINIMUM_IOS} or later. ` +
        `Install an iOS runtime in Xcode > Settings > Components.\n` +
        `iOS runtimes found: ${found.length ? found.join(', ') : 'none'}`
    );
  }
  return device;
}

function listDevices() {
  return JSON.parse(
    execFileSync('xcrun', ['simctl', 'list', 'devices', 'available', '--json'], {
      encoding: 'utf8',
    })
  ).devices;
}

let device;
try {
  device = pickSimulator(listDevices());
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
console.log(`Testing on ${device.name}, iOS ${device.version} (${device.udid})`);

if (process.argv.includes('--list')) {
  process.exit(0);
}

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
