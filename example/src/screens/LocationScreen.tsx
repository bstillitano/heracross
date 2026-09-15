import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Heracross, { type LocationSpoofingState } from 'heracross';
import ExampleDemo, {
  type LocationFix,
} from '../native/NativeHeracrossExampleDemo';
import { toolkit } from '../toolkit';
import {
  ButtonRow,
  LabeledRow,
  ListScreen,
  Row,
  Section,
  TextRow,
} from '../ui/List';
import { useTheme } from '../ui/theme';

const MAP_HEIGHT = 250;
const MAP_ZOOM = 14;
const TILE_SIZE = 256;
const PIN_SIZE = 18;
/** Web Mercator's latitude limit; tiles don't exist beyond it. */
const MAX_LATITUDE = 85.0511;

/**
 * React Native has no map view, and the example avoids third-party native
 * libraries, so this stands in for SwiftUI's `Map`: OpenStreetMap tiles around
 * the fix, with a marker on it.
 */
function LocationMap({ location }: { location: LocationFix }) {
  const [width, setWidth] = useState(0);

  const scale = 2 ** MAP_ZOOM;
  const latitude = Math.max(
    -MAX_LATITUDE,
    Math.min(MAX_LATITUDE, location.latitude)
  );
  const latRad = (latitude * Math.PI) / 180;
  const x = ((location.longitude + 180) / 360) * scale;
  const y =
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
    scale;
  const tileX = Math.floor(x);
  const tileY = Math.floor(y);
  // Where the fix falls, in points, relative to the top-left of its tile.
  const offsetX = (x - tileX) * TILE_SIZE;
  const offsetY = (y - tileY) * TILE_SIZE;

  const tiles = [];
  for (let dx = -2; dx <= 2; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const row = tileY + dy;
      if (row < 0 || row >= scale) {
        continue;
      }
      const column = (((tileX + dx) % scale) + scale) % scale;
      tiles.push(
        <Image
          key={`${dx},${dy}`}
          source={{
            uri: `https://tile.openstreetmap.org/${MAP_ZOOM}/${column}/${row}.png`,
            headers: {
              'User-Agent':
                'HeracrossExample/0.1 (+https://github.com/bstillitano/heracross)',
            },
          }}
          style={{
            position: 'absolute',
            width: TILE_SIZE,
            height: TILE_SIZE,
            left: width / 2 - offsetX + dx * TILE_SIZE,
            top: MAP_HEIGHT / 2 - offsetY + dy * TILE_SIZE,
          }}
        />
      );
    }
  }

  return (
    <View
      style={styles.map}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      accessibilityLabel="Map showing the current location"
    >
      {width > 0 && tiles}
      <View style={[styles.pin, { left: width / 2 - PIN_SIZE / 2 }]} />
      <Text style={styles.attribution}>© OpenStreetMap contributors</Text>
    </View>
  );
}

const yesNo = (value: boolean) => (value ? 'Yes' : 'No');

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

export function LocationScreen({ active }: { active: boolean }) {
  const theme = useTheme();
  const [spoofing, setSpoofing] = useState<LocationSpoofingState | null>(null);
  const [authorization, setAuthorization] = useState<string | null>(null);
  const [location, setLocation] = useState<LocationFix | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Native events for as long as the screen is mounted. Root keeps every tab
  // mounted, so switching tabs doesn't stop continuous updates, just as leaving
  // LocationTestView doesn't; Stop Continuous Updates does, and so does
  // unmounting, such as on a reload.
  useEffect(() => {
    const subscriptions = [
      ExampleDemo.onLocationAuthorizationChange(setAuthorization),
      ExampleDemo.onLocationUpdate((fix) => {
        setLocation(fix);
        setError(null);
      }),
      ExampleDemo.onLocationError(setError),
    ];
    return () => {
      subscriptions.forEach((subscription) => subscription.remove());
      ExampleDemo.stopLocationUpdates();
    };
  }, []);

  // LocationTestView's onAppear: every time the tab appears, re-read the
  // authorization and, when authorized, ask for a fresh fix.
  useEffect(() => {
    if (!active) {
      return;
    }
    let current = true;
    ExampleDemo.getLocationAuthorization()
      .then((status) => {
        if (!current) {
          return;
        }
        setAuthorization(status);
        if (status === 'authorized') {
          ExampleDemo.requestLocation();
        }
      })
      .catch((reason) => setError(String(reason)));
    return () => {
      current = false;
    };
  }, [active]);

  // SwiftUI re-reads Scyther's spoofer state on every render; polling while the
  // tab is visible keeps it current after the spoofer changes in the menu.
  // Android has no spoofer state to read.
  useEffect(() => {
    if (!active || Platform.OS !== 'ios') {
      return;
    }
    const refresh = () =>
      Heracross.location
        .getSpoofingState()
        .then((next) =>
          setSpoofing((previous) =>
            sameSpoofing(previous, next) ? previous : next
          )
        )
        .catch(() => {});
    refresh();
    const timer = setInterval(refresh, 2000);
    return () => clearInterval(timer);
  }, [active]);

  const refreshLocation = () => {
    setError(null);
    ExampleDemo.requestLocation();
  };

  const startUpdates = () => {
    setError(null);
    ExampleDemo.startLocationUpdates();
  };

  return (
    <ListScreen title="Location Test">
      {Platform.OS === 'ios' ? (
        <Section
          header="Scyther Location Spoofer"
          footer="Configure spoofing in Scyther Menu → Location Spoofer"
        >
          <LabeledRow
            label="Spoofing Enabled"
            value={yesNo(spoofing?.enabled ?? false)}
            color={spoofing?.enabled ? theme.success : undefined}
          />
          <LabeledRow
            label="Swizzle Active"
            value={yesNo(spoofing?.swizzled ?? false)}
            color={spoofing?.swizzled ? theme.success : theme.destructive}
          />
          {spoofing?.enabled && (
            <LabeledRow label="Spoofed Location" value={spoofing.locationName} />
          )}
          {spoofing?.enabled && (
            <LabeledRow
              label="Spoofed Lat"
              value={spoofing.latitude.toFixed(6)}
            />
          )}
          {spoofing?.enabled && (
            <LabeledRow
              label="Spoofed Lon"
              value={spoofing.longitude.toFixed(6)}
            />
          )}
        </Section>
      ) : (
        <Section
          header="Scizor Location Spoofer"
          footer="Configure spoofing in Scizor → System Tools → Location Spoofer. Set this app as the device's mock-location app first."
        >
          <TextRow>
            The device location below reflects any active mock location.
          </TextRow>
        </Section>
      )}

      <Section header={toolkit.locationReportsSection}>
        {/* LocationTestView's `@unknown default`, which also covers the moment before the status arrives. */}
        {authorization !== 'notDetermined' &&
          authorization !== 'denied' &&
          authorization !== 'authorized' && (
            <TextRow>Unknown authorization status</TextRow>
          )}
        {authorization === 'notDetermined' && (
          <ButtonRow
            title="Request Location Permission"
            onPress={() => ExampleDemo.requestLocationPermission()}
          />
        )}
        {authorization === 'denied' && (
          <TextRow color={theme.destructive}>Location access denied</TextRow>
        )}
        {authorization === 'authorized' && location != null && (
          <LabeledRow label="Latitude" value={location.latitude.toFixed(6)} />
        )}
        {authorization === 'authorized' && location != null && (
          <LabeledRow label="Longitude" value={location.longitude.toFixed(6)} />
        )}
        {authorization === 'authorized' && location != null && (
          <LabeledRow
            label="Accuracy"
            value={`${location.accuracy.toFixed(1)} m`}
          />
        )}
        {authorization === 'authorized' && location != null && (
          <LabeledRow
            label="Altitude"
            value={`${location.altitude.toFixed(1)} m`}
          />
        )}
        {authorization === 'authorized' && location != null && (
          <LabeledRow
            label="Updated"
            value={new Date(location.timestamp).toLocaleTimeString()}
          />
        )}
        {authorization === 'authorized' && location != null && (
          <ButtonRow title="Refresh Location" onPress={refreshLocation} />
        )}
        {authorization === 'authorized' && location == null && (
          <Row>
            <Text style={[styles.text, { color: theme.label }]}>
              Fetching location...
            </Text>
            <ActivityIndicator />
          </Row>
        )}
        {error != null && (
          <TextRow color={theme.destructive} small>
            Error: {error}
          </TextRow>
        )}
      </Section>

      {location != null && (
        <Section header="Map">
          <LocationMap location={location} />
        </Section>
      )}

      <Section>
        <ButtonRow
          title={`Open ${toolkit.name} Menu`}
          onPress={() => Heracross.showMenu()}
        />
        <ButtonRow title="Start Continuous Updates" onPress={startUpdates} />
        <ButtonRow
          title="Stop Continuous Updates"
          destructive
          onPress={() => ExampleDemo.stopLocationUpdates()}
        />
      </Section>
    </ListScreen>
  );
}

const styles = StyleSheet.create({
  text: {
    flex: 1,
    fontSize: 17,
  },
  map: {
    height: MAP_HEIGHT,
    overflow: 'hidden',
    backgroundColor: '#E5E3DF',
  },
  pin: {
    position: 'absolute',
    top: MAP_HEIGHT / 2 - PIN_SIZE / 2,
    width: PIN_SIZE,
    height: PIN_SIZE,
    borderRadius: PIN_SIZE / 2,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    backgroundColor: '#FF3B30',
  },
  attribution: {
    position: 'absolute',
    right: 4,
    bottom: 2,
    fontSize: 9,
    color: '#333333',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    paddingHorizontal: 3,
  },
});
