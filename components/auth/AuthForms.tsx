import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateAuthModel } from '@/store/reducers/auth';
import { signUp, verifyEmail, resendVerificationEmail, sendPasswordResetEmail, resetPassword } from '@/store/slices/auth';
import { Input, PasswordInput } from '@/components/shared/Input';
import Button from '@/components/shared/Button';
import { COLORS, SIZES } from '@/constants/theme';
import { AuthShell } from './AuthShell';
import { AuthSheetShell } from './AuthSheetShell';
import { OtpInput } from './OtpInput';
import { AUTH_FONT, useAuthTheme } from '@/constants/authTheme';
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
    <AuthSheetShell
      title="Forgot Password"
      intro="Enter the email that you used to sign up your account"
    >
      <AuthInput
        leftIcon="mail"
        placeholder="Email address"
        value={model.email as string}
        onChangeText={(v) => dispatch(updateAuthModel({ email: v }))}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />

      <AuthFeedback message={message} success={success} pending={pending} />

      <AuthButton
        label="Recover Password"
        loading={pending}
        disabled={!model.email}
        onPress={() => dispatch(sendPasswordResetEmail() as any)}
      />
    </AuthSheetShell>
  );
};

// ─── Verify Email ──────────────────────────────────────────
// Used twice: after sign-up (verifies the email) and during password recovery
// (?mode=reset), where the code is only collected here and sent along with the
// new password on the next screen.
export const VerifyEmail = () => {
  const dispatch = useAppDispatch();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isReset = mode === 'reset';
  const { model } = useAppSelector((s) => s.auth);
  const { pending, success, message } = useAppSelector((s) => s.asyncActions.verifyEmail);
  const { pending: resending } = useAppSelector((s) => s.asyncActions.resendVerificationEmail);
  const { pending: resendingReset } = useAppSelector((s) => s.asyncActions.sendPasswordResetEmail);
  const code = model.otp ?? '';

  // Start with an empty code every time this screen opens
  useEffect(() => {
    dispatch(updateAuthModel({ otp: '' }));
  }, [dispatch]);

  const onVerify = () => {
    if (isReset) {
      router.push('/(auth)/password-reset');
    } else {
      dispatch(verifyEmail() as any);
    }
  };

  const onResend = () => {
    if (isReset) {
      dispatch(sendPasswordResetEmail({ navigate: false }) as any);
    } else {
      dispatch(resendVerificationEmail() as any);
    }
  };

  return (
    <AuthSheetShell
      title="Email Verification"
      intro="Please enter the 6 digit code that was sent to your email address"
    >
      <OtpInput value={code} onChange={(v) => dispatch(updateAuthModel({ otp: v }))} />

      <AuthResendRow onResend={onResend} busy={isReset ? resendingReset : resending} />

      {!isReset && <AuthFeedback message={message} success={success} pending={pending} />}

      <AuthButton
        label="Verify and Proceed"
        loading={!isReset && pending}
        disabled={code.length < 6}
        onPress={onVerify}
      />
    </AuthSheetShell>
  );
};

const AuthResendRow = ({ onResend, busy }: { onResend: () => void; busy: boolean }) => {
  const theme = useAuthTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 26 }}>
      <Text style={{ color: theme.sheetText, fontSize: 15, fontFamily: AUTH_FONT }}>
        Did not receive code?{' '}
      </Text>
      <TouchableOpacity onPress={onResend} disabled={busy}>
        <Text style={{ color: theme.link, fontSize: 15, fontWeight: '700', opacity: busy ? 0.5 : 1, fontFamily: AUTH_FONT }}>
          {busy ? 'Sending…' : 'Resend'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// ─── Password Reset ────────────────────────────────────────
export const PasswordReset = () => {
  const dispatch = useAppDispatch();
  const { model } = useAppSelector((s) => s.auth);
  const { pending, success, message } = useAppSelector((s) => s.asyncActions.resetPassword);
  const confirm = (model as any).confirm_password ?? '';
  const mismatch = confirm.length > 0 && confirm !== model.password;

  return (
    <AuthSheetShell
      title="Reset Password"
      intro="Your new password must be different from previously used password"
    >
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
        onChangeText={(v) => dispatch(updateAuthModel({ confirm_password: v } as any))}
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
        label="Continue"
        loading={pending}
        disabled={!model.password || !confirm || mismatch}
        onPress={() => dispatch(resetPassword() as any)}
      />
    </AuthSheetShell>
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
