import { beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('../NativeHeracross', () => ({
  __esModule: true,
  default: {
    start: jest.fn(),
    showMenu: jest.fn(),
    hideMenu: jest.fn(),
    setInvocationGesture: jest.fn(),
    registerFeatureFlag: jest.fn(),
    isFeatureFlagEnabled: jest.fn(() => Promise.resolve(true)),
    configureServers: jest.fn(),
    selectServer: jest.fn(),
    getSelectedServer: jest.fn(() => Promise.resolve(null)),
    setEnvironmentVariables: jest.fn(),
    setDeveloperOptions: jest.fn(),
    setApnsToken: jest.fn(),
    setFcmToken: jest.fn(),
    triggerTestCrash: jest.fn(),
    getLocationSpoofingState: jest.fn(() => Promise.resolve(null)),
  },
}));

// eslint-disable-next-line import/first
import Heracross from '../index';
// eslint-disable-next-line import/first
import NativeHeracross from '../NativeHeracross';

const native = NativeHeracross as jest.Mocked<typeof NativeHeracross>;

describe('Heracross', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('starts refusing production builds and capturing network by default', () => {
    Heracross.start();
    expect(native.start).toHaveBeenCalledWith(false, true);
  });

  it('passes start options through', () => {
    Heracross.start({ allowProductionBuilds: true, captureNetwork: false });
    expect(native.start).toHaveBeenCalledWith(true, false);
  });

  it('registers a single flag or a list, titling by key when untitled', () => {
    Heracross.featureFlags.register({ key: 'a', defaultValue: true });
    Heracross.featureFlags.register([
      { key: 'b', title: 'Bee', defaultValue: false },
    ]);
    expect(native.registerFeatureFlag).toHaveBeenNthCalledWith(1, 'a', 'a', true);
    expect(native.registerFeatureFlag).toHaveBeenNthCalledWith(2, 'b', 'Bee', false);
  });

  it('resolves flag state from native', async () => {
    await expect(Heracross.featureFlags.isEnabled('a')).resolves.toBe(true);
    expect(native.isFeatureFlagEnabled).toHaveBeenCalledWith('a');
  });

  it('normalises servers so native only sees strings', () => {
    Heracross.servers.configure([
      { id: 'Dev' },
      {
        id: 'Prod',
        baseUrl: 'https://api',
        variables: { RETRIES: 3 as unknown as string },
      },
    ]);
    expect(native.configureServers).toHaveBeenCalledWith([
      { id: 'Dev', baseUrl: '', variables: {} },
      { id: 'Prod', baseUrl: 'https://api', variables: { RETRIES: '3' } },
    ]);
  });

  it('resolves null when no server is selected', async () => {
    await expect(Heracross.servers.getSelected()).resolves.toBeNull();
  });

  it('stringifies environment variables and developer option values', () => {
    Heracross.setEnvironmentVariables({ FLAG: true as unknown as string });
    Heracross.setDeveloperOptions([
      { name: 'Build', value: 42 as unknown as string },
    ]);
    expect(native.setEnvironmentVariables).toHaveBeenCalledWith({ FLAG: 'true' });
    expect(native.setDeveloperOptions).toHaveBeenCalledWith([
      { name: 'Build', value: '42' },
    ]);
  });

  it('forwards the test crash', () => {
    Heracross.crashes.triggerTestCrash();
    expect(native.triggerTestCrash).toHaveBeenCalledTimes(1);
  });

  it('resolves null spoofing state when the platform reports none', async () => {
    await expect(Heracross.location.getSpoofingState()).resolves.toBeNull();
  });
});
