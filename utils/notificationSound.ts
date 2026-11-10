import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { AppNotification } from '@/store/reducers/notifications';
import { Prefs, getPreferences } from '@/utils/preferences';

// The chime played when a NEW notification arrives while the app is open.
// (Replace assets/sounds/notification.wav to change the sound.)
const SOURCE = require('../assets/sounds/notification.wav');

let player: AudioPlayer | null = null;
let lastPlayed = 0;
const MIN_GAP_MS = 1500; // a burst of notifications gives one chime, not a machine gun

// Which of the Notification settings screen's switches covers this notification
export const alertAllowedByPrefs = (n: AppNotification, p: Prefs): boolean => {
  if (!p.notificationsEnabled || p.notifFrequency !== 'instant') return false;
  if (n.event_type === 'mentioned') return p.notifMentions;
  if (n.event_type === 'task.due_soon' || n.event_type === 'task.overdue') return p.notifReminders;
  if (n.category === 'messages') return p.notifMessages;
  if (n.category === 'projects') return p.notifProjectUpdates;
  return true; // invitations, billing, system: only the master switch applies
};

// A message notification for the chat you are looking at would just ding over the conversation
const isForOpenChat = (n: AppNotification, openChatId: string | null) => {
  if (!openChatId || n.category !== 'messages') return false;
  const m = n.metadata ?? {};
  return m.conversation_id === openChatId || (Array.isArray(m.conversation_ids) && m.conversation_ids.includes(openChatId));
};

export const playNotificationSound = async (n: AppNotification, openChatId: string | null = null) => {
  try {
    if (isForOpenChat(n, openChatId)) return;
    const prefs = await getPreferences();
    if (!alertAllowedByPrefs(n, prefs)) return;

    const now = Date.now();
    if (now - lastPlayed < MIN_GAP_MS) return;
    lastPlayed = now;

    if (!player) {
      // Respect the phone's silent / vibrate switch, and don't pause the person's music
      await setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' });
      player = createAudioPlayer(SOURCE);
    }
    await player.seekTo(0);
    player.play();
  } catch {
    // a missing sound must never break notification handling
  }
};
