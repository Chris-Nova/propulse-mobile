import React, { useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { AUTH_FONT, BRAND_PURPLE, useAuthTheme } from '@/constants/authTheme';

interface Props {
  value: string;
  onChange: (value: string) => void;
  length?: number;
}

// Six display boxes driven by ONE hidden input, so paste, backspace and the
// OS "code from email/SMS" suggestion all behave like a normal text field.
export const OtpInput = ({ value, onChange, length = 6 }: Props) => {
  const theme = useAuthTheme();
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const activeIndex = Math.min(value.length, length - 1);

  return (
    <Pressable onPress={() => inputRef.current?.focus()} style={styles.row}>
      {Array.from({ length }).map((_, i) => {
        const isActive = focused && i === activeIndex;
        return (
          <View
            key={i}
            style={[
              styles.box,
              { backgroundColor: theme.otpBg },
              isActive && { borderColor: BRAND_PURPLE },
            ]}
          >
            <Text style={[styles.digit, { color: theme.otpText, fontFamily: AUTH_FONT }]}>
              {value[i] ?? ''}
            </Text>
          </View>
        );
      })}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(v) => onChange(v.replace(/\D/g, '').slice(0, length))}
        keyboardType="number-pad"
        maxLength={length}
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={styles.hidden}
        caretHidden
        accessibilityLabel={`${length} digit code`}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 40 },
  box: {
    width: 42,
    height: 42,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  digit: { fontSize: 17, fontWeight: '700' },
  hidden: { position: 'absolute', opacity: 0, width: 1, height: 1 },
});
