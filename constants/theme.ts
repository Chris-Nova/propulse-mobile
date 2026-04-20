import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const SCREEN = { width, height };

export const COLORS = {
  // Brand
  primary: '#3B82F6',
  primaryDark: '#1D4ED8',
  primaryLight: '#EFF6FF',
  // Backgrounds
  background: '#0A0F1E',
  surface: '#111827',
  surfaceElevated: '#1F2937',
  card: '#1A2236',
  // Text
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  // Status
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE',
  // Borders
  border: '#374151',
  borderLight: '#4B5563',
  // Misc
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0,0,0,0.6)',
  transparent: 'transparent',
  // Project status
  pending: '#F59E0B',
  incomplete: '#EF4444',
  completed: '#10B981',
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  semiBold: 'System',
  bold: 'System',
};

export const SIZES = {
  // Spacing
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  // Font sizes
  caption: 11,
  small: 13,
  body: 15,
  subtitle: 17,
  title: 20,
  heading: 24,
  display: 30,
  // Border radius
  radiusSm: 6,
  radiusMd: 10,
  radiusLg: 16,
  radiusFull: 999,
  // Icon sizes
  iconSm: 16,
  iconMd: 20,
  iconLg: 24,
  // Input / Button height
  inputHeight: 48,
  buttonHeight: 48,
  headerHeight: 60,
  tabBarHeight: 64,
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
};
