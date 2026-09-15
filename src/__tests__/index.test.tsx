import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { Platform } from 'react-native';

type Spec = import('../NativeHeracross').Spec;

function mockCreateNative() {
  return {
    getConstants: jest.fn(() => ({})),
    start: jest.fn<Spec['start']>(),
    isStarted: jest.fn<Spec['isStarted']>(() => Promise.resolve(true)),
    showMenu: jest.fn<Spec['showMenu']>(),
    hideMenu: jest.fn<Spec['hideMenu']>(),
    isMenuOpen: jest.fn<Spec['isMenuOpen']>(() => Promise.resolve(false)),
    setInvocationGesture: jest.fn<Spec['setInvocationGesture']>(),
    setDisabledFeatures: jest.fn<Spec['setDisabledFeatures']>(),
    registerFeatureFlag: jest.fn<Spec['registerFeatureFlag']>(),
    isFeatureFlagEnabled: jest.fn<Spec['isFeatureFlagEnabled']>(() =>
      Promise.resolve(true)
    ),
    getFeatureFlags: jest.fn<Spec['getFeatureFlags']>(() => Promise.resolve([])),
    getFeatureFlagOverride: jest.fn<Spec['getFeatureFlagOverride']>(() =>
      Promise.resolve(null)
    ),
    getFeatureFlagOverridesEnabled: jest.fn<
      Spec['getFeatureFlagOverridesEnabled']
    >(() => Promise.resolve(false)),
    setFeatureFlagOverridesEnabled:
      jest.fn<Spec['setFeatureFlagOverridesEnabled']>(),
    setFeatureFlagOverride: jest.fn<Spec['setFeatureFlagOverride']>(),
    clearFeatureFlagOverride: jest.fn<Spec['clearFeatureFlagOverride']>(),
    resetFeatureFlagOverrides: jest.fn<Spec['resetFeatureFlagOverrides']>(),
    configureServers: jest.fn<Spec['configureServers']>(),
    selectServer: jest.fn<Spec['selectServer']>(),
    getSelectedServer: jest.fn<Spec['getSelectedServer']>(() =>
      Promise.resolve(null)
    ),
    getServers: jest.fn<Spec['getServers']>(() => Promise.resolve([])),
    setEnvironmentVariables: jest.fn<Spec['setEnvironmentVariables']>(),
    getEnvironmentVariables: jest.fn<Spec['getEnvironmentVariables']>(() =>
      Promise.resolve({})
    ),
    setDeveloperOptions: jest.fn<Spec['setDeveloperOptions']>(),
    setDeepLinkPresets: jest.fn<Spec['setDeepLinkPresets']>(),
    setApnsToken: jest.fn<Spec['setApnsToken']>(),
    setFcmToken: jest.fn<Spec['setFcmToken']>(),
    logNotification: jest.fn<Spec['logNotification']>(),
    logCookie: jest.fn<Spec['logCookie']>(),
    captureWebViewCookies: jest.fn<Spec['captureWebViewCookies']>(),
    clearLoggedCookies: jest.fn<Spec['clearLoggedCookies']>(),
    triggerTestCrash: jest.fn<Spec['triggerTestCrash']>(),
    getLocationSpoofingState: jest.fn<Spec['getLocationSpoofingState']>(() =>
      Promise.resolve(null)
    ),
    onFeatureFlagChange: jest.fn<Spec['onFeatureFlagChange']>(() => ({
      remove: jest.fn(),
    })),
    onServerChange: jest.fn<Spec['onServerChange']>(() => ({
      remove: jest.fn(),
    })),
  } satisfies Spec;
}

jest.mock('../NativeHeracross', () => ({
  __esModule: true,
  default: mockCreateNative(),
}));

import HeracrossDefault, { Heracross } from '../index';
import NativeHeracross from '../NativeHeracross';

const native = NativeHeracross as unknown as ReturnType<typeof mockCreateNative>;

describe('Heracross', () => {
  let warn: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    jest.clearAllMocks();
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('exports the same object as default and named export', () => {
    expect(HeracrossDefault).toBe(Heracross);
  });

  it('is available when the native module is linked', () => {
    expect(Heracross.isAvailable).toBe(true);
  });

  describe('supports', () => {
    it('reports the Android-only features on Android', () => {
      jest.replaceProperty(Platform, 'OS', 'android');
      expect(Heracross.supports).toEqual({
        floatingButton: true,
        disabledFeatures: true,
        cookies: true,
        apnsToken: false,
        notificationLog: false,
        locationSpoofingState: false,
      });
    });

    it('reports the iOS-only features on iOS', () => {
      jest.replaceProperty(Platform, 'OS', 'ios');
      expect(Heracross.supports).toEqual({
        floatingButton: false,
        disabledFeatures: false,
        cookies: false,
        apnsToken: true,
        notificationLog: true,
        locationSpoofingState: true,
      });
    });
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

    it('resolves whether the toolkit started', async () => {
      await expect(Heracross.isStarted()).resolves.toBe(true);
    });
  });

  describe('menu', () => {
    it('forwards showMenu, hideMenu and isMenuOpen', async () => {
      Heracross.showMenu();
      Heracross.hideMenu();
      native.isMenuOpen.mockResolvedValueOnce(true);
      await expect(Heracross.isMenuOpen()).resolves.toBe(true);
      expect(native.showMenu).toHaveBeenCalledTimes(1);
      expect(native.hideMenu).toHaveBeenCalledTimes(1);
    });

    it('warns that floatingButton is Android only on iOS', () => {
      jest.replaceProperty(Platform, 'OS', 'ios');
      Heracross.setInvocationGesture('floatingButton');
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('Android only'));
      expect(native.setInvocationGesture).toHaveBeenCalledWith('floatingButton');
    });

    it('does not warn for supported gestures', () => {
      jest.replaceProperty(Platform, 'OS', 'ios');
      Heracross.setInvocationGesture('shake');
      Heracross.setInvocationGesture('none');
      jest.replaceProperty(Platform, 'OS', 'android');
      Heracross.setInvocationGesture('floatingButton');
      expect(warn).not.toHaveBeenCalled();
    });

    it('warns about an unknown gesture', () => {
      Heracross.setInvocationGesture('wave' as never);
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('unknown invocation gesture')
      );
      expect(native.setInvocationGesture).toHaveBeenCalledWith('wave');
    });
  });

  describe('setDisabledFeatures', () => {
    it('passes primitive ids as strings and skips the rest', () => {
      Heracross.setDisabledFeatures([
        'keystore',
        5 as never,
        null as never,
        {} as never,
      ]);
      expect(native.setDisabledFeatures).toHaveBeenCalledWith(['keystore', '5']);
    });
  });

  describe('featureFlags', () => {
    it('registers a single flag or a readonly list, titling by key when untitled', () => {
      Heracross.featureFlags.register({ key: 'a', defaultValue: true });
      const flags = [{ key: 'b', title: 'Bee', defaultValue: false }] as const;
      Heracross.featureFlags.register(flags);
      expect(native.registerFeatureFlag).toHaveBeenNthCalledWith(1, 'a', 'a', true);
      expect(native.registerFeatureFlag).toHaveBeenNthCalledWith(2, 'b', 'Bee', false);
    });

    it('coerces keys, titles and default values', () => {
      Heracross.featureFlags.register({
        key: 7 as unknown as string,
        title: 8 as unknown as string,
        defaultValue: 1 as unknown as boolean,
      });
      expect(native.registerFeatureFlag).toHaveBeenCalledWith('7', '8', true);
    });

    it('skips flags without a key, and a missing list entry', () => {
      Heracross.featureFlags.register([
        { key: '', defaultValue: true },
        { key: {} as unknown as string, defaultValue: true },
        null as never,
        { key: 'ok', defaultValue: false },
      ]);
      expect(native.registerFeatureFlag).toHaveBeenCalledTimes(1);
      expect(native.registerFeatureFlag).toHaveBeenCalledWith('ok', 'ok', false);
      expect(warn).toHaveBeenCalledTimes(3);
    });

    it('resolves flag state from native', async () => {
      await expect(Heracross.featureFlags.isEnabled('a')).resolves.toBe(true);
      expect(native.isFeatureFlagEnabled).toHaveBeenCalledWith('a');
    });

    it('reads every flag, normalising what native resolves', async () => {
      native.getFeatureFlags.mockResolvedValueOnce([
        { key: 'a', title: 'Ay', defaultValue: true, enabled: false, override: false },
        { key: 'b', defaultValue: false, enabled: true, override: null },
      ]);
      await expect(Heracross.featureFlags.getAll()).resolves.toEqual([
        { key: 'a', title: 'Ay', defaultValue: true, enabled: false, override: false },
        { key: 'b', title: 'b', defaultValue: false, enabled: true, override: null },
      ]);
    });

    it('reads one override and the overrides switch', async () => {
      native.getFeatureFlagOverride.mockResolvedValueOnce(true);
      await expect(Heracross.featureFlags.getOverride('a')).resolves.toBe(true);
      expect(native.getFeatureFlagOverride).toHaveBeenCalledWith('a');
      await expect(Heracross.featureFlags.getOverride('b')).resolves.toBeNull();
      native.getFeatureFlagOverridesEnabled.mockResolvedValueOnce(true);
      await expect(Heracross.featureFlags.getOverridesEnabled()).resolves.toBe(true);
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

    it('delivers flag changes to a listener and returns the subscription', () => {
      const subscription = { remove: jest.fn() };
      native.onFeatureFlagChange.mockReturnValueOnce(subscription);
      const listener = jest.fn();
      expect(Heracross.featureFlags.addListener(listener)).toBe(subscription);
      const handler = native.onFeatureFlagChange.mock.calls[0]![0];
      handler({ key: 'a', enabled: true });
      expect(listener).toHaveBeenCalledWith({ key: 'a', enabled: true });
    });
  });

  describe('servers', () => {
    it('normalises servers so native only sees strings, skipping those without an id', () => {
      Heracross.servers.configure([
        { id: 'Dev' },
        {
          id: 'Prod',
          baseUrl: 'https://api',
          variables: {
            RETRIES: 3 as unknown as string,
            EMPTY: null as unknown as string,
            NESTED: {} as unknown as string,
          },
        },
        { id: 9 as unknown as string, baseUrl: null as unknown as string },
        { id: '' },
        { baseUrl: 'https://orphan' } as never,
      ]);
      expect(native.configureServers).toHaveBeenCalledWith([
        { id: 'Dev', baseUrl: '', variables: {} },
        { id: 'Prod', baseUrl: 'https://api', variables: { RETRIES: '3' } },
        { id: '9', baseUrl: '', variables: {} },
      ]);
      expect(warn).toHaveBeenCalledTimes(2);
    });

    it('selects a server by id', () => {
      Heracross.servers.select('Staging');
      expect(native.selectServer).toHaveBeenCalledWith('Staging');
    });

    it('resolves null when native reports no server', async () => {
      await expect(Heracross.servers.getSelected()).resolves.toBeNull();
    });

    it('maps an undefined result to null', async () => {
      native.getSelectedServer.mockResolvedValueOnce(undefined as unknown as null);
      await expect(Heracross.servers.getSelected()).resolves.toBeNull();
    });

    it('normalises the selected server', async () => {
      native.getSelectedServer.mockResolvedValueOnce({
        id: 'Dev',
        variables: { REGION: 'au', BAD: {} },
      });
      await expect(Heracross.servers.getSelected()).resolves.toEqual({
        id: 'Dev',
        baseUrl: '',
        variables: { REGION: 'au' },
      });
    });

    it('reads every server', async () => {
      native.getServers.mockResolvedValueOnce([
        { id: 'Dev', baseUrl: 'https://dev', variables: {} },
        { id: 'Prod', baseUrl: '', variables: { REGION: 'au' } },
      ]);
      await expect(Heracross.servers.getAll()).resolves.toEqual([
        { id: 'Dev', baseUrl: 'https://dev', variables: {} },
        { id: 'Prod', baseUrl: '', variables: { REGION: 'au' } },
      ]);
    });

    it('delivers server changes to a listener and returns the subscription', () => {
      const subscription = { remove: jest.fn() };
      native.onServerChange.mockReturnValueOnce(subscription);
      const listener = jest.fn();
      expect(Heracross.servers.addListener(listener)).toBe(subscription);
      const handler = native.onServerChange.mock.calls[0]![0];
      handler({ id: 'Staging', baseUrl: 'https://staging', variables: { REGION: 'au' } });
      expect(listener).toHaveBeenCalledWith({
        id: 'Staging',
        baseUrl: 'https://staging',
        variables: { REGION: 'au' },
      });
    });
  });

  describe('menu content', () => {
    it('keeps primitive environment variable values and reads them back', async () => {
      Heracross.setEnvironmentVariables({
        FLAG: true as unknown as string,
        COUNT: 2 as unknown as string,
        NULL: null as unknown as string,
        NESTED: { a: 1 } as unknown as string,
      });
      expect(native.setEnvironmentVariables).toHaveBeenCalledWith({
        FLAG: 'true',
        COUNT: '2',
      });
      native.getEnvironmentVariables.mockResolvedValueOnce({ API: 'https://api' });
      await expect(Heracross.getEnvironmentVariables()).resolves.toEqual({
        API: 'https://api',
      });
    });

    it('skips developer options without a name and defaults the value', () => {
      Heracross.setDeveloperOptions([
        { name: 'Build', value: 42 as unknown as string },
        { name: 'Empty', value: undefined as unknown as string },
        { name: undefined as unknown as string, value: 'x' },
      ]);
      expect(native.setDeveloperOptions).toHaveBeenCalledWith([
        { name: 'Build', value: '42' },
        { name: 'Empty', value: '' },
      ]);
      expect(warn).toHaveBeenCalledTimes(1);
    });

    it('skips deep link presets without a name or url', () => {
      Heracross.deepLinks.setPresets([
        { name: 'Home', url: 'myapp://home' },
        { name: 'Profile', url: 42 as unknown as string },
        { name: 'No URL' } as never,
        { url: 'myapp://nameless' } as never,
      ]);
      expect(native.setDeepLinkPresets).toHaveBeenCalledWith([
        { name: 'Home', url: 'myapp://home' },
        { name: 'Profile', url: '42' },
      ]);
      expect(warn).toHaveBeenCalledTimes(2);
    });

    it('forwards push tokens as text or null', () => {
      Heracross.setApnsToken('apns');
      Heracross.setApnsToken(null);
      Heracross.setFcmToken(123 as unknown as string);
      Heracross.setFcmToken(undefined as unknown as null);
      expect(native.setApnsToken).toHaveBeenNthCalledWith(1, 'apns');
      expect(native.setApnsToken).toHaveBeenNthCalledWith(2, null);
      expect(native.setFcmToken).toHaveBeenNthCalledWith(1, '123');
      expect(native.setFcmToken).toHaveBeenNthCalledWith(2, null);
    });

    it('forwards notification payloads and skips anything else', () => {
      const payload = { aps: { alert: 'Hello' } };
      Heracross.notifications.log(payload);
      Heracross.notifications.log(null as never);
      Heracross.notifications.log(['a'] as never);
      expect(native.logNotification).toHaveBeenCalledTimes(1);
      expect(native.logNotification).toHaveBeenCalledWith(payload);
      expect(warn).toHaveBeenCalledTimes(2);
    });
  });

  describe('cookies', () => {
    it('fills in optional fields so native sees strings, booleans or null', () => {
      Heracross.cookies.log({ name: 'a', value: 'b', domain: 'c' });
      Heracross.cookies.log({
        name: 'session',
        value: 7 as unknown as string,
        domain: 'example.com',
        path: '/',
        secure: true,
        httpOnly: 1 as unknown as boolean,
        sameSite: 'Lax',
        expires: 'Wed, 21 Oct 2026 07:28:00 GMT',
      });
      expect(native.logCookie).toHaveBeenNthCalledWith(1, {
        name: 'a',
        value: 'b',
        domain: 'c',
        path: null,
        secure: false,
        httpOnly: false,
        sameSite: null,
        expires: null,
      });
      expect(native.logCookie).toHaveBeenNthCalledWith(2, {
        name: 'session',
        value: '7',
        domain: 'example.com',
        path: '/',
        secure: true,
        httpOnly: true,
        sameSite: 'Lax',
        expires: 'Wed, 21 Oct 2026 07:28:00 GMT',
      });
    });

    it('skips a cookie without a name, value or domain', () => {
      Heracross.cookies.log({ name: 'a', value: 'b' } as never);
      Heracross.cookies.log({ value: 'b', domain: 'c' } as never);
      Heracross.cookies.log(null as never);
      expect(native.logCookie).not.toHaveBeenCalled();
      expect(warn).toHaveBeenCalledTimes(3);
    });

    it('forwards WebView capture and clearing', () => {
      Heracross.cookies.captureWebView('https://example.com');
      Heracross.cookies.clear();
      expect(native.captureWebViewCookies).toHaveBeenCalledWith('https://example.com');
      expect(native.clearLoggedCookies).toHaveBeenCalledTimes(1);
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
      await expect(Heracross.location.getSpoofingState()).resolves.toEqual(state);
    });
  });
});

describe('NativeHeracross spec', () => {
  it("parses with React Native's codegen", () => {
    const path = require('node:path');
    const {
      TypeScriptParser,
    } = require('@react-native/codegen/lib/parsers/typescript/parser');
    const schema = new TypeScriptParser().parseFile(
      path.join(__dirname, '..', 'NativeHeracross.ts')
    );
    const module = schema.modules.NativeHeracross;
    expect(module.type).toBe('NativeModule');
    const methods = module.spec.methods.map((method: { name: string }) => method.name);
    expect(methods).toEqual(
      expect.arrayContaining([
        'getFeatureFlags',
        'getFeatureFlagOverride',
        'getServers',
        'getEnvironmentVariables',
        'isMenuOpen',
      ])
    );
    const emitters = module.spec.eventEmitters.map((emitter: { name: string }) => emitter.name);
    expect(emitters).toEqual(['onFeatureFlagChange', 'onServerChange']);
  });
});

describe('heracross/jest', () => {
  function shape(value: unknown): unknown {
    if (typeof value === 'function') {
      return 'function';
    }
    if (value != null && typeof value === 'object') {
      return Object.fromEntries(
        Object.keys(value)
          .sort()
          .map((key) => [key, shape((value as Record<string, unknown>)[key])])
      );
    }
    return typeof value;
  }

  it('mocks exactly the members of the real API', () => {
    const mock = require('../../jest');
    const real = require('../index').Heracross;
    expect(shape(mock.Heracross)).toEqual(shape(real));
    expect(mock.default).toBe(mock.Heracross);
  });

  it('resolves reads and returns removable subscriptions', async () => {
    const { createHeracrossMock } = require('../../jest');
    const mock = createHeracrossMock();
    await expect(mock.featureFlags.isEnabled('a')).resolves.toBe(false);
    await expect(mock.servers.getAll()).resolves.toEqual([]);
    expect(() => mock.servers.addListener(() => {}).remove()).not.toThrow();
  });
});
