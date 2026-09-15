import { useState } from 'react';
import { StatusBar, StyleSheet, View, useColorScheme } from 'react-native';
import { HeracrossScreen } from './screens/HeracrossScreen';
import { HomeScreen } from './screens/HomeScreen';
import { LocationScreen } from './screens/LocationScreen';
import { SafeAreaProvider } from './ui/SafeArea';
import { TabBar, type TabKey } from './ui/TabBar';

/**
 * ScytherExample's `ContentView`: a Home tab and a Location tab, plus a
 * Heracross tab of the example's own that calls every Heracross API. All three
 * stay mounted, as `TabView` keeps its tabs, so the Home counters survive a tab
 * switch; `active` tells each screen when it's the one on show.
 */
export default function Root() {
  const [tab, setTab] = useState<TabKey>('home');
  const scheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'}
      />
      <View style={[styles.fill, tab !== 'home' && styles.hidden]}>
        <HomeScreen active={tab === 'home'} />
      </View>
      <View style={[styles.fill, tab !== 'location' && styles.hidden]}>
        <LocationScreen active={tab === 'location'} />
      </View>
      <View style={[styles.fill, tab !== 'heracross' && styles.hidden]}>
        <HeracrossScreen active={tab === 'heracross'} />
      </View>
      <TabBar selected={tab} onSelect={setTab} />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  hidden: {
    display: 'none',
  },
});
