import { Platform } from 'react-native';
import Heracross from 'heracross';
import ExampleDemo from './native/NativeHeracrossExampleDemo';

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
    Heracross.setInvocationGesture('floatingButton');
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
      // Scizor lists a base URL for each environment; Scyther has no such field.
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
