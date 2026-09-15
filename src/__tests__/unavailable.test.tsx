import { describe, expect, it, jest } from '@jest/globals';

// The native module isn't in the binary, as before an app is rebuilt after
// installing Heracross: TurboModuleRegistry.get resolves null.
jest.mock('../NativeHeracross', () => ({ __esModule: true, default: null }));

describe('Heracross without the native module', () => {
  it('warns once on import and turns every call into a no-op', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { Heracross } = require('../index') as typeof import('../index');

    expect(Heracross.isAvailable).toBe(false);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("native module isn't in this build")
    );

    expect(() => {
      Heracross.start();
      Heracross.showMenu();
      Heracross.hideMenu();
      Heracross.featureFlags.register({ key: 'a', defaultValue: true });
      Heracross.featureFlags.setOverride('a', true);
      Heracross.servers.configure([{ id: 'Dev' }]);
      Heracross.servers.select('Dev');
      Heracross.setEnvironmentVariables({ A: 'b' });
      Heracross.cookies.log({ name: 'a', value: 'b', domain: 'c' });
      Heracross.crashes.triggerTestCrash();
    }).not.toThrow();

    await expect(Heracross.isStarted()).resolves.toBe(false);
    await expect(Heracross.isMenuOpen()).resolves.toBe(false);
    await expect(Heracross.featureFlags.isEnabled('a')).resolves.toBe(false);
    await expect(Heracross.featureFlags.getAll()).resolves.toEqual([]);
    await expect(Heracross.featureFlags.getOverride('a')).resolves.toBeNull();
    await expect(Heracross.featureFlags.getOverridesEnabled()).resolves.toBe(false);
    await expect(Heracross.servers.getSelected()).resolves.toBeNull();
    await expect(Heracross.servers.getAll()).resolves.toEqual([]);
    await expect(Heracross.getEnvironmentVariables()).resolves.toEqual({});
    await expect(Heracross.location.getSpoofingState()).resolves.toBeNull();

    const subscriptions = [
      Heracross.featureFlags.addListener(() => {}),
      Heracross.servers.addListener(() => {}),
    ];
    expect(() => subscriptions.forEach((subscription) => subscription.remove())).not.toThrow();

    // Only the import warned; the calls themselves stay quiet.
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });
});
