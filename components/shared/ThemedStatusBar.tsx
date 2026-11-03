import React, { useCallback, useState } from 'react';
import { Dimensions, Platform, StatusBar as RNStatusBar, useWindowDimensions } from 'react-native';
import { StatusBar, StatusBarStyle } from 'expo-status-bar';
import { useFocusEffect } from 'expo-router';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Is the phone drawing its own opaque (black) bar above the app, instead of the app
// extending behind a transparent one? Dark icons are invisible on a black bar, so in that
// case icons must be light. Any one of these signals is enough:
//  1. the top safe-area inset reads 0
//  2. the app's window is shorter than the screen by at least the status bar's height
//  3. we are running inside Expo Go, where the status bar has been black on this device
const useOpaqueSystemBar = () => {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  if (Platform.OS !== 'android') return false;

  const barHeight = RNStatusBar.currentHeight ?? 24;
  const missingHeight = Dimensions.get('screen').height - windowHeight;
  const inExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

  return insets.top === 0 || missingHeight >= barHeight - 1 || inExpoGo;
};

// Status bar icons (time, battery...) for a screen. Only the focused screen controls them:
// tab screens stay mounted, so otherwise the last one to render would win.
export const ThemedStatusBar = ({ style }: { style: StatusBarStyle }) => {
  const opaque = useOpaqueSystemBar();
  const [focused, setFocused] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, [])
  );

  if (!focused) return null;
  return <StatusBar style={opaque ? 'light' : style} />;
};
