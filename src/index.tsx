import { Platform, type EventSubscription } from 'react-native';
import NativeHeracross from './NativeHeracross';

export type { EventSubscription };

/**
 * How the debug menu is opened.
 *
 * - `shake` — shake the device (the default). In a debug build React Native's
 *   Dev Menu listens for shakes too; on iOS it takes the gesture from the menu
 *   entirely.
 * - `floatingButton` — a draggable on-screen button. Android only; iOS falls
 *   back to `none`.
 * - `none` — open it yourself with {@link Heracross.showMenu}.
 */
export type InvocationGesture = 'shake' | 'floatingButton' | 'none';

/** Options for {@link Heracross.start}. */
export interface StartOptions {
  /**
   * Start even in a store build. Both toolkits refuse to start in one
   * otherwise.
   */
  allowProductionBuilds?: boolean;
  /**
   * Log React Native's own HTTP traffic (`fetch`, `XMLHttpRequest`) in the
   * network logger. Defaults to `true`.
   *
   * Android only. It registers Scizor's interceptor through
   * `NetworkingModule.setCustomClientBuilder`, a single slot: whichever of
   * Heracross or your app registers last wins. On iOS Scyther logs
   * `URLSession` traffic on its own and this option is ignored.
   */
  captureNetwork?: boolean;
}

/** A feature flag to register with the menu. */
export interface FeatureFlag {
  /** Stable identifier used in code. */
  key: string;
  /** Label shown in the menu. Android only; iOS lists flags by key. */
  title?: string;
  /** The value used when the flag has no active local override. */
  defaultValue: boolean;
}

/** A registered flag whose effective value changed. */
export interface FeatureFlagChange {
  /** The flag's key. */
  key: string;
  /** Its new effective value. */
  enabled: boolean;
}

/** A backend environment the menu can switch between. */
export interface Server {
  /** Unique identifier, e.g. `"Staging"`. */
  id: string;
  /**
   * The environment's base URL. Scyther has no field for it, so on iOS it is
   * stored as a variable named `baseUrl`, which makes `baseUrl` a reserved
   * variable name there.
   */
  baseUrl?: string;
  /** Extra key/value pairs shown with the environment. */
  variables?: Record<string, string>;
}

/** The selected environment, as resolved by `Heracross.servers.getSelected()`. */
export interface SelectedServer {
  /** The environment's id. */
  id: string;
  /** Its base URL, or `''` when none was configured. */
  baseUrl: string;
  /** Its variables, without the `baseUrl` entry Heracross stores on iOS. */
  variables: Record<string, string>;
}

/** A read-only key/value row in the menu's Development Tools section. */
export interface DeveloperOption {
  /** The row's label. */
  name: string;
  /** The value shown beside it. */
  value: string;
}

/** A one-tap link in the menu's Deep Link Tester. */
export interface DeepLinkPreset {
  /** Label shown in the tester. */
  name: string;
  /** The URL or custom-scheme link it opens. */
  url: string;
}

/**
 * The id of one of Scizor's built-in tools, for
 * {@link Heracross.setDisabledFeatures}. Any other string is accepted and
 * ignored, so ids added in later Scizor releases can be passed too.
 */
export type ScizorFeature =
  | 'network'
  | 'servers'
  | 'environment_variables'
  | 'feature_flags'
  | 'preferences'
  | 'cookies'
  | 'file_browser'
  | 'database_browser'
  | 'keystore'
  | 'location'
  | 'console'
  | 'deep_link'
  | 'crash_logs'
  | 'notification_logger'
  | 'notification_tester'
  | 'fonts'
  | 'interface_previews'
  | 'grid_overlay'
  | 'fps_counter'
  | 'touch_visualiser'
  | 'appearance'
  | (string & {});

/** A cookie to show in Scizor's Cookie Browser. */
export interface Cookie {
  /** The cookie's name. */
  name: string;
  /** Its value. */
  value: string;
  /** The domain it belongs to, e.g. `"example.com"`. */
  domain: string;
  /** The path it applies to, e.g. `"/"`. */
  path?: string;
  /** Whether it is only sent over HTTPS. Defaults to `false`. */
  secure?: boolean;
  /** Whether it is hidden from scripts. Defaults to `false`. */
  httpOnly?: boolean;
  /** Its `SameSite` attribute, e.g. `"Lax"`. */
  sameSite?: string;
  /** When it expires, shown as written, e.g. `"Wed, 21 Oct 2026 07:28:00 GMT"`. */
  expires?: string;
}

/** Scyther's location spoofer, as the app currently sees it. */
export interface LocationSpoofingState {
  /** Whether a spoofed location is switched on in the menu. */
  enabled: boolean;
  /** Whether Scyther's `CLLocationManager` hooks are installed. */
  swizzled: boolean;
  /** The spoofed location's display name. */
  locationName: string;
  /** The spoofed latitude, in decimal degrees. */
  latitude: number;
  /** The spoofed longitude, in decimal degrees. */
  longitude: number;
}

const gestures: ReadonlyArray<string> = ['shake', 'floatingButton', 'none'];

/** `null` and `undefined` become `''`; everything else goes through `String`. */
function toText(value: unknown): string {
  return value == null ? '' : String(value);
}

/** `null` and `undefined` stay `null`; everything else goes through `String`. */
function toOptionalText(value: unknown): string | null {
  return value == null ? null : String(value);
}

function toStringMap(values: Record<string, unknown> | undefined) {
  const map: Record<string, string> = {};
  for (const [key, value] of Object.entries(values ?? {})) {
    map[key] = toText(value);
  }
  return map;
}

/** One interface over Scyther on iOS and Scizor on Android. */
export const Heracross = {
  /**
   * Starts Scyther (iOS) or Scizor (Android). Call it once, at the top of your
   * entry file, before your app makes any network request. Once the toolkit
   * has started, further calls don't start it again; on Android they still
   * apply `captureNetwork`.
   */
  start(options: StartOptions = {}): void {
    NativeHeracross.start(
      options.allowProductionBuilds ?? false,
      options.captureNetwork ?? true
    );
  },

  /**
   * Whether the toolkit has started. It stays `false` after a `start` call
   * the toolkit refused, such as in a store build without
   * `allowProductionBuilds`. Calls made before it, including `start`, have
   * taken effect by the time it resolves.
   */
  isStarted(): Promise<boolean> {
    return NativeHeracross.isStarted();
  },

  /**
   * Opens the debug menu. Does nothing until {@link Heracross.start} has run.
   * On iOS it also does nothing while the menu is open; on Android it opens a
   * second copy.
   */
  showMenu(): void {
    NativeHeracross.showMenu();
  },

  /** Closes the debug menu if it is open. */
  hideMenu(): void {
    NativeHeracross.hideMenu();
  },

  /** Sets how the debug menu is opened. See {@link InvocationGesture}. */
  setInvocationGesture(gesture: InvocationGesture): void {
    if (__DEV__) {
      if (!gestures.includes(gesture)) {
        console.warn(
          `Heracross: unknown invocation gesture '${String(gesture)}'. The menu will only open from Heracross.showMenu().`
        );
      } else if (gesture === 'floatingButton' && Platform.OS === 'ios') {
        console.warn(
          "Heracross: 'floatingButton' is Android only; iOS will use 'none'."
        );
      }
    }
    NativeHeracross.setInvocationGesture(gesture);
  },

  /**
   * Hides built-in tools from the menu by id, replacing the previous list;
   * pass `[]` to show them all again. For a build that leaves your team, such
   * as one started with `allowProductionBuilds`. Android only: Scyther can't
   * hide its tools, so iOS ignores it.
   */
  setDisabledFeatures(features: ReadonlyArray<ScizorFeature>): void {
    NativeHeracross.setDisabledFeatures(features.map(toText));
  },

  featureFlags: {
    /**
     * Registers one or more flags so they appear, and can be overridden, in
     * the menu. Registrations aren't saved, so register your flags on every
     * launch before reading them.
     */
    register(flags: FeatureFlag | FeatureFlag[]): void {
      for (const flag of Array.isArray(flags) ? flags : [flags]) {
        const key = toText(flag.key);
        NativeHeracross.registerFeatureFlag(
          key,
          flag.title == null ? key : String(flag.title),
          Boolean(flag.defaultValue)
        );
      }
    },

    /**
     * The flag's effective value: its local override when overrides are
     * enabled and one is set, otherwise its default. Resolves `false` for a
     * flag that was never registered. To hear about later changes, use
     * {@link Heracross.featureFlags.addListener}.
     */
    isEnabled(key: string): Promise<boolean> {
      return NativeHeracross.isFeatureFlagEnabled(toText(key));
    },

    /**
     * Turns the menu's "Enable overrides" switch on or off. While it's off,
     * every flag resolves to its default. On Android this needs Scizor to
     * have started.
     */
    setOverridesEnabled(enabled: boolean): void {
      NativeHeracross.setFeatureFlagOverridesEnabled(Boolean(enabled));
    },

    /**
     * Sets a flag's local override. It takes effect while overrides are
     * enabled. On iOS the flag must be registered first; on Android Scizor
     * must have started.
     */
    setOverride(key: string, value: boolean): void {
      NativeHeracross.setFeatureFlagOverride(toText(key), Boolean(value));
    },

    /** Clears a flag's local override, so it resolves to its default again. */
    clearOverride(key: string): void {
      NativeHeracross.clearFeatureFlagOverride(toText(key));
    },

    /** Clears the local override of every registered flag. */
    resetOverrides(): void {
      NativeHeracross.resetFeatureFlagOverrides();
    },

    /**
     * Calls `listener` each time a registered flag's effective value changes:
     * from the menu, from the override methods above, or from registering the
     * flag again with a different default. A flag's first registration isn't a
     * change. Call `remove()` on the result to stop listening.
     */
    addListener(listener: (change: FeatureFlagChange) => void): EventSubscription {
      return NativeHeracross.onFeatureFlagChange((change) => {
        listener({ key: change.key, enabled: change.enabled });
      });
    },
  },

  servers: {
    /**
     * Registers the environments the menu can switch between. On Android this
     * replaces the list; on iOS it adds or replaces environments by id. When
     * the saved selection isn't one of them, the first environment is used.
     */
    configure(servers: Server[]): void {
      NativeHeracross.configureServers(
        servers.map((server) => ({
          id: toText(server.id),
          baseUrl: toText(server.baseUrl),
          variables: toStringMap(server.variables),
        }))
      );
    },

    /**
     * Selects a configured environment by id, and saves the choice across
     * launches. Unknown ids are ignored, so call `configure` first.
     */
    select(id: string): void {
      NativeHeracross.selectServer(toText(id));
    },

    /**
     * The selected environment: the saved selection, or the first configured
     * environment when there's none. Resolves `null` only when no environments
     * are configured. To hear about later changes, use
     * {@link Heracross.servers.addListener}.
     */
    async getSelected(): Promise<SelectedServer | null> {
      const server = await NativeHeracross.getSelectedServer();
      return (server as SelectedServer | null) ?? null;
    },

    /**
     * Calls `listener` with the newly selected environment each time the
     * selection moves to a different id: from the menu, from `select`, or from
     * `configure` replacing the selected environment. The first selection isn't
     * a change. On iOS a pick in the menu is reported straight away; on Android
     * it is reported when the menu closes. Call `remove()` on the result to
     * stop listening.
     */
    addListener(listener: (server: SelectedServer) => void): EventSubscription {
      return NativeHeracross.onServerChange((server) => {
        listener({
          id: server.id,
          baseUrl: server.baseUrl,
          variables: server.variables as Record<string, string>,
        });
      });
    },
  },

  /** Replaces the key/value pairs shown on the menu's Environment Variables screen. */
  setEnvironmentVariables(variables: Record<string, string>): void {
    NativeHeracross.setEnvironmentVariables(toStringMap(variables));
  },

  /**
   * Replaces the custom rows shown in the menu's Development Tools section,
   * which only appears once it has rows.
   */
  setDeveloperOptions(options: DeveloperOption[]): void {
    NativeHeracross.setDeveloperOptions(
      options.map((option) => ({
        name: toText(option.name),
        value: toText(option.value),
      }))
    );
  },

  deepLinks: {
    /** Replaces the one-tap links shown in the menu's Deep Link Tester. */
    setPresets(presets: DeepLinkPreset[]): void {
      NativeHeracross.setDeepLinkPresets(
        presets.map((preset) => ({
          name: toText(preset.name),
          url: toText(preset.url),
        }))
      );
    },
  },

  notifications: {
    /**
     * Adds a push notification payload to Scyther's Notification Logger. The
     * payload must be JSON-compatible. iOS only: on Android Scizor logs the
     * device's notifications itself once notification access is granted.
     */
    log(payload: Record<string, unknown>): void {
      NativeHeracross.logNotification(payload);
    },
  },

  /** The APNs device token shown in the Notifications section. iOS only; `null` clears it. */
  setApnsToken(token: string | null): void {
    NativeHeracross.setApnsToken(token ?? null);
  },

  /** The FCM registration token shown in the Notifications section; `null` clears it. */
  setFcmToken(token: string | null): void {
    NativeHeracross.setFcmToken(token ?? null);
  },

  cookies: {
    /**
     * Adds a cookie to Scizor's Cookie Browser, alongside those Scizor sees in
     * captured traffic. Android only: on iOS, Scyther's Cookie Browser lists
     * the shared `HTTPCookieStorage`, where React Native's networking already
     * keeps its cookies.
     */
    log(cookie: Cookie): void {
      NativeHeracross.logCookie({
        name: toText(cookie.name),
        value: toText(cookie.value),
        domain: toText(cookie.domain),
        path: toOptionalText(cookie.path),
        secure: Boolean(cookie.secure),
        httpOnly: Boolean(cookie.httpOnly),
        sameSite: toOptionalText(cookie.sameSite),
        expires: toOptionalText(cookie.expires),
      });
    },

    /**
     * Adds every cookie the Android WebView cookie store holds for `url`, such
     * as those set in a `react-native-webview`. Android only.
     */
    captureWebView(url: string): void {
      NativeHeracross.captureWebViewCookies(toText(url));
    },

    /** Removes the cookies added with `log` and `captureWebView`. Android only. */
    clear(): void {
      NativeHeracross.clearLoggedCookies();
    },
  },

  crashes: {
    /**
     * Crashes the app on purpose, so the menu's Crash Logs has an entry after
     * you reopen it. On iOS this raises Scyther's test exception, which Scyther
     * only compiles into Debug builds. On Android it throws on the main thread,
     * and only in a debuggable build. Anywhere else it does nothing.
     */
    triggerTestCrash(): void {
      NativeHeracross.triggerTestCrash();
    },
  },

  location: {
    /**
     * Scyther's location spoofer state. Resolves `null` on Android: Scizor
     * doesn't expose its spoofer, though a spoofed location still reaches
     * `LocationManager`.
     */
    async getSpoofingState(): Promise<LocationSpoofingState | null> {
      const state = await NativeHeracross.getLocationSpoofingState();
      return (state as LocationSpoofingState | null) ?? null;
    },
  },
};

export default Heracross;
