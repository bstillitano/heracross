import { Platform, type EventSubscription } from 'react-native';
import NativeHeracross, { type Spec } from './NativeHeracross';

export type { EventSubscription };

/**
 * How the debug menu is opened.
 *
 * - `shake` — shake the device (the default). In a debug build React Native's
 *   Dev Menu listens for shakes too: on iOS it takes the gesture from the
 *   menu; on Android Scizor's menu opens and the Dev Menu doesn't.
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

/** A registered flag and its current state, from `featureFlags.getAll()`. */
export interface FeatureFlagState {
  /** The flag's key. */
  key: string;
  /** Its label in the menu. iOS lists flags by key, so there it is the key. */
  title: string;
  /** The value it was registered with. */
  defaultValue: boolean;
  /** Its effective value, as `featureFlags.isEnabled` resolves it. */
  enabled: boolean;
  /**
   * Its stored local override, whether or not overrides are enabled, or
   * `null` when it has none.
   */
  override: boolean | null;
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

/** A configured environment, as resolved by the `servers` reads. */
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
  /** Whether Scyther's `CLLocationManager` method swaps are installed. */
  swizzled: boolean;
  /** The spoofed location's display name. */
  locationName: string;
  /** The spoofed latitude, in decimal degrees. */
  latitude: number;
  /** The spoofed longitude, in decimal degrees. */
  longitude: number;
}

/**
 * Which platform-specific features work on the current platform. Calls for a
 * feature that isn't supported do nothing.
 */
export interface HeracrossSupport {
  /** The `floatingButton` invocation gesture. Android. */
  floatingButton: boolean;
  /** `setDisabledFeatures`. Android. */
  disabledFeatures: boolean;
  /** `cookies.log`, `cookies.captureWebView` and `cookies.clear`. Android. */
  cookies: boolean;
  /** `setApnsToken`. iOS. */
  apnsToken: boolean;
  /** `notifications.log`. iOS. */
  notificationLog: boolean;
  /** `location.getSpoofingState` resolving a state rather than `null`. iOS. */
  locationSpoofingState: boolean;
}

const gestures: ReadonlyArray<string> = ['shake', 'floatingButton', 'none'];

const noSubscription: EventSubscription = { remove() {} };

/** Stands in for the native module when it isn't in the binary. */
const unavailable: Spec = {
  start() {},
  isStarted: () => Promise.resolve(false),
  showMenu() {},
  hideMenu() {},
  isMenuOpen: () => Promise.resolve(false),
  setInvocationGesture() {},
  setDisabledFeatures() {},
  registerFeatureFlag() {},
  isFeatureFlagEnabled: () => Promise.resolve(false),
  getFeatureFlags: () => Promise.resolve([]),
  getFeatureFlagOverride: () => Promise.resolve(null),
  getFeatureFlagOverridesEnabled: () => Promise.resolve(false),
  setFeatureFlagOverridesEnabled() {},
  setFeatureFlagOverride() {},
  clearFeatureFlagOverride() {},
  resetFeatureFlagOverrides() {},
  configureServers() {},
  selectServer() {},
  getSelectedServer: () => Promise.resolve(null),
  getServers: () => Promise.resolve([]),
  setEnvironmentVariables() {},
  getEnvironmentVariables: () => Promise.resolve({}),
  setDeveloperOptions() {},
  setDeepLinkPresets() {},
  setApnsToken() {},
  setFcmToken() {},
  logNotification() {},
  logCookie() {},
  captureWebViewCookies() {},
  clearLoggedCookies() {},
  triggerTestCrash() {},
  getLocationSpoofingState: () => Promise.resolve(null),
  onFeatureFlagChange: () => noSubscription,
  onServerChange: () => noSubscription,
};

const native: Spec = NativeHeracross ?? unavailable;

function warn(message: string) {
  if (__DEV__) {
    console.warn(`Heracross: ${message}`);
  }
}

if (NativeHeracross == null) {
  warn(
    "the native module isn't in this build, so every call does nothing. Rebuild the app after installing Heracross; see Troubleshooting in the README."
  );
}

/**
 * Strings as they are; numbers, booleans and bigints through `String`;
 * anything else, including `null`, `undefined` and objects, as `null`.
 */
function toPrimitiveText(value: unknown): string | null {
  switch (typeof value) {
    case 'string':
      return value;
    case 'number':
    case 'boolean':
    case 'bigint':
      return String(value);
    default:
      return null;
  }
}

/** Keeps the entries whose values {@link toPrimitiveText} can convert. */
function toStringMap(values: unknown): Record<string, string> {
  const map: Record<string, string> = {};
  if (values == null || typeof values !== 'object') {
    return map;
  }
  for (const [key, value] of Object.entries(values)) {
    const text = toPrimitiveText(value);
    if (text != null) {
      map[key] = text;
    }
  }
  return map;
}

function asList<T>(value: T | ReadonlyArray<T>): ReadonlyArray<T> {
  return Array.isArray(value) ? (value as ReadonlyArray<T>) : [value as T];
}

function toSelectedServer(server: object): SelectedServer {
  const { id, baseUrl, variables } = server as Partial<SelectedServer>;
  return {
    id: toPrimitiveText(id) ?? '',
    baseUrl: toPrimitiveText(baseUrl) ?? '',
    variables: toStringMap(variables),
  };
}

function toFeatureFlagState(flag: object): FeatureFlagState {
  const { key, title, defaultValue, enabled, override } =
    flag as Partial<FeatureFlagState>;
  const flagKey = toPrimitiveText(key) ?? '';
  return {
    key: flagKey,
    title: toPrimitiveText(title) ?? flagKey,
    defaultValue: Boolean(defaultValue),
    enabled: Boolean(enabled),
    override: override == null ? null : Boolean(override),
  };
}

/** One interface over Scyther on iOS and Scizor on Android. */
export const Heracross = {
  /**
   * Whether the native module is in this build. When it isn't, for example
   * before the app has been rebuilt after installing Heracross, every call
   * does nothing and every read resolves an empty value.
   */
  isAvailable: NativeHeracross != null,

  /** Which platform-specific features work on the current platform. */
  get supports(): Readonly<HeracrossSupport> {
    const android = Platform.OS === 'android';
    const ios = Platform.OS === 'ios';
    return {
      floatingButton: android,
      disabledFeatures: android,
      cookies: android,
      apnsToken: ios,
      notificationLog: ios,
      locationSpoofingState: ios,
    };
  },

  /**
   * Starts Scyther (iOS) or Scizor (Android). Call it once, at the top of your
   * entry file, before your app makes any network request and before the
   * feature flag and server calls. Once the toolkit has started, further calls
   * don't start it again; on Android they still apply `captureNetwork`.
   */
  start(options: StartOptions = {}): void {
    native.start(
      Boolean(options.allowProductionBuilds ?? false),
      Boolean(options.captureNetwork ?? true)
    );
  },

  /**
   * Whether the toolkit has started. It stays `false` after a `start` call
   * the toolkit refused, such as in a store build without
   * `allowProductionBuilds`. A `start` call made before it has taken effect by
   * the time it resolves. On Android it only reflects `start` calls made
   * through Heracross; Scizor doesn't report a start made from native code.
   */
  isStarted(): Promise<boolean> {
    return native.isStarted();
  },

  /**
   * Opens the debug menu. Does nothing until {@link Heracross.start} has run.
   * On iOS it also does nothing while the menu is open; on Android it opens a
   * second copy.
   */
  showMenu(): void {
    native.showMenu();
  },

  /** Closes the debug menu if it is open. */
  hideMenu(): void {
    native.hideMenu();
  },

  /** Whether the debug menu is open. */
  isMenuOpen(): Promise<boolean> {
    return native.isMenuOpen();
  },

  /** Sets how the debug menu is opened. See {@link InvocationGesture}. */
  setInvocationGesture(gesture: InvocationGesture): void {
    if (!gestures.includes(gesture)) {
      warn(
        `unknown invocation gesture '${String(gesture)}'. The menu will only open from Heracross.showMenu().`
      );
    } else if (gesture === 'floatingButton' && Platform.OS === 'ios') {
      warn("'floatingButton' is Android only; iOS will use 'none'.");
    }
    native.setInvocationGesture(toPrimitiveText(gesture) ?? 'none');
  },

  /**
   * Hides built-in tools from the menu by id, replacing the previous list;
   * pass `[]` to show them all again. For a build that leaves your team, such
   * as one started with `allowProductionBuilds`. Android only: Scyther can't
   * hide its tools, so iOS ignores it. See {@link Heracross.supports}.
   */
  setDisabledFeatures(features: ReadonlyArray<ScizorFeature>): void {
    const ids: string[] = [];
    for (const feature of features) {
      const id = toPrimitiveText(feature);
      if (id != null) {
        ids.push(id);
      }
    }
    native.setDisabledFeatures(ids);
  },

  /**
   * Feature flags. On Android, the override calls made before `start` are
   * applied once Scizor starts, and reads made before then resolve each
   * flag's default.
   */
  featureFlags: {
    /**
     * Registers one or more flags so they appear, and can be overridden, in
     * the menu. Registrations aren't saved, so register your flags on every
     * launch before reading them. A flag without a key is skipped.
     */
    register(flags: FeatureFlag | ReadonlyArray<FeatureFlag>): void {
      for (const flag of asList(flags)) {
        const key = flag == null ? null : toPrimitiveText(flag.key);
        if (key == null || key === '') {
          warn('featureFlags.register skipped a flag without a key.');
          continue;
        }
        native.registerFeatureFlag(
          key,
          toPrimitiveText(flag.title) ?? key,
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
      return native.isFeatureFlagEnabled(toPrimitiveText(key) ?? '');
    },

    /** Every registered flag, with its default, effective value and override. */
    async getAll(): Promise<FeatureFlagState[]> {
      const flags = await native.getFeatureFlags();
      return (flags ?? []).map(toFeatureFlagState);
    },

    /**
     * The flag's stored local override, whether or not overrides are
     * enabled, or `null` when it has none or isn't registered.
     */
    async getOverride(key: string): Promise<boolean | null> {
      const override = await native.getFeatureFlagOverride(
        toPrimitiveText(key) ?? ''
      );
      return override == null ? null : Boolean(override);
    },

    /** Whether the menu's "Enable overrides" switch is on. */
    getOverridesEnabled(): Promise<boolean> {
      return native.getFeatureFlagOverridesEnabled();
    },

    /**
     * Turns the menu's "Enable overrides" switch on or off. While it's off,
     * every flag resolves to its default.
     */
    setOverridesEnabled(enabled: boolean): void {
      native.setFeatureFlagOverridesEnabled(Boolean(enabled));
    },

    /**
     * Sets a flag's local override. It takes effect while overrides are
     * enabled. On iOS the flag must be registered first.
     */
    setOverride(key: string, value: boolean): void {
      native.setFeatureFlagOverride(toPrimitiveText(key) ?? '', Boolean(value));
    },

    /** Clears a flag's local override, so it resolves to its default again. */
    clearOverride(key: string): void {
      native.clearFeatureFlagOverride(toPrimitiveText(key) ?? '');
    },

    /** Clears the local override of every registered flag. */
    resetOverrides(): void {
      native.resetFeatureFlagOverrides();
    },

    /**
     * Calls `listener` each time a registered flag's effective value changes:
     * from the menu, from the override methods above, or from registering the
     * flag again with a different default. A flag's first registration isn't a
     * change. Call `remove()` on the result to stop listening.
     */
    addListener(listener: (change: FeatureFlagChange) => void): EventSubscription {
      return native.onFeatureFlagChange((change) => {
        listener({ key: change.key, enabled: Boolean(change.enabled) });
      });
    },
  },

  /**
   * Server environments. On Android, a `select` made before `start` is
   * applied once Scizor starts, and reads made before then ignore the saved
   * selection.
   */
  servers: {
    /**
     * Registers the environments the menu can switch between. When the saved
     * selection isn't one of them, the first environment is selected. On
     * Android this replaces the list. On iOS it adds or replaces environments
     * by id: Scyther can't remove one, so an environment left out stays in the
     * menu. An environment without an id is skipped.
     */
    configure(servers: ReadonlyArray<Server>): void {
      const entries: Array<{
        id: string;
        baseUrl: string;
        variables: Record<string, string>;
      }> = [];
      for (const server of servers) {
        const id = server == null ? null : toPrimitiveText(server.id);
        if (id == null || id === '') {
          warn('servers.configure skipped an environment without an id.');
          continue;
        }
        entries.push({
          id,
          baseUrl: toPrimitiveText(server.baseUrl) ?? '',
          variables: toStringMap(server.variables),
        });
      }
      native.configureServers(entries);
    },

    /**
     * Selects a configured environment by id, and saves the choice across
     * launches. Unknown ids are ignored, so call `configure` first.
     */
    select(id: string): void {
      native.selectServer(toPrimitiveText(id) ?? '');
    },

    /**
     * The selected environment: the saved selection, or the first configured
     * environment when there's none. Resolves `null` only when no environments
     * are configured. To hear about later changes, use
     * {@link Heracross.servers.addListener}.
     */
    async getSelected(): Promise<SelectedServer | null> {
      const server = await native.getSelectedServer();
      return server == null ? null : toSelectedServer(server);
    },

    /** Every configured environment, in the order the menu lists them. */
    async getAll(): Promise<SelectedServer[]> {
      const servers = await native.getServers();
      return (servers ?? []).map(toSelectedServer);
    },

    /**
     * Calls `listener` with the newly selected environment each time the
     * selection moves to a different id: from the menu, from `select`, or from
     * `configure` when the selected environment is no longer in the list. The
     * first selection isn't a change. On iOS a pick in the menu is reported
     * straight away; on Android it is reported when the menu closes. Call
     * `remove()` on the result to stop listening.
     */
    addListener(listener: (server: SelectedServer) => void): EventSubscription {
      return native.onServerChange((server) => {
        listener(toSelectedServer(server));
      });
    },
  },

  /**
   * Replaces the key/value pairs shown on the menu's Environment Variables
   * screen. Values that aren't strings, numbers or booleans are skipped.
   */
  setEnvironmentVariables(variables: Record<string, string>): void {
    native.setEnvironmentVariables(toStringMap(variables));
  },

  /** The key/value pairs shown on the menu's Environment Variables screen. */
  async getEnvironmentVariables(): Promise<Record<string, string>> {
    return toStringMap(await native.getEnvironmentVariables());
  },

  /**
   * Replaces the custom rows shown in the menu's Development Tools section,
   * which only appears once it has rows. A row without a name is skipped.
   */
  setDeveloperOptions(options: ReadonlyArray<DeveloperOption>): void {
    const rows: Array<{ name: string; value: string }> = [];
    for (const option of options) {
      const name = option == null ? null : toPrimitiveText(option.name);
      if (name == null) {
        warn('setDeveloperOptions skipped a row without a name.');
        continue;
      }
      rows.push({ name, value: toPrimitiveText(option.value) ?? '' });
    }
    native.setDeveloperOptions(rows);
  },

  deepLinks: {
    /**
     * Replaces the one-tap links shown in the menu's Deep Link Tester. A
     * preset without a name or URL is skipped.
     */
    setPresets(presets: ReadonlyArray<DeepLinkPreset>): void {
      const links: Array<{ name: string; url: string }> = [];
      for (const preset of presets) {
        const name = preset == null ? null : toPrimitiveText(preset.name);
        const url = preset == null ? null : toPrimitiveText(preset.url);
        if (name == null || url == null) {
          warn('deepLinks.setPresets skipped a preset without a name or url.');
          continue;
        }
        links.push({ name, url });
      }
      native.setDeepLinkPresets(links);
    },
  },

  notifications: {
    /**
     * Adds a push notification payload to Scyther's Notification Logger. The
     * payload must be a JSON-compatible object. iOS only: on Android Scizor
     * logs the device's notifications itself once notification access is
     * granted. See {@link Heracross.supports}.
     */
    log(payload: Record<string, unknown>): void {
      if (payload == null || typeof payload !== 'object' || Array.isArray(payload)) {
        warn('notifications.log needs a payload object.');
        return;
      }
      native.logNotification(payload);
    },
  },

  /**
   * The APNs device token shown in the Notifications section; `null` clears
   * it. iOS only. See {@link Heracross.supports}.
   */
  setApnsToken(token: string | null): void {
    native.setApnsToken(toPrimitiveText(token));
  },

  /** The FCM registration token shown in the Notifications section; `null` clears it. */
  setFcmToken(token: string | null): void {
    native.setFcmToken(toPrimitiveText(token));
  },

  cookies: {
    /**
     * Adds a cookie to Scizor's Cookie Browser, alongside those Scizor sees in
     * captured traffic. A cookie without a name, value or domain is skipped.
     * Android only: on iOS, Scyther's Cookie Browser lists the shared
     * `HTTPCookieStorage`, where React Native's networking already keeps its
     * cookies. See {@link Heracross.supports}.
     */
    log(cookie: Cookie): void {
      const name = cookie == null ? null : toPrimitiveText(cookie.name);
      const value = cookie == null ? null : toPrimitiveText(cookie.value);
      const domain = cookie == null ? null : toPrimitiveText(cookie.domain);
      if (name == null || value == null || domain == null) {
        warn('cookies.log skipped a cookie without a name, value or domain.');
        return;
      }
      native.logCookie({
        name,
        value,
        domain,
        path: toPrimitiveText(cookie.path),
        secure: Boolean(cookie.secure),
        httpOnly: Boolean(cookie.httpOnly),
        sameSite: toPrimitiveText(cookie.sameSite),
        expires: toPrimitiveText(cookie.expires),
      });
    },

    /**
     * Adds every cookie the Android WebView cookie store holds for `url`, such
     * as those set in a `react-native-webview`. Android only.
     */
    captureWebView(url: string): void {
      native.captureWebViewCookies(toPrimitiveText(url) ?? '');
    },

    /** Removes the cookies added with `log` and `captureWebView`. Android only. */
    clear(): void {
      native.clearLoggedCookies();
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
      native.triggerTestCrash();
    },
  },

  location: {
    /**
     * Scyther's location spoofer state. Resolves `null` on Android: Scizor
     * doesn't expose its spoofer, though a spoofed location still reaches
     * `LocationManager`. See {@link Heracross.supports}.
     */
    async getSpoofingState(): Promise<LocationSpoofingState | null> {
      const state = await native.getLocationSpoofingState();
      return (state as LocationSpoofingState | null) ?? null;
    },
  },
};

export default Heracross;
