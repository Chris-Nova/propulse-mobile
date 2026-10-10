import React from 'react';
import {
  View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
import { AuthTheme, BRAND_PURPLE, useAuthTheme } from '@/constants/authTheme';
import { BottomGlow } from '@/components/splash/BottomGlow';

// The designs are drawn on a 393pt-wide frame. The corner shape is a circle of
// radius 280 centered at (0, 40); everything scales with screen width.
const DESIGN_WIDTH = 393;
const SHAPE_RADIUS = 280;
const SHAPE_CENTER_Y = 40;
const CONTENT_TOP = 285;

const TopShape = ({ theme, solid }: { theme: AuthTheme; solid?: boolean }) => {
  const { width } = useWindowDimensions();
  const scale = width / DESIGN_WIDTH;
  const r = SHAPE_RADIUS * scale;
  const cy = SHAPE_CENTER_Y * scale;
  const stops: [number, string][] = solid
    ? [[0, BRAND_PURPLE], [1, BRAND_PURPLE]]
    : theme.shapeStops;

  return (
    <Svg width={r + 2} height={cy + r + 2} style={styles.shape} pointerEvents="none">
      <Defs>
        <LinearGradient
          id="shape"
          gradientUnits="userSpaceOnUse"
          x1={0}
          y1={cy + r}
          x2={r}
          y2={0}
        >
          {stops.map(([offset, color]) => (
            <Stop key={`${offset}-${color}`} offset={offset} stopColor={color} />
          ))}
        </LinearGradient>
      </Defs>
      <Circle cx={0} cy={cy} r={r} fill="url(#shape)" />
    </Svg>
  );
};

interface AuthShellProps {
  children: React.ReactNode;
  // Dark Login uses a flat purple shape; the other designs use a gradient.
  solidShape?: boolean;
}

export const AuthShell = ({ children, solidShape }: AuthShellProps) => {
  const theme = useAuthTheme();
  const { width } = useWindowDimensions();
  const scale = width / DESIGN_WIDTH;

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <StatusBar style={theme.statusBar} />
      {theme.glow && <BottomGlow color={BRAND_PURPLE} opacity={0.22} />}
      <TopShape theme={theme} solid={solidShape && theme.scheme === 'dark'} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: CONTENT_TOP * scale }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  shape: { position: 'absolute', top: 0, left: 0 },
  content: { flexGrow: 1, paddingHorizontal: 22, paddingBottom: 48 },
});
