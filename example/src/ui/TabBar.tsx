import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from './SafeArea';
import { useTheme } from './theme';

export type TabKey = 'home' | 'location';

const tabs: Array<{ key: TabKey; label: string; icon: string }> = [
  { key: 'home', label: 'Home', icon: '⌂' },
  { key: 'location', label: 'Location', icon: '➤' },
];

/** The bottom tab bar SwiftUI's `TabView` draws. */
export function TabBar({
  selected,
  onSelect,
}: {
  selected: TabKey;
  onSelect: (tab: TabKey) => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.bar,
        {
          backgroundColor: theme.bar,
          borderTopColor: theme.separator,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      {tabs.map((tab) => {
        const active = tab.key === selected;
        const color = active ? theme.tint : theme.secondaryLabel;
        return (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={tab.label}
            onPress={() => onSelect(tab.key)}
            style={styles.tab}
          >
            <Text
              style={[
                styles.icon,
                tab.key === 'location' && styles.arrow,
                { color },
              ]}
            >
              {tab.icon}
            </Text>
            <Text style={[styles.label, { color }]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 6,
    paddingBottom: 4,
  },
  icon: {
    fontSize: 22,
    lineHeight: 26,
  },
  arrow: {
    transform: [{ rotate: '-45deg' }],
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
  },
});
