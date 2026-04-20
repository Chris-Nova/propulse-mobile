import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { COLORS, SIZES } from '@/constants/theme';

interface AvatarProps {
  name?: string;
  uri?: string;
  size?: number;
  style?: ViewStyle;
  color?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  name,
  uri,
  size = 40,
  style,
  color = COLORS.primaryDark,
}) => {
  const initials = name
    ? name
        .split(' ')
        .slice(0, 2)
        .map((w) => w.charAt(0).toUpperCase())
        .join('')
    : '?';

  const fontSize = size * 0.38;
  const borderRadius = size / 2;

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[{ width: size, height: size, borderRadius }, style]}
        contentFit="cover"
      />
    );
  }

  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius, backgroundColor: color },
        style,
      ]}
    >
      <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
  initials: { color: COLORS.white, fontWeight: '700' },
});

export default Avatar;
