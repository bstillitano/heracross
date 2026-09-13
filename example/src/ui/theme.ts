import { useColorScheme } from 'react-native';

/** iOS system colours, so the example reads like the SwiftUI app it is ported from. */
const light = {
  background: '#F2F2F7',
  cell: '#FFFFFF',
  separator: '#C6C6C8',
  label: '#000000',
  secondaryLabel: '#8A8A8E',
  tint: '#007AFF',
  destructive: '#FF3B30',
  success: '#34C759',
  disabled: '#C7C7CC',
  bar: 'rgba(249, 249, 249, 0.96)',
};

const dark: typeof light = {
  background: '#000000',
  cell: '#1C1C1E',
  separator: '#38383A',
  label: '#FFFFFF',
  secondaryLabel: '#8D8D93',
  tint: '#0A84FF',
  destructive: '#FF453A',
  success: '#30D158',
  disabled: '#48484A',
  bar: 'rgba(22, 22, 22, 0.96)',
};

export type Theme = typeof light;

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light;
}
