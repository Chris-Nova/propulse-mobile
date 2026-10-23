import React, { useState } from 'react';
import {
  View, Text, TextInput, TextInputProps, TouchableOpacity, ActivityIndicator, StyleSheet,
  StyleProp, ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AUTH_FONT, useAuthTheme } from '@/constants/authTheme';

export const AuthTitle = ({ children }: { children: string }) => {
  const theme = useAuthTheme();
  return <Text style={[styles.title, { color: theme.heading, fontFamily: AUTH_FONT }]}>{children}</Text>;
};

// "Already have an account?  Sign In" style row
export const AuthSubtitle = ({ text, children }: { text: string; children: React.ReactNode }) => {
  const theme = useAuthTheme();
  return (
    <View style={styles.subtitleRow}>
      <Text style={[styles.subtitle, { color: theme.body, fontFamily: AUTH_FONT }]}>{text}</Text>
      {children}
    </View>
  );
};

export const AuthLinkText = ({ children, small }: { children: string; small?: boolean }) => {
  const theme = useAuthTheme();
  return (
    <Text
      style={{
        color: theme.link,
        fontWeight: '700',
        fontSize: small ? 12 : 15,
        fontFamily: AUTH_FONT,
      }}
    >
      {children}
    </Text>
  );
};

interface AuthInputProps extends TextInputProps {
  secure?: boolean; // adds the show/hide eye toggle
  leftIcon?: React.ComponentProps<typeof Ionicons>['name'];
  compact?: boolean; // half-width fields (first/last name) use tighter padding
  invalid?: boolean; // red border
  containerStyle?: StyleProp<ViewStyle>;
}

export const AuthInput = ({ secure, leftIcon, compact, invalid, containerStyle, style, ...rest }: AuthInputProps) => {
  const theme = useAuthTheme();
  const [hidden, setHidden] = useState(true);

  return (
    <View
      style={[
        styles.inputWrap,
        { backgroundColor: theme.inputBg, borderColor: theme.inputBorder },
        leftIcon ? { paddingLeft: 30 } : null,
        compact ? { paddingLeft: 16, paddingRight: 12 } : null,
        invalid ? { borderColor: '#EF4444' } : null,
        containerStyle,
      ]}
    >
      {leftIcon && (
        <Ionicons name={leftIcon} size={18} color={theme.inputIcon} style={{ marginRight: 22 }} />
      )}
      <TextInput
        {...rest}
        secureTextEntry={secure ? hidden : rest.secureTextEntry}
        placeholderTextColor={theme.placeholder}
        style={[styles.input, { color: theme.inputText, fontFamily: AUTH_FONT }, style]}
      />
      {secure && (
        <TouchableOpacity
          onPress={() => setHidden((h) => !h)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
        >
          <Ionicons name={hidden ? 'eye' : 'eye-off'} size={18} color={theme.inputIcon} />
        </TouchableOpacity>
      )}
    </View>
  );
};

export const AuthFieldError = ({ children }: { children?: string }) => {
  if (!children) return null;
  return (
    <Text style={{ color: '#EF4444', fontSize: 12.5, marginTop: -15, marginBottom: 14, fontFamily: AUTH_FONT }}>
      {children}
    </Text>
  );
};

export const AuthCheckbox = ({
  checked, onToggle, children,
}: { checked: boolean; onToggle: () => void; children: React.ReactNode }) => {
  const theme = useAuthTheme();
  return (
    <View style={styles.checkRow}>
      <TouchableOpacity
        onPress={onToggle}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        style={[styles.checkBox, { borderColor: theme.link }, checked && { backgroundColor: theme.link }]}
      >
        {checked && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
      </TouchableOpacity>
      <Text style={[styles.checkText, { color: theme.body, fontFamily: AUTH_FONT }]}>{children}</Text>
    </View>
  );
};

interface AuthButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export const AuthButton = ({ label, onPress, loading, disabled }: AuthButtonProps) => {
  const theme = useAuthTheme();
  const inactive = disabled || loading;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={inactive}
      activeOpacity={0.85}
      style={[styles.button, { backgroundColor: theme.button }, inactive && { opacity: 0.55 }]}
    >
      {loading ? (
        <ActivityIndicator color={theme.buttonText} />
      ) : (
        <Text style={[styles.buttonText, { color: theme.buttonText, fontFamily: AUTH_FONT }]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '700' },
  subtitleRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 14, marginBottom: 20 },
  subtitle: { fontSize: 15 },
  inputWrap: {
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 28,
    paddingRight: 18,
    marginBottom: 25,
  },
  input: { flex: 1, fontSize: 14, height: '100%', paddingVertical: 0 },
  button: {
    height: 45,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  buttonText: { fontSize: 16, fontWeight: '600' },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 22 },
  checkBox: {
    width: 20, height: 20, borderRadius: 5, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center', marginTop: 1,
  },
  checkText: { flex: 1, fontSize: 13, lineHeight: 19 },
});
