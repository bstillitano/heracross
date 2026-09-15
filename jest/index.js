/* global jest */
// A Jest mock of the whole Heracross API, for tests of code that imports
// `heracross`, where the native module doesn't exist:
//
//   jest.mock('heracross', () => require('heracross/jest'));
//
// Every method is a `jest.fn()`. Reads resolve empty values, listeners return
// a subscription whose `remove` is a `jest.fn()`, and `supports` reports every
// feature as supported. Override any of them per test, for example
// `jest.mocked(Heracross.featureFlags.isEnabled).mockResolvedValue(true)`.
//
// `createHeracrossMock()` returns a fresh, independent copy.

function subscription() {
  return { remove: jest.fn() };
}

function createHeracrossMock() {
  return {
    isAvailable: true,
    supports: {
      floatingButton: true,
      disabledFeatures: true,
      cookies: true,
      apnsToken: true,
      notificationLog: true,
      locationSpoofingState: true,
    },
    start: jest.fn(),
    isStarted: jest.fn(() => Promise.resolve(true)),
    showMenu: jest.fn(),
    hideMenu: jest.fn(),
    isMenuOpen: jest.fn(() => Promise.resolve(false)),
    setInvocationGesture: jest.fn(),
    setDisabledFeatures: jest.fn(),
    featureFlags: {
      register: jest.fn(),
      isEnabled: jest.fn(() => Promise.resolve(false)),
      getAll: jest.fn(() => Promise.resolve([])),
      getOverride: jest.fn(() => Promise.resolve(null)),
      getOverridesEnabled: jest.fn(() => Promise.resolve(false)),
      setOverridesEnabled: jest.fn(),
      setOverride: jest.fn(),
      clearOverride: jest.fn(),
      resetOverrides: jest.fn(),
      addListener: jest.fn(subscription),
    },
    servers: {
      configure: jest.fn(),
      select: jest.fn(),
      getSelected: jest.fn(() => Promise.resolve(null)),
      getAll: jest.fn(() => Promise.resolve([])),
      addListener: jest.fn(subscription),
    },
    setEnvironmentVariables: jest.fn(),
    getEnvironmentVariables: jest.fn(() => Promise.resolve({})),
    setDeveloperOptions: jest.fn(),
    deepLinks: {
      setPresets: jest.fn(),
    },
    notifications: {
      log: jest.fn(),
    },
    setApnsToken: jest.fn(),
    setFcmToken: jest.fn(),
    cookies: {
      log: jest.fn(),
      captureWebView: jest.fn(),
      clear: jest.fn(),
    },
    crashes: {
      triggerTestCrash: jest.fn(),
    },
    location: {
      getSpoofingState: jest.fn(() => Promise.resolve(null)),
    },
  };
}

const Heracross = createHeracrossMock();

module.exports = {
  __esModule: true,
  default: Heracross,
  Heracross,
  createHeracrossMock,
};
