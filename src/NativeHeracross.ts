import { TurboModuleRegistry, type CodegenTypes, type TurboModule } from 'react-native';

/**
 * The native surface shared by Scyther (iOS) and Scizor (Android).
 *
 * This spec is intentionally flat: `src/index.tsx` is the public API. It fills
 * in defaults and converts ids, names and values to strings, so native code
 * only ever sees strings, booleans, and objects and arrays built from them.
 */
export interface Spec extends TurboModule {
  start(allowProductionBuilds: boolean, captureNetwork: boolean): void;
  showMenu(): void;
  hideMenu(): void;
  setInvocationGesture(gesture: string): void;

  registerFeatureFlag(key: string, title: string, defaultValue: boolean): void;
  isFeatureFlagEnabled(key: string): Promise<boolean>;
  setFeatureFlagOverridesEnabled(enabled: boolean): void;
  setFeatureFlagOverride(key: string, value: boolean): void;
  clearFeatureFlagOverride(key: string): void;
  resetFeatureFlagOverrides(): void;

  /** Each element: `{ id: string, baseUrl: string, variables: {[k]: string} }`. */
  configureServers(servers: ReadonlyArray<CodegenTypes.UnsafeObject>): void;
  selectServer(id: string): void;
  /** Resolves `{ id, baseUrl, variables }`, or `null` when nothing is configured. */
  getSelectedServer(): Promise<CodegenTypes.UnsafeObject | null>;

  /** A `{[key]: string}` map. */
  setEnvironmentVariables(variables: CodegenTypes.UnsafeObject): void;
  /** Each element: `{ name: string, value: string }`. */
  setDeveloperOptions(options: ReadonlyArray<CodegenTypes.UnsafeObject>): void;
  /** Each element: `{ name: string, url: string }`. */
  setDeepLinkPresets(presets: ReadonlyArray<CodegenTypes.UnsafeObject>): void;

  setApnsToken(token: string | null): void;
  setFcmToken(token: string | null): void;
  /** A JSON-compatible push payload. iOS only; Android ignores it. */
  logNotification(payload: CodegenTypes.UnsafeObject): void;

  /** Crashes the app so the toolkit's crash log has an entry to show. */
  triggerTestCrash(): void;
  /**
   * Resolves `{ enabled, swizzled, locationName, latitude, longitude }` on iOS.
   * Resolves `null` on Android, where Scizor keeps its spoofer internal.
   */
  getLocationSpoofingState(): Promise<CodegenTypes.UnsafeObject | null>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('Heracross');
