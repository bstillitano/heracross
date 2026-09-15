import { Children, Fragment, isValidElement, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from './SafeArea';
import { useTheme } from './theme';

/**
 * A scrolling screen with a large title, the React Native stand-in for a
 * SwiftUI `NavigationStack` holding an inset-grouped `List`.
 */
export function ListScreen({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{
        paddingTop: insets.top + 12,
        paddingBottom: 32,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
    >
      <Text
        accessibilityRole="header"
        style={[styles.largeTitle, { color: theme.label }]}
      >
        {title}
      </Text>
      {children}
    </ScrollView>
  );
}

/** One rounded group of rows, with an optional header above and footer below. */
export function Section({
  header,
  footer,
  children,
}: {
  header?: string;
  footer?: string;
  children: ReactNode;
}) {
  const theme = useTheme();
  const rows = Children.toArray(children).filter(isValidElement);
  return (
    <View style={styles.section}>
      {header != null && (
        <Text style={[styles.header, { color: theme.secondaryLabel }]}>
          {header}
        </Text>
      )}
      <View style={[styles.group, { backgroundColor: theme.cell }]}>
        {rows.map((row, index) => (
          <Fragment key={row.key ?? index}>
            {index > 0 && (
              <View
                style={[styles.separator, { backgroundColor: theme.separator }]}
              />
            )}
            {row}
          </Fragment>
        ))}
      </View>
      {footer != null && (
        <Text style={[styles.footer, { color: theme.secondaryLabel }]}>
          {footer}
        </Text>
      )}
    </View>
  );
}

/** A plain row container, for anything that is not a button or a label/value pair. */
export function Row({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.row, style]}>{children}</View>;
}

/** SwiftUI's `Button` in a `List`: tinted text, red when destructive, grey when disabled. */
export function ButtonRow({
  title,
  onPress,
  disabled = false,
  destructive = false,
  loading = false,
}: {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  destructive?: boolean;
  loading?: boolean;
}) {
  const theme = useTheme();
  const color = disabled
    ? theme.secondaryLabel
    : destructive
      ? theme.destructive
      : theme.tint;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        pressed && { backgroundColor: theme.separator },
      ]}
    >
      <Text style={[styles.text, styles.fill, { color }]}>{title}</Text>
      {loading && <ActivityIndicator />}
    </Pressable>
  );
}

/** SwiftUI's `LabeledContent`: a label on the left, its value on the right. */
export function LabeledRow({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  /** Applied to both label and value, as `.foregroundStyle` is in SwiftUI. */
  color?: string;
}) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <Text style={[styles.text, styles.fill, { color: color ?? theme.label }]}>
        {label}
      </Text>
      <Text
        style={[styles.text, styles.value, { color: color ?? theme.secondaryLabel }]}
      >
        {value}
      </Text>
    </View>
  );
}

/** A row of plain text. */
export function TextRow({
  children,
  color,
  small = false,
}: {
  children: ReactNode;
  color?: string;
  small?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <Text
        style={[
          small ? styles.caption : styles.text,
          styles.fill,
          { color: color ?? theme.label },
        ]}
      >
        {children}
      </Text>
    </View>
  );
}

/** One option of SwiftUI's inline `Picker`: a title, an optional subtitle, and a checkmark when chosen. */
export function CheckRow({
  title,
  subtitle,
  checked,
  onPress,
  disabled = false,
}: {
  title: string;
  subtitle?: string;
  checked: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        pressed && { backgroundColor: theme.separator },
      ]}
    >
      <View style={styles.fill}>
        <Text
          style={[
            styles.text,
            { color: disabled ? theme.secondaryLabel : theme.label },
          ]}
        >
          {title}
        </Text>
        {subtitle != null && (
          <Text style={[styles.caption, { color: theme.secondaryLabel }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {checked && (
        <Text style={[styles.text, styles.value, { color: theme.tint }]}>✓</Text>
      )}
    </Pressable>
  );
}

/** SwiftUI's `Toggle`: a label with a switch beside it. */
export function SwitchRow({
  label,
  value,
  onValueChange,
  disabled = false,
}: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <Text style={[styles.text, styles.fill, { color: theme.label }]}>
        {label}
      </Text>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
      />
    </View>
  );
}

export const listStyles = StyleSheet.create({
  caption: {
    fontSize: 12,
    lineHeight: 16,
  },
});

const styles = StyleSheet.create({
  largeTitle: {
    fontSize: 34,
    fontWeight: '700',
    marginHorizontal: 20,
    marginBottom: 12,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  header: {
    fontSize: 13,
    marginHorizontal: 16,
    marginBottom: 6,
  },
  group: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16,
  },
  footer: {
    fontSize: 13,
    lineHeight: 18,
    marginHorizontal: 16,
    marginTop: 6,
  },
  row: {
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fill: {
    flex: 1,
  },
  text: {
    fontSize: 17,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
  },
  value: {
    marginLeft: 12,
    textAlign: 'right',
  },
});
