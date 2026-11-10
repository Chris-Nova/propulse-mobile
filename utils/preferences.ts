import { useCallback, useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Settings choices that the backend has no endpoints for yet (notification toggles,
// language, time zone, default view...). They are remembered on THIS device only.
// Dark mode is separate: see utils/appearance.ts.

const KEY = 'propulse_preferences';

export type NotifFrequency = 'instant' | 'hourly' | 'daily';
export type DefaultView = 'dashboard' | 'projects' | 'teams' | 'messages';

export interface Prefs {
  notificationsEnabled: boolean;
  notifProjectUpdates: boolean;
  notifMentions: boolean;
  notifMessages: boolean;
  notifReminders: boolean;
  notifProductUpdates: boolean;
  notifFrequency: NotifFrequency;
  language: 'en';
  timezone: string; // IANA name, or '' to follow the phone
  defaultView: DefaultView;
  itemsPerPage: 10 | 20 | 50;
  dataUsage: boolean;
}

export const DEFAULT_PREFS: Prefs = {
  notificationsEnabled: true,
  notifProjectUpdates: true,
  notifMentions: true,
  notifMessages: true,
  notifReminders: true,
  notifProductUpdates: false,
  notifFrequency: 'instant',
  language: 'en',
  timezone: '',
  defaultView: 'dashboard',
  itemsPerPage: 10,
  dataUsage: true,
};

let cache: Prefs = DEFAULT_PREFS;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

let loadPromise: Promise<void> | null = null;
const ensureLoaded = (): Promise<void> => {
  if (!loadPromise) {
    loadPromise = (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (raw) {
          cache = { ...DEFAULT_PREFS, ...JSON.parse(raw) };
          emit();
        }
      } catch {
        // storage unavailable: keep the defaults for this session
      }
    })();
  }
  return loadPromise;
};

// For code outside React (e.g. the socket handler): the saved choices, once they have loaded.
export const getPreferences = async (): Promise<Prefs> => {
  await ensureLoaded();
  return cache;
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  ensureLoaded();
  return () => {
    listeners.delete(listener);
  };
};
const getSnapshot = () => cache;

export const usePreferences = () => {
  const prefs = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const setPref = useCallback(<K extends keyof Prefs>(key: K, value: Prefs[K]) => {
    cache = { ...cache, [key]: value };
    emit();
    AsyncStorage.setItem(KEY, JSON.stringify(cache)).catch(() => {});
  }, []);
  return [prefs, setPref] as const;
};

// ─── Time zones (zones without daylight saving, so the offsets in the labels stay true) ───
export const TIMEZONES: { value: string; label: string }[] = [
  { value: 'Africa/Lagos', label: '(GMT+1) WAT' },
  { value: 'Africa/Accra', label: '(GMT+0) GMT' },
  { value: 'Africa/Nairobi', label: '(GMT+3) EAT' },
  { value: 'Africa/Johannesburg', label: '(GMT+2) SAST' },
  { value: 'Asia/Dubai', label: '(GMT+4) GST' },
  { value: 'Asia/Kolkata', label: '(GMT+5:30) IST' },
  { value: 'Asia/Singapore', label: '(GMT+8) SGT' },
  { value: 'UTC', label: '(GMT+0) UTC' },
];

export const deviceTimeZone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  } catch {
    return '';
  }
};

export const timeZoneLabel = (iana: string): string => {
  const zone = iana || deviceTimeZone();
  if (!zone) return 'Device default';
  return TIMEZONES.find((t) => t.value === zone)?.label ?? zone.replace(/_/g, ' ');
};
