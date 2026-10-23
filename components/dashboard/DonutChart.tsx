import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { CHART } from '@/constants/dashboardTheme';

interface Props {
  completePct: number; // 0-100
  size?: number;
  textColor: string;
}

// Ring split into Complete (red) and Incomplete (yellow), starting at 12 o'clock.
export const DonutChart = ({ completePct, size = 80, textColor }: Props) => {
  const stroke = 11;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, completePct));
  const completeLen = (pct / 100) * c;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={CHART.incomplete} strokeWidth={stroke} fill="none" />
        {pct > 0 && (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={CHART.complete}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={`${completeLen} ${c - completeLen}`}
          />
        )}
      </Svg>
      <Text style={{ position: 'absolute', fontSize: 11, fontWeight: '700', color: textColor }}>
        {pct}%
      </Text>
    </View>
  );
};
