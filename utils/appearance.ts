import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'propulse_color_scheme';
export type SchemePreference = 'light' | 'dark';

// Re-applies the person's saved Dark mode choice. Until they use the Dark mode switch,
// nothing is saved and the app simply follows the phone's light/dark setting.
export const restoreColorScheme = async () => {
  try {
    const saved = await AsyncStorage.getItem(KEY);
    if (saved === 'light' || saved === 'dark') Appearance.setColorScheme(saved);
  } catch {
    // storage unavailable: keep following the system setting
  }
};

// Overrides the system setting for the whole app (every useColorScheme() updates) and remembers it.
export const setColorSchemePreference = async (scheme: SchemePreference) => {
  Appearance.setColorScheme(scheme);
  try {
    await AsyncStorage.setItem(KEY, scheme);
  } catch {
    // the switch still works for this session even if saving fails
  }
};
