import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Linking,
  KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateAuthModel, setInvite } from '@/store/reducers/auth';
import { signUp, verifyEmail, resendVerificationEmail, sendPasswordResetEmail, resetPassword } from '@/store/slices/auth';
import { Input, PasswordInput } from '@/components/shared/Input';
import Button from '@/components/shared/Button';
import { COLORS, SIZES } from '@/constants/theme';
import { AuthShell } from './AuthShell';
import { AuthSheetShell } from './AuthSheetShell';
import { OtpInput } from './OtpInput';
import { AUTH_FONT, useAuthTheme } from '@/constants/authTheme';
import {
  AuthTitle, AuthSubtitle, AuthLinkText, AuthInput, AuthButton, AuthFieldError, AuthCheckbox,
} from './AuthControls';
import { PasswordRequirements } from './PasswordRequirements';
import { isValidName, isValidEmail, validatePassword } from '@/utils/validators';

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
// The web app links to /terms-of-service on its own domain; confirm this URL is live.
const TERMS_URL = 'https://getpropulse.app/terms-of-service';

export const SignUp = () => {
  const dispatch = useAppDispatch();
  const { invite, model } = useAppSelector((s) => s.auth);
  const { pending, success, message } = useAppSelector((s) => s.asyncActions.signUp);
  const params = useLocalSearchParams<{ invite_email?: string; invite_id?: string }>();
  const theme = useAuthTheme();
  const [confirm, setConfirm] = useState('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const touch = (key: string) => setTouched((t) => ({ ...t, [key]: true }));

  // Arriving from a team invite: the email is pre-filled and locked (same as web).
  useEffect(() => {
    if (params.invite_email && params.invite_id) {
      dispatch(setInvite({ email: String(params.invite_email), id: String(params.invite_id) }));
    }
  }, [dispatch, params.invite_email, params.invite_id]);

  const first = (model.first_name ?? '').trim();
  const last = (model.last_name ?? '').trim();
  const firstError = isValidName(first, 'Firstname');
  const lastError = isValidName(last, 'Lastname');
  const emailValid = isValidEmail(model.email ?? '');
  const passwordValid = validatePassword(model.password ?? '').isValid;
  const mismatch = confirm.length > 0 && confirm !== model.password;
  const nameError =
    (touched.first_name && firstError) || (touched.last_name && lastError) || '';

  const canSubmit =
    !firstError && !lastError && emailValid && passwordValid &&
    confirm === model.password && !!model.is_terms_accepted;

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

      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 25 }}>
        <AuthInput
          compact
          placeholder="First name"
          value={model.first_name ?? ''}
          onChangeText={(v) => dispatch(updateAuthModel({ first_name: v }))}
          onBlur={() => touch('first_name')}
          invalid={!!touched.first_name && !!firstError}
          containerStyle={{ flex: 1, marginBottom: 0 }}
          autoCapitalize="words"
          autoComplete="given-name"
        />
        <AuthInput
          compact
          placeholder="Last name"
          value={model.last_name ?? ''}
          onChangeText={(v) => dispatch(updateAuthModel({ last_name: v }))}
          onBlur={() => touch('last_name')}
          invalid={!!touched.last_name && !!lastError}
          containerStyle={{ flex: 1, marginBottom: 0 }}
          autoCapitalize="words"
          autoComplete="family-name"
        />
      </View>
      <AuthFieldError>{nameError}</AuthFieldError>

      <AuthInput
        placeholder="Email address"
        value={model.email as string}
        onChangeText={(v) => dispatch(updateAuthModel({ email: v }))}
        onBlur={() => touch('email')}
        invalid={!!touched.email && !emailValid}
        editable={!invite}
        containerStyle={invite ? { opacity: 0.6 } : undefined}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />
      <AuthFieldError>{touched.email && !emailValid ? 'Invalid email' : ''}</AuthFieldError>

      <AuthInput
        secure
        placeholder="Password"
        value={model.password}
        onChangeText={(v) => dispatch(updateAuthModel({ password: v }))}
        autoCapitalize="none"
      />
      <PasswordRequirements password={model.password} />

      <AuthInput
        secure
        placeholder="Confirm Password"
        value={confirm}
        onChangeText={setConfirm}
        invalid={mismatch}
        autoCapitalize="none"
      />
      <AuthFieldError>{mismatch ? "Passwords don't match" : ''}</AuthFieldError>

      <AuthCheckbox
        checked={!!model.is_terms_accepted}
        onToggle={() => dispatch(updateAuthModel({ is_terms_accepted: !model.is_terms_accepted }))}
      >
        Almost there! Please agree to the{' '}
        <Text
          style={{ color: theme.link, fontWeight: '700' }}
          onPress={() => Linking.openURL(TERMS_URL)}
        >
          Terms &amp; Conditions
        </Text>{' '}
        to create your account.
      </AuthCheckbox>

      <AuthFeedback message={message} success={success} pending={pending} />

      <AuthButton
        label="Sign Up"
        loading={pending}
        disabled={!canSubmit}
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
