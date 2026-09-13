import { useState } from 'react';
import { StatusBar, StyleSheet, View, useColorScheme } from 'react-native';
import { HomeScreen } from './screens/HomeScreen';
import { LocationScreen } from './screens/LocationScreen';
import { SafeAreaProvider } from './ui/SafeArea';
import { TabBar, type TabKey } from './ui/TabBar';

/**
 * ScytherExample's `ContentView`: a Home tab and a Location tab. Both stay
 * mounted, as `TabView` keeps them, so the Home counters survive a tab switch.
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
        <HomeScreen />
      </View>
      <View style={[styles.fill, tab !== 'location' && styles.hidden]}>
        <LocationScreen />
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
