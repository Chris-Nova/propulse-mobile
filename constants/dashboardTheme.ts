import { useColorScheme } from 'react-native';
import { BRAND_PURPLE } from '@/constants/authTheme';

export interface Tint { bg: string; icon: string }

export type StatusKey = 'pending' | 'incomplete' | 'completed' | 'on_hold';
export interface StatusStyle { bg: string; fg: string; label: string }

export interface DashboardTheme {
  scheme: 'light' | 'dark';
  statusBar: 'light' | 'dark';
  background: string;
  card: string;
  cardBorder: string;
  shadow: boolean;
  text: string;
  muted: string;
  divider: string;
  avatarBg: string;
  avatarText: string;
  // Solid background for pop-up sheets (card colors can be translucent in dark mode)
  sheet: string;
  // Dark mode shows the same purple bottom glow as the auth screens
  glow: boolean;
  tabBar: { background: string; border: string; inactive: string; active: string };
  // Lists, search and filter controls (Messages, Projects, Documents, Teams)
  field: string;
  fieldBorder: string;
  placeholder: string;
  pillText: string;
  accent: string;
  palette: { lavender: Tint; mint: Tint; blue: Tint; pink: Tint; amber: Tint };
  status: Record<StatusKey, StatusStyle>;
  tiles: { project: Tint; invite: Tint; messages: Tint; reports: Tint };
  activity: { purple: Tint; green: Tint; blue: Tint };
}

// Light = the supplied dashboard design. Dark follows the dark auth screens
// (black + purple glow) since no separate dark dashboard design exists.
const light: DashboardTheme = {
  scheme: 'light',
  statusBar: 'dark',
  background: '#FFFFFF',
  card: '#FFFFFF',
  cardBorder: '#EEEEEE',
  shadow: true,
  text: '#000000',
  muted: '#808080',
  divider: '#DFDFDF',
  avatarBg: '#E3D5F8',
  avatarText: '#5463FC',
  sheet: '#FFFFFF',
  glow: false,
  tabBar: { background: '#FFFFFF', border: '#EDEDED', inactive: '#808080', active: BRAND_PURPLE },
  field: '#EFF1FE',
  fieldBorder: '#E6E8FA',
  placeholder: '#94949C',
  pillText: '#8A8A99',
  accent: '#5463FC',
  palette: {
    lavender: { bg: '#E3D5F8', icon: '#5463FC' },
    mint: { bg: '#DDF6EC', icon: '#1BC282' },
    blue: { bg: '#CCD0FE', icon: '#5463FC' },
    pink: { bg: '#FDCED0', icon: '#E33629' },
    amber: { bg: '#FEF0CF', icon: '#E5A400' },
  },
  status: {
    pending: { bg: '#FEF5DE', fg: '#E5A400', label: 'Pending' },
    incomplete: { bg: '#EFF1FE', fg: '#5463FC', label: 'In Progress' },
    completed: { bg: '#D1F3E6', fg: '#1BA876', label: 'Completed' },
    on_hold: { bg: '#EDE3FA', fg: '#8B5CC4', label: 'On Hold' },
  },
  tiles: {
    project: { bg: '#EFF1FE', icon: '#5B6BD6' },
    invite: { bg: '#EAF4FD', icon: '#4C8FD8' },
    messages: { bg: '#E9FAF3', icon: '#1BC282' },
    reports: { bg: '#EEF2FC', icon: '#6B75A8' },
  },
  activity: {
    purple: { bg: '#E3D5F8', icon: BRAND_PURPLE },
    green: { bg: '#BBEDDA', icon: '#1BC282' },
    blue: { bg: '#CCD0FE', icon: '#5463FC' },
  },
};

const dark: DashboardTheme = {
  scheme: 'dark',
  statusBar: 'light',
  // Matches the dark auth screens: pure black with a purple glow at the bottom.
  background: '#000000',
  card: 'rgba(255,255,255,0.06)',
  cardBorder: 'rgba(255,255,255,0.12)',
  shadow: false,
  text: '#FFFFFF',
  muted: 'rgba(255,255,255,0.62)',
  divider: 'rgba(255,255,255,0.16)',
  avatarBg: 'rgba(115,75,169,0.40)',
  avatarText: '#D9C8F5',
  sheet: '#17131F',
  glow: true,
  // Lighter purple than the brand color so the small labels stay readable on black.
  tabBar: { background: '#000000', border: 'rgba(255,255,255,0.12)', inactive: '#8E8E93', active: '#A07FD6' },
  field: 'rgba(255,255,255,0.08)',
  fieldBorder: 'rgba(255,255,255,0.12)',
  placeholder: 'rgba(255,255,255,0.45)',
  pillText: 'rgba(255,255,255,0.6)',
  accent: '#8E99FF',
  palette: {
    lavender: { bg: 'rgba(115,75,169,0.35)', icon: '#D9C8F5' },
    mint: { bg: 'rgba(27,194,130,0.22)', icon: '#4DD9A3' },
    blue: { bg: 'rgba(84,99,252,0.28)', icon: '#A9B1FD' },
    pink: { bg: 'rgba(227,54,41,0.24)', icon: '#FF8A80' },
    amber: { bg: 'rgba(229,164,0,0.24)', icon: '#F5C24A' },
  },
  status: {
    pending: { bg: 'rgba(229,164,0,0.20)', fg: '#F5C24A', label: 'Pending' },
    incomplete: { bg: 'rgba(84,99,252,0.25)', fg: '#A9B1FD', label: 'In Progress' },
    completed: { bg: 'rgba(27,194,130,0.22)', fg: '#4DD9A3', label: 'Completed' },
    on_hold: { bg: 'rgba(139,92,196,0.30)', fg: '#D9C8F5', label: 'On Hold' },
  },
  tiles: {
    project: { bg: 'rgba(91,107,214,0.22)', icon: '#9AA5F2' },
    invite: { bg: 'rgba(76,143,216,0.22)', icon: '#7FB5EE' },
    messages: { bg: 'rgba(27,194,130,0.20)', icon: '#4DD9A3' },
    reports: { bg: 'rgba(107,117,168,0.26)', icon: '#A9B1DB' },
  },
  activity: {
    purple: { bg: 'rgba(115,75,169,0.35)', icon: '#D9C8F5' },
    green: { bg: 'rgba(27,194,130,0.24)', icon: '#4DD9A3' },
    blue: { bg: 'rgba(84,99,252,0.28)', icon: '#A9B1FD' },
  },
};

export const useDashboardTheme = (): DashboardTheme => (useColorScheme() === 'dark' ? dark : light);

// Chart colors are the same in both modes (taken from the design).
export const CHART = { complete: '#E33629', incomplete: '#F8BD00', legendComplete: '#F96166' };
