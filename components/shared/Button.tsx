import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { COLORS, SIZES } from '@/constants/theme';

interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const Button: React.FC<ButtonProps> = ({
  children,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
}) => {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? COLORS.primary : COLORS.white}
        />
      ) : (
        <Text style={[styles.text, styles[`text_${variant}`], styles[`textSize_${size}`], textStyle]}>
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: SIZES.radiusMd,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.5 },
  // Variants
  primary: { backgroundColor: COLORS.primary },
  secondary: { backgroundColor: COLORS.surfaceElevated },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: COLORS.error },
  // Sizes
  size_small: { paddingHorizontal: SIZES.md, paddingVertical: SIZES.xs + 2, minHeight: 36 },
  size_medium: { paddingHorizontal: SIZES.lg, paddingVertical: SIZES.sm + 2, minHeight: SIZES.buttonHeight },
  size_large: { paddingHorizontal: SIZES.xl, paddingVertical: SIZES.md, minHeight: 54 },
  // Text
  text: { fontWeight: '600' },
  text_primary: { color: COLORS.white },
  text_secondary: { color: COLORS.textPrimary },
  text_outline: { color: COLORS.primary },
  text_ghost: { color: COLORS.primary },
  text_danger: { color: COLORS.white },
  textSize_small: { fontSize: SIZES.small },
  textSize_medium: { fontSize: SIZES.body },
  textSize_large: { fontSize: SIZES.subtitle },
});

export default Button;
