import React, { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { DashboardTheme } from '@/constants/dashboardTheme';

// Initial on a tinted circle with the photo layered on top. If the photo is missing,
// isn't a full http(s) URL, or fails to load, the initial stays visible.
export const UserAvatar = ({
  uri, initial, theme, size = 32, fontSize = 15,
}: { uri?: string; initial: string; theme: DashboardTheme; size?: number; fontSize?: number }) => {
  const [failed, setFailed] = useState(false);
  const showPhoto = !!uri && /^https?:\/\//i.test(uri) && !failed;
  return (
    <View
      style={[
        styles.base,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: theme.avatarBg },
      ]}
    >
      <Text style={{ color: theme.avatarText, fontSize, fontWeight: '600' }}>{initial}</Text>
      {showPhoto && (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} onError={() => setFailed(true)} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
