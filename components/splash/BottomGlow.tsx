import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';

// Soft radial glow rising from the bottom-center edge (splash, welcome, auth and
// dashboard in dark mode). It measures its own container and draws in exact pixels:
// percentage-sized SVGs can end up shorter than the screen on Android, which showed
// up as a hard edge where the glow stopped.
export const BottomGlow = ({ color, opacity = 0.25 }: { color: string; opacity?: number }) => {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setSize((prev) => (prev && prev.w === width && prev.h === height ? prev : { w: width, h: height }));
      }}
    >
      {size && size.w > 0 && size.h > 0 && (
        <Svg width={size.w} height={size.h}>
          <Defs>
            <RadialGradient
              id="glow"
              gradientUnits="userSpaceOnUse"
              cx={size.w / 2}
              cy={size.h}
              fx={size.w / 2}
              fy={size.h}
              rx={size.w * 0.85}
              ry={size.h * 0.42}
            >
              <Stop offset="0" stopColor={color} stopOpacity={opacity} />
              <Stop offset="0.3" stopColor={color} stopOpacity={opacity * 0.8} />
              <Stop offset="1" stopColor={color} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect x={0} y={0} width={size.w} height={size.h} fill="url(#glow)" />
        </Svg>
      )}
    </View>
  );
};
