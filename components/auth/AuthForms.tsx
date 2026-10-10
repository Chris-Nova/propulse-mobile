import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { Link } from 'expo-router';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateAuthModel } from '@/store/reducers/auth';
import { signUp, verifyEmail, resendVerificationEmail, sendPasswordResetEmail, resetPassword } from '@/store/slices/auth';
import { Input, PasswordInput } from '@/components/shared/Input';
import Button from '@/components/shared/Button';
import { COLORS, SIZES } from '@/constants/theme';
import { AuthShell } from './AuthShell';
import { AuthTitle, AuthSubtitle, AuthLinkText, AuthInput, AuthButton } from './AuthControls';

// ─── Shared ────────────────────────────────────────────────
const AuthFeedback = ({ message, success, pending }: { message: string; success: boolean; pending: boolean }) => {
  if (!message || pending) return null;
  return (
    <View style={[feedbackStyles.box, success ? feedbackStyles.success : feedbackStyles.error]}>
      <Text style={[feedbackStyles.text, { color: success ? COLORS.success : COLORS.error }]}>{message}</Text>
    </View>
  );
};

const feedbackStyles = StyleSheet.create({
  box: { padding: SIZES.md, borderRadius: SIZES.radiusMd, marginBottom: SIZES.sm },
  success: { backgroundColor: COLORS.successLight },
  error: { backgroundColor: COLORS.errorLight },
  text: { fontSize: SIZES.small, fontWeight: '500' },
});

// ─── Sign Up ───────────────────────────────────────────────
export const SignUp = () => {
  const dispatch = useAppDispatch();
  const { model } = useAppSelector((s) => s.auth);
  const { pending, success, message } = useAppSelector((s) => s.asyncActions.signUp);
  const [confirm, setConfirm] = useState('');
  const mismatch = confirm.length > 0 && confirm !== model.password;

  return (
    <AuthShell>
      <AuthTitle>Create Account</AuthTitle>
      <AuthSubtitle text="Already have an account?">
        <Link href="/(auth)" asChild>
          <TouchableOpacity>
            <AuthLinkText>Sign In</AuthLinkText>
          </TouchableOpacity>
        </Link>
      </AuthSubtitle>

      <AuthInput
        placeholder="Email address"
        value={model.email as string}
        onChangeText={(v) => dispatch(updateAuthModel({ email: v }))}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />
      <AuthInput
        secure
        placeholder="Password"
        value={model.password}
        onChangeText={(v) => dispatch(updateAuthModel({ password: v }))}
        autoCapitalize="none"
      />
      <AuthInput
        secure
        placeholder="Confirm Password"
        value={confirm}
        onChangeText={setConfirm}
        autoCapitalize="none"
      />

      {mismatch ? (
        <View style={[feedbackStyles.box, feedbackStyles.error]}>
          <Text style={[feedbackStyles.text, { color: COLORS.error }]}>Passwords don't match</Text>
        </View>
      ) : (
        <AuthFeedback message={message} success={success} pending={pending} />
      )}

      <AuthButton
        label="Sign Up"
        loading={pending}
        disabled={!model.email || !model.password || !confirm || mismatch}
        onPress={() => dispatch(signUp() as any)}
      />
    </AuthShell>
  );
};

// ─── Forgot Password ───────────────────────────────────────
export const ForgotPassword = () => {
  const dispatch = useAppDispatch();
  const { model } = useAppSelector((s) => s.auth);
  const { pending, success, message } = useAppSelector((s) => s.asyncActions.sendPasswordResetEmail);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>Forgot Password?</Text>
        <Text style={styles.subheading}>We'll send you a reset code by email</Text>

        <Input
          label="Email Address"
          placeholder="johndoe@email.com"
          value={model.email as string}
          onChangeText={(v) => dispatch(updateAuthModel({ email: v }))}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <AuthFeedback message={message} success={success} pending={pending} />

        <Button
          onPress={() => dispatch(sendPasswordResetEmail() as any)}
          loading={pending}
          disabled={!model.email}
          fullWidth size="large"
        >
          Send Reset Code
        </Button>

        <View style={styles.footer}>
          <Link href="/(auth)" asChild>
            <TouchableOpacity><Text style={styles.footerLink}>← Back to Sign in</Text></TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ─── Verify Email ──────────────────────────────────────────
export const VerifyEmail = () => {
  const dispatch = useAppDispatch();
  const { model } = useAppSelector((s) => s.auth);
  const { pending, success, message } = useAppSelector((s) => s.asyncActions.verifyEmail);
  const { pending: resending } = useAppSelector((s) => s.asyncActions.resendVerificationEmail);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>Verify Email</Text>
        <Text style={styles.subheading}>
          Enter the OTP code sent to {model.email || 'your email'}
        </Text>

        <Input
          label="OTP Code"
          placeholder="Enter 6-digit code"
          value={model.otp}
          onChangeText={(v) => dispatch(updateAuthModel({ otp: v }))}
          keyboardType="number-pad"
          maxLength={6}
        />

        <AuthFeedback message={message} success={success} pending={pending} />

        <Button
          onPress={() => dispatch(verifyEmail() as any)}
          loading={pending}
          disabled={!model.otp}
          fullWidth size="large"
        >
          Verify Email
        </Button>

        <Button
          onPress={() => dispatch(resendVerificationEmail() as any)}
          loading={resending}
          variant="ghost"
          fullWidth
          style={{ marginTop: SIZES.sm }}
        >
          Resend Code
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ─── Password Reset ────────────────────────────────────────
export const PasswordReset = () => {
  const dispatch = useAppDispatch();
  const { model } = useAppSelector((s) => s.auth);
  const { pending, success, message } = useAppSelector((s) => s.asyncActions.resetPassword);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>Reset Password</Text>
        <Text style={styles.subheading}>Enter your OTP and new password</Text>

        <Input
          label="OTP Code"
          placeholder="Enter 6-digit code"
          value={model.otp}
          onChangeText={(v) => dispatch(updateAuthModel({ otp: v }))}
          keyboardType="number-pad"
          maxLength={6}
        />
        <PasswordInput
          label="New Password"
          placeholder="Min. 8 characters"
          value={model.password}
          onChangeText={(v) => dispatch(updateAuthModel({ password: v }))}
        />
        <PasswordInput
          label="Confirm Password"
          placeholder="Repeat your password"
          value={(model as any).confirm_password ?? ''}
          onChangeText={(v) => dispatch(updateAuthModel({ confirm_password: v } as any))}
        />

        <AuthFeedback message={message} success={success} pending={pending} />

        <Button
          onPress={() => dispatch(resetPassword() as any)}
          loading={pending}
          fullWidth size="large"
        >
          Reset Password
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: SIZES.lg, justifyContent: 'center', gap: SIZES.xs },
  heading: { color: COLORS.textPrimary, fontSize: SIZES.display, fontWeight: '700', marginBottom: SIZES.xs },
  subheading: { color: COLORS.textSecondary, fontSize: SIZES.body, marginBottom: SIZES.xl },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: SIZES.xl },
  footerText: { color: COLORS.textSecondary, fontSize: SIZES.body },
  footerLink: { color: COLORS.primary, fontSize: SIZES.body, fontWeight: '600' },
});
