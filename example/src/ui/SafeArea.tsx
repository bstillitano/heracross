import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { View } from 'react-native';
import ExampleDemo, {
  type SafeAreaInsets,
} from '../native/NativeHeracrossExampleDemo';

const noInsets: SafeAreaInsets = { top: 0, bottom: 0, left: 0, right: 0 };

const InsetsContext = createContext<SafeAreaInsets>(noInsets);

/** Reads the window's insets on mount and again whenever the root lays out. */
export function SafeAreaProvider({ children }: { children: ReactNode }) {
  const [insets, setInsets] = useState(noInsets);

  const refresh = useCallback(() => {
    ExampleDemo.getSafeAreaInsets().then(setInsets);
  }, []);

  useEffect(refresh, [refresh]);

  return (
    <InsetsContext.Provider value={insets}>
      <View style={{ flex: 1 }} onLayout={refresh}>
        {children}
      </View>
    </InsetsContext.Provider>
  );
}

export function useSafeAreaInsets() {
  return useContext(InsetsContext);
}
