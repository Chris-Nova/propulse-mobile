import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SettingsShell } from '@/components/settings/SettingsShell';
import { AppSwitch, Card, Gap, Row, useNotify, useSettingsTheme } from '@/components/settings/parts';

export const Security = () => {
  const { theme, iconColor } = useSettingsTheme();
  const notify = useNotify();

  return (
    <SettingsShell title="Security">
      <View style={styles.hero}>
        <View style={[styles.heroCircle, { backgroundColor: theme.palette.lavender.bg }]}>
          <Ionicons name="shield-checkmark" size={58} color={iconColor} />
        </View>
        <Text style={[styles.heroTitle, { color: theme.text }]}>Security Settings</Text>
        <Text style={[styles.heroSub, { color: theme.muted }]}>Keep your account safe and secure.</Text>
      </View>

      <Card>
        <Row
          big
          icon="lock-closed-outline"
          title="Change Password"
          subtitle="Update your password regularly"
          onPress={() => router.push('/(app)/account/change-password' as any)}
        />
      </Card>
      <Gap />
      {/* No 2FA endpoint on the backend yet: the switch stays off and says so */}
      <Card>
        <Row
          big
          icon="shield-checkmark-outline"
          title="Two-Factor Authentication"
          subtitle="Add an extra layer of security"
          right={
            <AppSwitch
              value={false}
              onValueChange={() => notify('Two-factor authentication is coming soon.')}
            />
          }
        />
      </Card>
      <Gap />
      <Card>
        <Row
          big
          icon="time-outline"
          title="Login Activity"
          subtitle="View recent login activity"
          onPress={() => notify('Login activity is coming soon.')}
        />
      </Card>
    </SettingsShell>
  );
};

const styles = StyleSheet.create({
  hero: { alignItems: 'center', marginBottom: 30 },
  heroCircle: { width: 132, height: 132, borderRadius: 66, alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontSize: 22, fontWeight: '700', marginTop: 26 },
  heroSub: { fontSize: 12.5, marginTop: 8 },
});
