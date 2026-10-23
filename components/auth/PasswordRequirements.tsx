import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AUTH_FONT, useAuthTheme } from '@/constants/authTheme';
import { validatePassword } from '@/utils/validators';

// Same five rules, in the same order, as the web sign-up form.
export const PasswordRequirements = ({ password = '' }: { password?: string }) => {
  const theme = useAuthTheme();
  const r = validatePassword(password);
  const unmet = theme.scheme === 'dark' ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)';

  const rules: [boolean, string][] = [
    [r.hasSpecialChar, 'At least one special character'],
    [r.isLengthValid, 'Minimum of 8 characters'],
    [r.hasUpperCase, 'At least one uppercase'],
    [r.hasLowerCase, 'At least one lowercase'],
    [r.hasNumber, 'At least a number'],
  ];

  return (
    <View style={styles.wrap}>
      {rules.map(([met, label]) => (
        <View key={label} style={styles.row}>
          <Ionicons
            name={met ? 'checkmark-circle' : 'ellipse-outline'}
            size={15}
            color={met ? '#10B981' : unmet}
          />
          <Text style={[styles.text, { color: met ? theme.body : unmet, fontFamily: AUTH_FONT }]}>
            {label}
          </Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { marginTop: -12, marginBottom: 22, gap: 5, paddingHorizontal: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  text: { fontSize: 12.5 },
});
