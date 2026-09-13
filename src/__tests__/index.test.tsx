import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { Platform } from 'react-native';

jest.mock('../NativeHeracross', () => {
  const mock: import('../NativeHeracross').Spec = {
    getConstants: jest.fn(() => ({})),
    start: jest.fn(),
    showMenu: jest.fn(),
    hideMenu: jest.fn(),
    setInvocationGesture: jest.fn(),
    registerFeatureFlag: jest.fn(),
    isFeatureFlagEnabled: jest.fn(() => Promise.resolve(true)),
    setFeatureFlagOverridesEnabled: jest.fn(),
    setFeatureFlagOverride: jest.fn(),
    clearFeatureFlagOverride: jest.fn(),
    resetFeatureFlagOverrides: jest.fn(),
    configureServers: jest.fn(),
    selectServer: jest.fn(),
    getSelectedServer: jest.fn(() => Promise.resolve(null)),
    setEnvironmentVariables: jest.fn(),
    setDeveloperOptions: jest.fn(),
    setDeepLinkPresets: jest.fn(),
    setApnsToken: jest.fn(),
    setFcmToken: jest.fn(),
    logNotification: jest.fn(),
    triggerTestCrash: jest.fn(),
    getLocationSpoofingState: jest.fn(() => Promise.resolve(null)),
  };
  return { __esModule: true, default: mock };
});

// eslint-disable-next-line import/first
import Heracross from '../index';
// eslint-disable-next-line import/first
import NativeHeracross from '../NativeHeracross';

const native = jest.mocked(NativeHeracross);

describe('Heracross', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('start', () => {
    it('refuses production builds and captures network by default', () => {
      Heracross.start();
      expect(native.start).toHaveBeenCalledWith(false, true);
    });

    it('passes options through', () => {
      Heracross.start({ allowProductionBuilds: true, captureNetwork: false });
      expect(native.start).toHaveBeenCalledWith(true, false);
    });

    it('defaults the options that are left out', () => {
      Heracross.start({ captureNetwork: false });
      expect(native.start).toHaveBeenCalledWith(false, false);
    });
  });

  describe('menu', () => {
    it('forwards showMenu and hideMenu', () => {
      Heracross.showMenu();
      Heracross.hideMenu();
      expect(native.showMenu).toHaveBeenCalledTimes(1);
      expect(native.hideMenu).toHaveBeenCalledTimes(1);
    });

    it('warns that floatingButton is Android only on iOS', () => {
      jest.replaceProperty(Platform, 'OS', 'ios');
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      Heracross.setInvocationGesture('floatingButton');
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('Android only')
      );
      expect(native.setInvocationGesture).toHaveBeenCalledWith('floatingButton');
    });

    it('does not warn for floatingButton on Android', () => {
      jest.replaceProperty(Platform, 'OS', 'android');
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      Heracross.setInvocationGesture('floatingButton');
      expect(warn).not.toHaveBeenCalled();
    });

    it('warns about an unknown gesture', () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      Heracross.setInvocationGesture('wave' as never);
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('unknown invocation gesture')
      );
      expect(native.setInvocationGesture).toHaveBeenCalledWith('wave');
    });
  });

  describe('featureFlags', () => {
    it('registers a single flag or a list, titling by key when untitled', () => {
      Heracross.featureFlags.register({ key: 'a', defaultValue: true });
      Heracross.featureFlags.register([
        { key: 'b', title: 'Bee', defaultValue: false },
      ]);
      expect(native.registerFeatureFlag).toHaveBeenNthCalledWith(
        1,
        'a',
        'a',
        true
      );
      expect(native.registerFeatureFlag).toHaveBeenNthCalledWith(
        2,
        'b',
        'Bee',
        false
      );
    });

    it('coerces keys, titles and default values', () => {
      Heracross.featureFlags.register({
        key: 7 as unknown as string,
        title: 8 as unknown as string,
        defaultValue: 1 as unknown as boolean,
      });
      expect(native.registerFeatureFlag).toHaveBeenCalledWith('7', '8', true);
    });

    it('resolves flag state from native', async () => {
      await expect(Heracross.featureFlags.isEnabled('a')).resolves.toBe(true);
      expect(native.isFeatureFlagEnabled).toHaveBeenCalledWith('a');
    });

    it('forwards override changes', () => {
      Heracross.featureFlags.setOverridesEnabled(true);
      Heracross.featureFlags.setOverride('a', false);
      Heracross.featureFlags.clearOverride('a');
      Heracross.featureFlags.resetOverrides();
      expect(native.setFeatureFlagOverridesEnabled).toHaveBeenCalledWith(true);
      expect(native.setFeatureFlagOverride).toHaveBeenCalledWith('a', false);
      expect(native.clearFeatureFlagOverride).toHaveBeenCalledWith('a');
      expect(native.resetFeatureFlagOverrides).toHaveBeenCalledTimes(1);
    });
  });

  describe('servers', () => {
    it('normalises servers so native only sees strings', () => {
      Heracross.servers.configure([
        { id: 'Dev' },
        {
          id: 'Prod',
          baseUrl: 'https://api',
          variables: {
            RETRIES: 3 as unknown as string,
            EMPTY: null as unknown as string,
          },
        },
        { id: 9 as unknown as string, baseUrl: null as unknown as string },
      ]);
      expect(native.configureServers).toHaveBeenCalledWith([
        { id: 'Dev', baseUrl: '', variables: {} },
        {
          id: 'Prod',
          baseUrl: 'https://api',
          variables: { RETRIES: '3', EMPTY: '' },
        },
        { id: '9', baseUrl: '', variables: {} },
      ]);
    });

    it('selects a server by id', () => {
      Heracross.servers.select('Staging');
      expect(native.selectServer).toHaveBeenCalledWith('Staging');
    });

    it('resolves null when native reports no server', async () => {
      await expect(Heracross.servers.getSelected()).resolves.toBeNull();
    });

    it('maps an undefined result to null', async () => {
      native.getSelectedServer.mockResolvedValueOnce(
        undefined as unknown as null
      );
      await expect(Heracross.servers.getSelected()).resolves.toBeNull();
    });

    it('passes the selected server through', async () => {
      const server = {
        id: 'Dev',
        baseUrl: 'https://dev',
        variables: { REGION: 'au' },
      };
      native.getSelectedServer.mockResolvedValueOnce(server);
      await expect(Heracross.servers.getSelected()).resolves.toEqual(server);
    });
  });

  describe('menu content', () => {
    it('stringifies environment variables and developer options', () => {
      Heracross.setEnvironmentVariables({ FLAG: true as unknown as string });
      Heracross.setDeveloperOptions([
        { name: 'Build', value: 42 as unknown as string },
        { name: undefined as unknown as string, value: 'x' },
      ]);
      expect(native.setEnvironmentVariables).toHaveBeenCalledWith({
        FLAG: 'true',
      });
      expect(native.setDeveloperOptions).toHaveBeenCalledWith([
        { name: 'Build', value: '42' },
        { name: '', value: 'x' },
      ]);
    });

    it('forwards deep link presets as strings', () => {
      Heracross.deepLinks.setPresets([
        { name: 'Home', url: 'myapp://home' },
        { name: 'Profile', url: 42 as unknown as string },
      ]);
      expect(native.setDeepLinkPresets).toHaveBeenCalledWith([
        { name: 'Home', url: 'myapp://home' },
        { name: 'Profile', url: '42' },
      ]);
    });

    it('forwards push tokens, including null', () => {
      Heracross.setApnsToken('apns');
      Heracross.setApnsToken(null);
      Heracross.setFcmToken('fcm');
      Heracross.setFcmToken(undefined as unknown as null);
      expect(native.setApnsToken).toHaveBeenNthCalledWith(1, 'apns');
      expect(native.setApnsToken).toHaveBeenNthCalledWith(2, null);
      expect(native.setFcmToken).toHaveBeenNthCalledWith(1, 'fcm');
      expect(native.setFcmToken).toHaveBeenNthCalledWith(2, null);
    });

    it('forwards notification payloads', () => {
      const payload = { aps: { alert: 'Hello' } };
      Heracross.notifications.log(payload);
      expect(native.logNotification).toHaveBeenCalledWith(payload);
    });
  });

  describe('crashes and location', () => {
    it('forwards the test crash', () => {
      Heracross.crashes.triggerTestCrash();
      expect(native.triggerTestCrash).toHaveBeenCalledTimes(1);
    });

    it('resolves null spoofing state when the platform reports none', async () => {
      await expect(Heracross.location.getSpoofingState()).resolves.toBeNull();
    });

    it('passes spoofing state through', async () => {
      const state = {
        enabled: true,
        swizzled: true,
        locationName: 'Sydney',
        latitude: -33.86,
        longitude: 151.21,
      };
      native.getLocationSpoofingState.mockResolvedValueOnce(state);
      await expect(Heracross.location.getSpoofingState()).resolves.toEqual(
        state
      );
    });
  });
});
