import { Platform } from 'react-native';
import Heracross, {
  type DeepLinkPreset,
  type DeveloperOption,
  type InvocationGesture,
} from 'heracross';
import ExampleDemo from './native/NativeHeracrossExampleDemo';

/**
 * The invocation gesture after launch: shake, Heracross's default, on iOS, and
 * the floating button Scizor's sample uses on Android. Heracross has no getter
 * for the gesture, so the Heracross tab starts from this.
 */
export const initialInvocationGesture: InvocationGesture =
  Platform.OS === 'android' ? 'floatingButton' : 'shake';

/** The FCM token Scizor's sample sets in `SampleApp.kt`. */
export const sampleFcmToken = 'demo-fcm-token-a1b2c3d4e5f6g7h8i9j0';

/** The deep link presets Scizor's sample sets in `SampleApp.kt`. */
export const sampleDeepLinkPresets: DeepLinkPreset[] = [
  { name: 'Home', url: 'scizorsample://home' },
  { name: 'Profile', url: 'scizorsample://user/42' },
  { name: 'Settings', url: 'scizorsample://settings' },
  { name: 'Example.com', url: 'https://example.com' },
];

/**
 * Scizor's sample sets five developer options in `SampleApp.kt`: three
 * actions, a toggle and a value. Heracross's developer options are read-only
 * name/value rows, which can't carry the callbacks the actions and the toggle
 * run, so only the value row is ported.
 */
export const sampleDeveloperOptions: DeveloperOption[] = [
  { name: 'Sample build', value: 'demo' },
];

/** `new_checkout_flow` → `New checkout flow`, the label Scizor's sample uses. Scyther shows the key. */
function flagTitle(key: string) {
  const words = key.replace(/_/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function registerFlags(flags: Array<[string, boolean]>) {
  Heracross.featureFlags.register(
    flags.map(([key, defaultValue]) => ({
      key,
      title: flagTitle(key),
      defaultValue,
    }))
  );
}

/** The same launch-time setup ScytherExampleApp performs in its `init`. */
export function setUpExample() {
  Heracross.start();

  // Shaking an emulator is awkward, so Scizor's sample opens the menu from a
  // floating button instead.
  if (Platform.OS === 'android') {
    Heracross.setInvocationGesture(initialInvocationGesture);
  }

  ExampleDemo.seedDemoData();

  // ScytherExample puts these cookies in HTTPCookieStorage, which Scyther's
  // Cookie Browser lists, and the iOS demo module does the same. Scizor's lists
  // the cookies an app logs, as Scizor's own sample does.
  if (Platform.OS === 'android') {
    [
      { name: 'session_id', value: 'abc123def456', domain: 'example.com', path: '/', secure: true, expires: '7 days' },
      { name: 'user_prefs', value: 'theme=dark&lang=en', domain: 'example.com', path: '/', expires: '30 days' },
      { name: '_ga', value: 'GA1.2.1234567890.1234567890', domain: 'analytics.example.com', path: '/', expires: '1 year' },
      { name: 'auth_token', value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9', domain: 'api.example.com', path: '/api', secure: true, expires: '1 day' },
    ].forEach((cookie) => Heracross.cookies.log(cookie));
  }

  // ScytherExample sets no FCM token, deep link presets or developer options.
  // Scizor's sample sets all three.
  if (Platform.OS === 'android') {
    Heracross.setFcmToken(sampleFcmToken);
    Heracross.deepLinks.setPresets(sampleDeepLinkPresets);
    Heracross.setDeveloperOptions(sampleDeveloperOptions);
  }

  Heracross.setEnvironmentVariables({
    API_BASE_URL: 'https://api.example.com',
    APP_ENVIRONMENT: 'development',
    FEATURE_NEW_UI: 'enabled',
  });

  const servers = [
    {
      id: 'Development',
      variables: {
        API_URL: 'https://dev-api.example.com',
        WS_URL: 'wss://dev-ws.example.com',
        CDN_URL: 'https://dev-cdn.example.com',
        DEBUG: 'true',
        LOG_LEVEL: 'verbose',
      },
    },
    {
      id: 'Staging',
      variables: {
        API_URL: 'https://staging-api.example.com',
        WS_URL: 'wss://staging-ws.example.com',
        CDN_URL: 'https://staging-cdn.example.com',
        DEBUG: 'true',
        LOG_LEVEL: 'info',
      },
    },
    {
      id: 'Production',
      variables: {
        API_URL: 'https://api.example.com',
        WS_URL: 'wss://ws.example.com',
        CDN_URL: 'https://cdn.example.com',
        DEBUG: 'false',
        LOG_LEVEL: 'error',
      },
    },
  ];
  Heracross.servers.configure(
    servers.map((server) => ({
      ...server,
      // Scizor lists a base URL for each environment, as Scizor's sample sets
      // one. On iOS Heracross would store it as a `baseUrl` variable, so the
      // example leaves it out there to keep each environment's variables
      // exactly as ScytherExample registers them.
      baseUrl: Platform.OS === 'android' ? server.variables.API_URL : undefined,
    }))
  );

  registerFlags([
    ['dark_mode_v2', true],
    ['new_checkout_flow', false],
    ['enhanced_search', true],
    ['push_notifications', true],
    ['biometric_login', false],
    ['analytics_v3', true],
    ['experimental_ui', false],
    ['offline_mode', true],
  ]);
}

/** The Home tab's "Setup Sample Toggles" button. */
export function registerSampleToggles() {
  registerFlags([
    ['new_onboarding_flow', true],
    ['dark_mode_v2', false],
    ['experimental_feature', false],
    ['show_beta_badge', true],
    ['enable_analytics', true],
    ['use_new_api', false],
  ]);
}
