import { StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';

// Soft radial glow rising from the bottom-center edge (splash + dark auth screens).
export const BottomGlow = ({ color, opacity = 0.25 }: { color: string; opacity?: number }) => (
  <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
    <Defs>
      <RadialGradient id="glow" cx="50%" cy="100%" rx="85%" ry="42%" fx="50%" fy="100%">
        <Stop offset="0" stopColor={color} stopOpacity={opacity} />
        <Stop offset="0.3" stopColor={color} stopOpacity={opacity * 0.8} />
        <Stop offset="1" stopColor={color} stopOpacity={0} />
      </RadialGradient>
    </Defs>
    <Rect x="0" y="0" width="100%" height="100%" fill="url(#glow)" />
  </Svg>
);
