import { Platform } from 'react-native';

/**
 * The copy that differs by platform: the toolkit's name and the paths to its
 * screens, which Scyther (iOS) and Scizor (Android) do not name identically.
 * iOS copy matches ScytherExample; Android copy matches Scizor's sample app.
 */
const ios = {
  name: 'Scyther',
  invocationHint: 'Shake device to open menu',
  defaultsSection: 'User Defaults Demo',
  graphQLFooter:
    'Calls https://graphqlzero.almansi.me. Open Scyther → Networking → Network Logs to see the operation name and type.',
  databaseFooter:
    'Open Scyther → Data → Database Browser to browse the demo SQLite database.',
  crashFooter:
    'This will crash the app. Reopen it to see the crash log in Scyther → System Tools → Crash Logs.',
  locationReportsSection: 'CLLocationManager Reports',
};

const android: typeof ios = {
  name: 'Scizor',
  invocationHint: 'Or tap the floating 🐞 button (shake also works on a device)',
  defaultsSection: 'Preferences Demo',
  graphQLFooter:
    'Calls graphqlzero.almansi.me. Open Scizor → Networking → Network Logger to see the operation name and type.',
  databaseFooter:
    'Open Scizor → Data → Database Browser to inspect the demo.db tables.',
  crashFooter:
    'This crashes the app. Reopen it to see the crash in Scizor → System Tools → Crash Logs.',
  locationReportsSection: 'Location Reports',
};

export const toolkit = Platform.OS === 'ios' ? ios : android;
