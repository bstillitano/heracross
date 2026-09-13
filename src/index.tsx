import { Platform } from 'react-native';
import NativeHeracross from './NativeHeracross';

/**
 * How the debug menu is opened.
 *
 * - `shake` — shake the device (both platforms, the default).
 * - `floatingButton` — a draggable on-screen button. Android only; iOS falls
 *   back to `none`.
 * - `none` — open it yourself with {@link Heracross.showMenu}.
 */
export type InvocationGesture = 'shake' | 'floatingButton' | 'none';

export interface StartOptions {
  /**
   * Start even in a production build. Both toolkits refuse to run in an App
   * Store / Play Store build unless this is set.
   */
  allowProductionBuilds?: boolean;
  /**
   * Route React Native's own HTTP traffic (`fetch`, `XMLHttpRequest`) into the
   * network logger. Defaults to `true`.
   *
   * On Android this installs an `OkHttpClientProvider` factory, which replaces
   * any factory your app installed. On iOS Scyther intercepts `URLSession`
   * traffic on its own and this option has no effect.
   */
  captureNetwork?: boolean;
}

export interface FeatureFlag {
  /** Stable identifier used in code. */
  key: string;
  /** Label shown in the menu. Android only; iOS shows the key. */
  title?: string;
  /** The remote / baseline value used when there is no local override. */
  defaultValue: boolean;
}

export interface Server {
  /** Unique identifier, e.g. `"Staging"`. */
  id: string;
  /**
   * The environment's base URL. Scizor has a dedicated field for it; Scyther
   * has none, so on iOS it is stored as a `baseUrl` variable.
   */
  baseUrl?: string;
  variables?: Record<string, string>;
}

export interface SelectedServer {
  id: string;
  baseUrl: string;
  variables: Record<string, string>;
}

/** A read-only key/value row in the menu's Developer section. */
export interface DeveloperOption {
  name: string;
  value: string;
}

/** Scyther's location spoofer, as the app currently sees it. */
export interface LocationSpoofingState {
  /** Whether a spoofed location is switched on in the menu. */
  enabled: boolean;
  /** Whether Scyther's `CLLocationManager` hooks are installed. */
  swizzled: boolean;
  /** The spoofed location's display name. */
  locationName: string;
  latitude: number;
  longitude: number;
}

function toStringMap(values: Record<string, unknown> | undefined) {
  const map: Record<string, string> = {};
  for (const [key, value] of Object.entries(values ?? {})) {
    map[key] = String(value);
  }
  return map;
}

export const Heracross = {
  /**
   * Starts Scyther (iOS) or Scizor (Android). Call once, as early as possible —
   * ideally at the top of your entry file, before any network request.
   */
  start(options: StartOptions = {}): void {
    NativeHeracross.start(
      options.allowProductionBuilds ?? false,
      options.captureNetwork ?? true
    );
  },

  /** Opens the debug menu. No-op until {@link Heracross.start} has run. */
  showMenu(): void {
    NativeHeracross.showMenu();
  },

  /** Closes the debug menu if it is open. */
  hideMenu(): void {
    NativeHeracross.hideMenu();
  },

  setInvocationGesture(gesture: InvocationGesture): void {
    if (__DEV__ && gesture === 'floatingButton' && Platform.OS === 'ios') {
      console.warn(
        "Heracross: 'floatingButton' is Android only; iOS will use 'none'."
      );
    }
    NativeHeracross.setInvocationGesture(gesture);
  },

  featureFlags: {
    /** Registers one or more flags so they appear, and can be overridden, in the menu. */
    register(flags: FeatureFlag | FeatureFlag[]): void {
      for (const flag of Array.isArray(flags) ? flags : [flags]) {
        NativeHeracross.registerFeatureFlag(
          flag.key,
          flag.title ?? flag.key,
          flag.defaultValue
        );
      }
    },

    /** The flag's effective value: the local override if one is set, else its default. */
    isEnabled(key: string): Promise<boolean> {
      return NativeHeracross.isFeatureFlagEnabled(key);
    },
  },

  servers: {
    /** Registers the environments the menu can switch between. */
    configure(servers: Server[]): void {
      NativeHeracross.configureServers(
        servers.map((server) => ({
          id: server.id,
          baseUrl: server.baseUrl ?? '',
          variables: toStringMap(server.variables),
        }))
      );
    },

    /** Selects a registered environment by id. */
    select(id: string): void {
      NativeHeracross.selectServer(id);
    },

    /** The selected environment, or `null` if none is selected. */
    async getSelected(): Promise<SelectedServer | null> {
      const server = await NativeHeracross.getSelectedServer();
      return (server as SelectedServer | null) ?? null;
    },
  },

  /** Replaces the key/value pairs shown on the menu's Environment Variables screen. */
  setEnvironmentVariables(variables: Record<string, string>): void {
    NativeHeracross.setEnvironmentVariables(toStringMap(variables));
  },

  /** Replaces the custom rows shown in the menu's Developer section. */
  setDeveloperOptions(options: DeveloperOption[]): void {
    NativeHeracross.setDeveloperOptions(
      options.map(({ name, value }) => ({ name, value: String(value) }))
    );
  },

  /** The APNs device token shown in the Notifications section. iOS only. */
  setApnsToken(token: string | null): void {
    NativeHeracross.setApnsToken(token);
  },

  /** The FCM registration token shown in the Notifications section. */
  setFcmToken(token: string | null): void {
    NativeHeracross.setFcmToken(token);
  },

  crashes: {
    /**
     * Crashes the app on purpose. Reopen it to find the crash in the menu's
     * Crash Logs. On Android this throws on the main thread, which is what
     * Scizor records.
     */
    triggerTestCrash(): void {
      NativeHeracross.triggerTestCrash();
    },
  },

  location: {
    /**
     * Scyther's location spoofer state. Resolves `null` on Android: Scizor does
     * not expose its spoofer, though a spoofed location still reaches
     * `LocationManager`.
     */
    async getSpoofingState(): Promise<LocationSpoofingState | null> {
      const state = await NativeHeracross.getLocationSpoofingState();
      return (state as LocationSpoofingState | null) ?? null;
    },
  },
};

export default Heracross;
