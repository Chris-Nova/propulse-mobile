import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BRAND_PURPLE } from '@/constants/authTheme';
import { useSettingsTheme } from '@/components/settings/parts';

// Centered illustration + title + text + button, as in the empty / error designs.
const StateView = ({
  icon, title, message, actionLabel, onAction, circleColor,
}: {
  icon: React.ReactNode; title: string; message: string; actionLabel: string; onAction: () => void;
  circleColor?: string;
}) => {
  const { theme } = useSettingsTheme();
  return (
    <View style={styles.wrap}>
      <View style={[styles.circle, { backgroundColor: circleColor ?? theme.palette.lavender.bg }]}>{icon}</View>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.message, { color: theme.muted }]}>{message}</Text>
      <TouchableOpacity onPress={onAction} activeOpacity={0.85} style={styles.button} accessibilityRole="button">
        <Text style={styles.buttonText}>{actionLabel}</Text>
      </TouchableOpacity>
    </View>
  );
};

export const ConnectionError = ({
  onRetry, message = "We couldn't load your messages. Please check your internet connection and try again.",
}: { onRetry: () => void; message?: string }) => {
  const { iconColor } = useSettingsTheme();
  return (
    <StateView
      icon={<MaterialCommunityIcons name="wifi-off" size={66} color={iconColor} />}
      title="Connection Error"
      message={message}
      actionLabel="Try Again"
      onAction={onRetry}
    />
  );
};

// Messages list failed to load for a reason other than being offline (Messages_error.png)
export const LoadError = ({
  onRetry, message = "We couldn't load your conversations. Please try again.",
}: { onRetry: () => void; message?: string }) => {
  const { light } = useSettingsTheme();
  return (
    <StateView
      circleColor={light ? '#FCE7E4' : 'rgba(239,68,68,0.16)'}
      icon={<Ionicons name="alert-circle-outline" size={86} color={light ? '#E8352A' : '#FF7A70'} />}
      title="Something went wrong"
      message={message}
      actionLabel="Try Again"
      onAction={onRetry}
    />
  );
};

export const NoConversations = ({ onStart }: { onStart: () => void }) => {
  const { iconColor } = useSettingsTheme();
  return (
    <StateView
      icon={<Ionicons name="chatbubbles" size={66} color={iconColor} />}
      title="No conversations yet"
      message="Start a new chat or wait for a team member to message you."
      actionLabel="Start a New Chat"
      onAction={onStart}
    />
  );
};

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingTop: 72, paddingHorizontal: 28 },
  circle: { width: 134, height: 134, borderRadius: 67, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', marginTop: 30 },
  message: { fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 12, maxWidth: 270 },
  button: {
    minWidth: 200, height: 42, borderRadius: 10, backgroundColor: BRAND_PURPLE,
    alignItems: 'center', justifyContent: 'center', marginTop: 28, paddingHorizontal: 24,
  },
  buttonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
