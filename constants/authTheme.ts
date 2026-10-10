import { useColorScheme } from 'react-native';

export const BRAND_PURPLE = '#734BA9';

// There's no font file in the repo for the designs' typeface yet. Set this once
// the font is loaded (e.g. 'Urbanist_500Medium') and every auth screen picks it up.
export const AUTH_FONT: string | undefined = undefined;

export interface AuthTheme {
  scheme: 'light' | 'dark';
  background: string;
  glow: boolean;
  heading: string;
  body: string;
  link: string;
  inputBg: string;
  inputBorder: string;
  inputText: string;
  placeholder: string;
  inputIcon: string;
  button: string;
  buttonText: string;
  statusBar: 'light' | 'dark';
  // [offset, color] stops for the top-left shape, bottom-left -> top-right
  shapeStops: [number, string][];
}

const dark: AuthTheme = {
  scheme: 'dark',
  background: '#000000',
  glow: true,
  heading: '#FFFFFF',
  body: '#FFFFFF',
  link: BRAND_PURPLE,
  inputBg: '#FFFFFF',
  inputBorder: '#E6E6E6',
  inputText: '#111111',
  placeholder: '#2B2B2B',
  inputIcon: '#111111',
  button: BRAND_PURPLE,
  buttonText: '#FFFFFF',
  statusBar: 'light',
  shapeStops: [[0, '#222123'], [0.15, '#363338'], [0.85, BRAND_PURPLE], [1, BRAND_PURPLE]],
};

const light: AuthTheme = {
  scheme: 'light',
  background: '#FFFFFF',
  glow: false,
  heading: '#000000',
  body: '#000000',
  link: BRAND_PURPLE,
  inputBg: '#FFFFFF',
  inputBorder: '#DFDFDF',
  inputText: '#111111',
  placeholder: '#2B2B2B',
  inputIcon: '#111111',
  button: BRAND_PURPLE,
  buttonText: '#FFFFFF',
  statusBar: 'dark',
  shapeStops: [[0, '#F1EFF4'], [0.95, BRAND_PURPLE], [1, BRAND_PURPLE]],
};

export const useAuthTheme = (): AuthTheme => (useColorScheme() === 'dark' ? dark : light);
