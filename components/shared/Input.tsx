import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '@/constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  rightElement?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  rightElement,
  style,
  ...props
}) => {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrapper, focused && styles.focused, !!error && styles.errorBorder]}>
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={COLORS.textMuted}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        {rightElement}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

export const PasswordInput: React.FC<InputProps> = (props) => {
  const [visible, setVisible] = useState(false);

  return (
    <Input
      {...props}
      secureTextEntry={!visible}
      rightElement={
        <TouchableOpacity onPress={() => setVisible(!visible)} style={styles.eyeBtn}>
          <Ionicons
            name={visible ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={COLORS.textMuted}
          />
        </TouchableOpacity>
      }
    />
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: SIZES.md },
  label: {
    color: COLORS.textSecondary,
    fontSize: SIZES.small,
    fontWeight: '500',
    marginBottom: SIZES.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    height: SIZES.inputHeight,
    paddingHorizontal: SIZES.md,
  },
  focused: { borderColor: COLORS.primary },
  errorBorder: { borderColor: COLORS.error },
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: SIZES.body,
  },
  eyeBtn: { padding: SIZES.xs },
  errorText: {
    color: COLORS.error,
    fontSize: SIZES.caption,
    marginTop: SIZES.xs,
  },
});

export default Input;
