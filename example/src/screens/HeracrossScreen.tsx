import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import {
  AppState,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Heracross, {
  type InvocationGesture,
  type LocationSpoofingState,
  type SelectedServer,
} from 'heracross';
import {
  initialInvocationGesture,
  sampleDeepLinkPresets,
  sampleDeveloperOptions,
  sampleFcmToken,
} from '../setup';
import { toolkit } from '../toolkit';
import {
  ButtonRow,
  CheckRow,
  LabeledRow,
  ListScreen,
  Row,
  Section,
  SwitchRow,
  TextRow,
  listStyles,
} from '../ui/List';
import { useTheme } from '../ui/theme';

type FlagState = Awaited<
  ReturnType<typeof Heracross.featureFlags.getAll>
>[number];

type LogEntry = { id: number; text: string };

/** How often the tab re-reads what changes without an event, while it's on show. */
const POLL_INTERVAL_MS = 2000;
const MAX_LOG_ENTRIES = 5;
const DEMO_FLAG = 'heracross_tab_demo';
const LOCAL_SERVER_ID = 'Local';
const SAMPLE_APNS_TOKEN = 'demo-apns-token-0123456789abcdef';
const SAMPLE_NOTIFICATION = {
  aps: {
    alert: {
      title: 'Order shipped',
      body: 'Your order #1042 is on its way.',
    },
    badge: 1,
    sound: 'default',
  },
  orderId: '1042',
};

/** Fixed for the platform, so it's read once. */
const supports = Heracross.supports;

const yesNo = (value: boolean) => (value ? 'Yes' : 'No');
const onOff = (value: boolean) => (value ? 'On' : 'Off');
const timeNow = () => new Date().toLocaleTimeString();

function describe(reason: unknown) {
  return reason instanceof Error ? reason.message : String(reason);
}

function sameSpoofing(
  a: LocationSpoofingState | null,
  b: LocationSpoofingState | null
) {
  return (
    a === b ||
    (a != null &&
      b != null &&
      a.enabled === b.enabled &&
      a.swizzled === b.swizzled &&
      a.locationName === b.locationName &&
      a.latitude === b.latitude &&
      a.longitude === b.longitude)
  );
}

/** A compact bordered button, for the per-flag override controls. */
function Chip({
  title,
  onPress,
  selected = false,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  selected?: boolean;
  disabled?: boolean;
}) {
  const theme = useTheme();
  const color = disabled ? theme.disabled : theme.tint;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        { borderColor: color },
        selected && { backgroundColor: color },
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.chipText, { color: selected ? theme.cell : color }]}>
        {title}
      </Text>
    </Pressable>
  );
}

/** One registered flag: its effective value, default and stored override, with controls for the override. */
function FlagRow({
  flag,
  onSetOverride,
  onClearOverride,
}: {
  flag: FlagState;
  onSetOverride: (key: string, value: boolean) => void;
  onClearOverride: (key: string) => void;
}) {
  const theme = useTheme();
  const details = [
    // iOS lists flags by key, so there the title is the key.
    flag.title !== flag.key ? flag.key : null,
    `default ${onOff(flag.defaultValue)}`,
    `override ${flag.override == null ? 'none' : onOff(flag.override)}`,
  ]
    .filter((detail) => detail != null)
    .join(' · ');
  return (
    <Row style={styles.stacked}>
      <View style={styles.line}>
        <Text style={[styles.body, styles.fill, { color: theme.label }]}>
          {flag.title}
        </Text>
        <Text
          style={[
            styles.body,
            { color: flag.enabled ? theme.success : theme.secondaryLabel },
          ]}
        >
          {onOff(flag.enabled)}
        </Text>
      </View>
      <Text style={[listStyles.caption, { color: theme.secondaryLabel }]}>
        {details}
      </Text>
      <View style={styles.chips}>
        <Chip
          title="Override On"
          selected={flag.override === true}
          onPress={() => onSetOverride(flag.key, true)}
        />
        <Chip
          title="Override Off"
          selected={flag.override === false}
          onPress={() => onSetOverride(flag.key, false)}
        />
        <Chip
          title="Clear"
          disabled={flag.override == null}
          onPress={() => onClearOverride(flag.key)}
        />
      </View>
    </Row>
  );
}

/**
 * The example's own tab, with no counterpart in ScytherExample: every Heracross
 * API, with what each read returns. The listeners below are the pattern to
 * copy: subscribe in `useEffect` and call `remove()` in its cleanup.
 */
export function HeracrossScreen({ active }: { active: boolean }) {
  const theme = useTheme();
  const [error, setError] = useState<string | null>(null);
  const [isStarted, setIsStarted] = useState<boolean | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean | null>(null);
  // Heracross has no getter for these two, so the tab remembers what it set.
  const [gesture, setGesture] = useState<InvocationGesture>(
    initialInvocationGesture
  );
  const [toolsHidden, setToolsHidden] = useState(false);
  const [overridesEnabled, setOverridesEnabled] = useState(false);
  const [flags, setFlags] = useState<FlagState[]>([]);
  const [flagLog, setFlagLog] = useState<LogEntry[]>([]);
  const [servers, setServers] = useState<SelectedServer[]>([]);
  const [selectedServer, setSelectedServer] = useState<SelectedServer | null>(
    null
  );
  const [serverLog, setServerLog] = useState<LogEntry[]>([]);
  const [environment, setEnvironment] = useState<Record<string, string>>({});
  const [spoofing, setSpoofing] = useState<LocationSpoofingState | null>(null);
  // Confirmation for calls that have nothing to read back, by section.
  const [notes, setNotes] = useState<Record<string, string>>({});
  const nextLogId = useRef(0);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const report = useCallback((reason: unknown) => {
    setError(describe(reason));
  }, []);

  const note = useCallback((section: string, text: string) => {
    setNotes((current) => ({ ...current, [section]: `${text} at ${timeNow()}` }));
  }, []);

  const appendLog = useCallback(
    (setLog: Dispatch<SetStateAction<LogEntry[]>>, text: string) => {
      const entry = { id: nextLogId.current++, text: `${timeNow()}  ${text}` };
      setLog((entries) => [entry, ...entries].slice(0, MAX_LOG_ENTRIES));
    },
    []
  );

  const refreshStatus = useCallback(() => {
    Promise.all([Heracross.isStarted(), Heracross.isMenuOpen()])
      .then(([started, menuOpen]) => {
        setIsStarted(started);
        setIsMenuOpen(menuOpen);
      })
      .catch(report);
  }, [report]);

  const refreshFlags = useCallback(() => {
    Promise.all([
      Heracross.featureFlags.getAll(),
      Heracross.featureFlags.getOverridesEnabled(),
    ])
      .then(([all, enabled]) => {
        setFlags(all);
        setOverridesEnabled(enabled);
      })
      .catch(report);
  }, [report]);

  const refreshServers = useCallback(() => {
    Promise.all([Heracross.servers.getAll(), Heracross.servers.getSelected()])
      .then(([all, selected]) => {
        setServers(all);
        setSelectedServer(selected);
      })
      .catch(report);
  }, [report]);

  const refreshEnvironment = useCallback(() => {
    Heracross.getEnvironmentVariables().then(setEnvironment).catch(report);
  }, [report]);

  const refreshSpoofing = useCallback(() => {
    if (!supports.locationSpoofingState) {
      return;
    }
    Heracross.location
      .getSpoofingState()
      .then((next) =>
        setSpoofing((previous) =>
          sameSpoofing(previous, next) ? previous : next
        )
      )
      .catch(report);
  }, [report]);

  const refreshAll = useCallback(() => {
    setError(null);
    refreshStatus();
    refreshFlags();
    refreshServers();
    refreshEnvironment();
    refreshSpoofing();
  }, [refreshStatus, refreshFlags, refreshServers, refreshEnvironment, refreshSpoofing]);

  // Subscribe for as long as the screen is mounted, and remove the
  // subscriptions in the cleanup so they don't outlive it.
  useEffect(() => {
    const flagSubscription = Heracross.featureFlags.addListener((change) => {
      appendLog(setFlagLog, `${change.key} → ${onOff(change.enabled)}`);
      refreshFlags();
    });
    const serverSubscription = Heracross.servers.addListener((server) => {
      appendLog(setServerLog, `Selected ${server.id}`);
      refreshServers();
    });
    return () => {
      flagSubscription.remove();
      serverSubscription.remove();
    };
  }, [appendLog, refreshFlags, refreshServers]);

  // Re-read everything each time the tab appears: the menu can change most of it.
  useEffect(() => {
    if (active) {
      refreshAll();
    }
  }, [active, refreshAll]);

  // While the tab is on show, poll what changes without an event, and re-read
  // everything when the app returns to the foreground. On Android the menu is
  // its own activity, so closing it brings the app back to `active`.
  useEffect(() => {
    if (!active) {
      return;
    }
    const timer = setInterval(() => {
      refreshStatus();
      refreshSpoofing();
    }, POLL_INTERVAL_MS);
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        refreshAll();
      }
    });
    return () => {
      clearInterval(timer);
      appState.remove();
    };
  }, [active, refreshAll, refreshSpoofing, refreshStatus]);

  useEffect(
    () => () => {
      if (hideTimer.current != null) {
        clearTimeout(hideTimer.current);
      }
    },
    []
  );

  const openMenuBriefly = () => {
    Heracross.showMenu();
    if (hideTimer.current != null) {
      clearTimeout(hideTimer.current);
    }
    hideTimer.current = setTimeout(() => {
      hideTimer.current = null;
      Heracross.hideMenu();
    }, 3000);
  };

  const chooseGesture = (next: InvocationGesture) => {
    Heracross.setInvocationGesture(next);
    setGesture(next);
  };

  const toggleOverrides = (enabled: boolean) => {
    Heracross.featureFlags.setOverridesEnabled(enabled);
    setOverridesEnabled(enabled);
    refreshFlags();
  };

  const setOverride = (key: string, value: boolean) => {
    Heracross.featureFlags.setOverride(key, value);
    refreshFlags();
  };

  const clearOverride = (key: string) => {
    Heracross.featureFlags.clearOverride(key);
    refreshFlags();
  };

  const resetOverrides = () => {
    Heracross.featureFlags.resetOverrides();
    refreshFlags();
  };

  const demoFlag = flags.find((flag) => flag.key === DEMO_FLAG);

  // Registering a flag again with a different default is a change when it
  // moves the effective value, so the Flag Changes log hears about it.
  const registerDemoFlag = () => {
    const defaultValue = !(demoFlag?.defaultValue ?? false);
    Heracross.featureFlags.register({
      key: DEMO_FLAG,
      title: 'Heracross tab demo',
      defaultValue,
    });
    Promise.all([
      Heracross.featureFlags.isEnabled(DEMO_FLAG),
      Heracross.featureFlags.getOverride(DEMO_FLAG),
    ])
      .then(([enabled, override]) => {
        appendLog(
          setFlagLog,
          `Registered ${DEMO_FLAG} with default ${onOff(defaultValue)}: isEnabled ${onOff(enabled)}, getOverride ${override == null ? 'null' : onOff(override)}`
        );
        refreshFlags();
      })
      .catch(report);
  };

  const selectServer = (id: string) => {
    Heracross.servers.select(id);
    refreshServers();
  };

  const hasLocalServer = servers.some((server) => server.id === LOCAL_SERVER_ID);

  // `configure` replaces the list on Android and adds or replaces by id on iOS,
  // so passing every environment gives the same result on both.
  const addLocalServer = () => {
    Heracross.servers
      .getAll()
      .then((current) => {
        Heracross.servers.configure([
          ...current.map(({ id, baseUrl, variables }) => ({
            id,
            baseUrl: baseUrl || undefined,
            variables,
          })),
          {
            id: LOCAL_SERVER_ID,
            baseUrl: 'http://localhost:3000',
            variables: { LOG_LEVEL: 'verbose' },
          },
        ]);
        refreshServers();
      })
      .catch(report);
  };

  const stampEnvironment = () => {
    Heracross.getEnvironmentVariables()
      .then((current) => {
        Heracross.setEnvironmentVariables({
          ...current,
          HERACROSS_TAB_UPDATED: new Date().toISOString(),
        });
        return Heracross.getEnvironmentVariables();
      })
      .then(setEnvironment)
      .catch(report);
  };

  const hideTools = (hidden: boolean) => {
    Heracross.setDisabledFeatures(hidden ? ['keystore', 'console'] : []);
    setToolsHidden(hidden);
  };

  const gestures: Array<{
    value: InvocationGesture;
    title: string;
    supported: boolean;
  }> = [
    { value: 'shake', title: 'Shake', supported: true },
    {
      value: 'floatingButton',
      title: 'Floating Button',
      supported: supports.floatingButton,
    },
    { value: 'none', title: 'None', supported: true },
  ];

  const gestureFooter = [
    'Heracross has no getter for the gesture, so this shows the last one set.',
    supports.floatingButton ? null : 'The floating button is Android only.',
    Platform.OS === 'ios' && __DEV__
      ? "In a debug build React Native's Dev Menu takes the shake."
      : null,
  ]
    .filter((line) => line != null)
    .join(' ');

  const logRows = (entries: LogEntry[], empty: string) =>
    entries.length === 0 ? (
      <TextRow color={theme.secondaryLabel} small>
        {empty}
      </TextRow>
    ) : (
      entries.map((entry) => (
        <TextRow key={entry.id} small>
          {entry.text}
        </TextRow>
      ))
    );

  const noteRow = (section: string) =>
    notes[section] != null && (
      <TextRow color={theme.secondaryLabel} small>
        {notes[section]}
      </TextRow>
    );

  return (
    <ListScreen title="Heracross">
      <Section
        header="Status"
        footer="isStarted and isMenuOpen are polled while this tab is on show."
      >
        {!Heracross.isAvailable && (
          <TextRow color={theme.destructive}>
            The Heracross native module isn't in this build, so every call does
            nothing.
          </TextRow>
        )}
        <LabeledRow label="isAvailable" value={yesNo(Heracross.isAvailable)} />
        <LabeledRow
          label="isStarted()"
          value={isStarted == null ? '…' : yesNo(isStarted)}
        />
        <LabeledRow
          label="isMenuOpen()"
          value={isMenuOpen == null ? '…' : yesNo(isMenuOpen)}
        />
        {error != null && (
          <TextRow color={theme.destructive} small>
            Error: {error}
          </TextRow>
        )}
        <ButtonRow title="Refresh" onPress={refreshAll} />
      </Section>

      <Section
        header="Supports"
        footer="Calls for a feature this platform doesn't support do nothing."
      >
        <LabeledRow label="floatingButton" value={yesNo(supports.floatingButton)} />
        <LabeledRow
          label="disabledFeatures"
          value={yesNo(supports.disabledFeatures)}
        />
        <LabeledRow label="cookies" value={yesNo(supports.cookies)} />
        <LabeledRow label="apnsToken" value={yesNo(supports.apnsToken)} />
        <LabeledRow
          label="notificationLog"
          value={yesNo(supports.notificationLog)}
        />
        <LabeledRow
          label="locationSpoofingState"
          value={yesNo(supports.locationSpoofingState)}
        />
      </Section>

      <Section header="Menu">
        <ButtonRow
          title={`Open ${toolkit.name} Menu`}
          onPress={() => Heracross.showMenu()}
        />
        <ButtonRow
          title="Open Menu, Close It After 3 Seconds"
          onPress={openMenuBriefly}
        />
      </Section>

      <Section header="Invocation Gesture" footer={gestureFooter}>
        {gestures.map((option) => (
          <CheckRow
            key={option.value}
            title={option.title}
            checked={gesture === option.value}
            disabled={!option.supported}
            onPress={() => chooseGesture(option.value)}
          />
        ))}
      </Section>

      <Section
        header="Feature Flags"
        footer="Override is the stored value, kept while overrides are off. Changes made here or in the menu's Feature Flags screen appear under Flag Changes."
      >
        <SwitchRow
          label="Enable Overrides"
          value={overridesEnabled}
          onValueChange={toggleOverrides}
        />
        {flags.map((flag) => (
          <FlagRow
            key={flag.key}
            flag={flag}
            onSetOverride={setOverride}
            onClearOverride={clearOverride}
          />
        ))}
        <ButtonRow
          title={
            demoFlag == null
              ? 'Register Demo Flag'
              : 'Register Demo Flag With Default Flipped'
          }
          onPress={registerDemoFlag}
        />
        <ButtonRow
          title="Reset All Overrides"
          destructive
          onPress={resetOverrides}
        />
      </Section>

      <Section header="Flag Changes">
        {logRows(flagLog, 'No changes yet')}
      </Section>

      <Section
        header="Servers"
        footer={
          Platform.OS === 'android'
            ? "Scizor reports a pick in the menu's Server Configuration screen when the menu closes."
            : "Scyther reports a pick in the menu's Server Configuration screen straight away."
        }
      >
        {servers.map((server) => (
          <CheckRow
            key={server.id}
            title={server.id}
            subtitle={server.baseUrl || undefined}
            checked={selectedServer?.id === server.id}
            onPress={() => selectServer(server.id)}
          />
        ))}
        {selectedServer != null &&
          Object.entries(selectedServer.variables)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => (
              <LabeledRow key={key} label={key} value={value} />
            ))}
        <ButtonRow
          title="Add Local Server"
          disabled={hasLocalServer}
          onPress={addLocalServer}
        />
      </Section>

      <Section header="Server Changes">
        {logRows(serverLog, 'No changes yet')}
      </Section>

      <Section
        header="Environment Variables"
        footer="Shown on the menu's Environment Variables screen."
      >
        {Object.entries(environment)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, value]) => (
            <LabeledRow key={key} label={key} value={value} />
          ))}
        <ButtonRow
          title="Add HERACROSS_TAB_UPDATED"
          onPress={stampEnvironment}
        />
      </Section>

      <Section
        header="Developer Options & Deep Links"
        footer="Neither can be read back. Developer options appear in the menu's Development Tools section, which only shows once it has rows; presets appear in the Deep Link Tester."
      >
        <ButtonRow
          title="Set Developer Options"
          onPress={() => {
            Heracross.setDeveloperOptions([
              ...sampleDeveloperOptions,
              { name: 'Set from', value: 'Heracross tab' },
            ]);
            note('developerOptions', 'Developer options set');
          }}
        />
        <ButtonRow
          title="Clear Developer Options"
          destructive
          onPress={() => {
            Heracross.setDeveloperOptions([]);
            note('developerOptions', 'Developer options cleared');
          }}
        />
        {noteRow('developerOptions')}
        <ButtonRow
          title="Set Deep Link Presets"
          onPress={() => {
            Heracross.deepLinks.setPresets(sampleDeepLinkPresets);
            note('deepLinks', 'Deep link presets set');
          }}
        />
        <ButtonRow
          title="Clear Deep Link Presets"
          destructive
          onPress={() => {
            Heracross.deepLinks.setPresets([]);
            note('deepLinks', 'Deep link presets cleared');
          }}
        />
        {noteRow('deepLinks')}
      </Section>

      <Section
        header="Notifications"
        footer={
          supports.notificationLog
            ? "Open the menu's Notification Logger to see it."
            : undefined
        }
      >
        {supports.notificationLog ? (
          <ButtonRow
            title="Log Sample Notification"
            onPress={() => {
              Heracross.notifications.log(SAMPLE_NOTIFICATION);
              note('notifications', 'Sample notification logged');
            }}
          />
        ) : (
          <TextRow color={theme.secondaryLabel} small>
            Scizor logs the device's notifications itself once notification
            access is granted, so there's nothing to log from JavaScript.
          </TextRow>
        )}
        {noteRow('notifications')}
      </Section>

      <Section
        header="Push Tokens"
        footer="Shown in the menu's Notifications section."
      >
        {supports.apnsToken && (
          <ButtonRow
            title="Set Sample APNs Token"
            onPress={() => {
              Heracross.setApnsToken(SAMPLE_APNS_TOKEN);
              note('tokens', 'APNs token set');
            }}
          />
        )}
        {supports.apnsToken && (
          <ButtonRow
            title="Clear APNs Token"
            destructive
            onPress={() => {
              Heracross.setApnsToken(null);
              note('tokens', 'APNs token cleared');
            }}
          />
        )}
        <ButtonRow
          title="Set Sample FCM Token"
          onPress={() => {
            Heracross.setFcmToken(sampleFcmToken);
            note('tokens', 'FCM token set');
          }}
        />
        <ButtonRow
          title="Clear FCM Token"
          destructive
          onPress={() => {
            Heracross.setFcmToken(null);
            note('tokens', 'FCM token cleared');
          }}
        />
        {!supports.apnsToken && (
          <TextRow color={theme.secondaryLabel} small>
            APNs tokens are iOS only.
          </TextRow>
        )}
        {noteRow('tokens')}
      </Section>

      <Section
        header="Cookies"
        footer={
          supports.cookies
            ? "Open the menu's Cookie Browser. This example has no WebView of its own, so there may be nothing to capture. Clearing removes every logged or captured cookie, including those logged at launch."
            : undefined
        }
      >
        {supports.cookies ? (
          [
            <ButtonRow
              key="log"
              title="Log Sample Cookie"
              onPress={() => {
                Heracross.cookies.log({
                  name: 'heracross_tab',
                  value: timeNow(),
                  domain: 'example.com',
                  path: '/',
                  secure: true,
                  httpOnly: true,
                  sameSite: 'Lax',
                  expires: '1 hour',
                });
                note('cookies', 'Sample cookie logged');
              }}
            />,
            <ButtonRow
              key="capture"
              title="Capture WebView Cookies for example.com"
              onPress={() => {
                Heracross.cookies.captureWebView('https://example.com');
                note('cookies', 'WebView cookies captured');
              }}
            />,
            <ButtonRow
              key="clear"
              title="Clear Logged Cookies"
              destructive
              onPress={() => {
                Heracross.cookies.clear();
                note('cookies', 'Logged cookies cleared');
              }}
            />,
          ]
        ) : (
          <TextRow color={theme.secondaryLabel} small>
            Scyther's Cookie Browser lists the shared HTTPCookieStorage, where
            React Native's networking already keeps its cookies.
          </TextRow>
        )}
        {noteRow('cookies')}
      </Section>

      <Section
        header="Hidden Tools"
        footer={
          supports.disabledFeatures
            ? 'Hides the Keystore Browser and Console Logger from the menu. setDisabledFeatures replaces the hidden list each time.'
            : undefined
        }
      >
        {supports.disabledFeatures ? (
          <SwitchRow
            label="Hide Keystore and Console"
            value={toolsHidden}
            onValueChange={hideTools}
          />
        ) : (
          <TextRow color={theme.secondaryLabel} small>
            Scyther can't hide its tools.
          </TextRow>
        )}
      </Section>

      <Section
        header="Location Spoofer"
        footer={
          supports.locationSpoofingState
            ? "Polled while this tab is on show. Configure it in the menu's Location Spoofer."
            : undefined
        }
      >
        {supports.locationSpoofingState ? (
          [
            <LabeledRow
              key="enabled"
              label="enabled"
              value={yesNo(spoofing?.enabled ?? false)}
            />,
            <LabeledRow
              key="swizzled"
              label="swizzled"
              value={yesNo(spoofing?.swizzled ?? false)}
            />,
            <LabeledRow
              key="name"
              label="locationName"
              value={spoofing?.locationName ?? ''}
            />,
            <LabeledRow
              key="latitude"
              label="latitude"
              value={spoofing?.latitude.toFixed(6) ?? ''}
            />,
            <LabeledRow
              key="longitude"
              label="longitude"
              value={spoofing?.longitude.toFixed(6) ?? ''}
            />,
          ]
        ) : (
          <TextRow color={theme.secondaryLabel} small>
            Scizor doesn't expose its spoofer, though a spoofed location still
            reaches LocationManager. The Location tab shows it.
          </TextRow>
        )}
      </Section>
    </ListScreen>
  );
}

const styles = StyleSheet.create({
  stacked: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 6,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fill: {
    flex: 1,
  },
  body: {
    fontSize: 17,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  // 44pt tall, so Scyther's accessibility audit only flags the Home tab's deliberate examples.
  chip: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 15,
    fontWeight: '500',
  },
  pressed: {
    opacity: 0.6,
  },
});
