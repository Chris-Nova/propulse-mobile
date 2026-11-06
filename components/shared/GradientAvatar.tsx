import React, { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

// Round avatar with the design's light-to-deep purple gradient and a white initial.
// A real photo, if there is one, is layered on top; otherwise the initial stays.
export const GradientAvatar = ({
  uri, initial, size = 54, fontSize = 22,
}: { uri?: string; initial: string; size?: number; fontSize?: number }) => {
  const [failed, setFailed] = useState(false);
  const showPhoto = !!uri && /^https?:\/\//i.test(uri) && !failed;
  return (
    <View
      style={{
        width: size, height: size, borderRadius: size / 2, overflow: 'hidden',
        alignItems: 'center', justifyContent: 'center',
      }}
    >
      <Svg style={StyleSheet.absoluteFill} width={size} height={size}>
        <Defs>
          <LinearGradient id="avatarGrad" x1="0" y1="1" x2="1" y2="0">
            <Stop offset="0" stopColor="#CDB9EA" />
            <Stop offset="1" stopColor="#7B52AE" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width={size} height={size} fill="url(#avatarGrad)" />
      </Svg>
      <Text style={{ color: '#FFFFFF', fontSize, fontWeight: '700' }}>{initial}</Text>
      {showPhoto && (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} onError={() => setFailed(true)} />
      )}
    </View>
  );
};
