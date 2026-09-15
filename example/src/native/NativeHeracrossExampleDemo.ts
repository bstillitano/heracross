import { TurboModuleRegistry, type CodegenTypes, type TurboModule } from 'react-native';

/** A fix from the platform location service. `timestamp` is milliseconds since the epoch. */
export type LocationFix = {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number;
  timestamp: number;
};

export type RecordCounts = {
  users: number;
  posts: number;
  products: number;
};

/** The window's safe area, in points (iOS) or density-independent pixels (Android). */
export type SafeAreaInsets = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

/**
 * The example app's own native code: the demo data ScytherExample creates in
 * Swift (and Scizor's sample in Kotlin), so every data browser in the menu has
 * something to show, plus the platform location service for the Location tab.
 *
 * Authorization values are `'notDetermined'`, `'denied'` or `'authorized'`.
 */
export interface Spec extends TurboModule {
  /**
   * iOS: cookies, keychain items and the demo database. Android: the
   * `user_prefs` and `app_settings` SharedPreferences Scizor's sample seeds,
   * and the demo database; Android's cookies are logged from `src/setup.ts`.
   */
  seedDemoData(): void;

  writeSampleDefaults(): void;
  clearSampleDefaults(): void;

  getRecordCounts(): Promise<RecordCounts>;
  addDemoRecords(): Promise<RecordCounts>;
  clearDemoRecords(): Promise<RecordCounts>;

  getLocationAuthorization(): Promise<string>;
  requestLocationPermission(): void;
  requestLocation(): void;
  startLocationUpdates(): void;
  stopLocationUpdates(): void;

  /**
   * React Native no longer ships a safe area component, and the example avoids
   * third-party native libraries, so the window's insets come from here.
   */
  getSafeAreaInsets(): Promise<SafeAreaInsets>;

  readonly onLocationAuthorizationChange: CodegenTypes.EventEmitter<string>;
  readonly onLocationUpdate: CodegenTypes.EventEmitter<LocationFix>;
  readonly onLocationError: CodegenTypes.EventEmitter<string>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('HeracrossExampleDemo');
