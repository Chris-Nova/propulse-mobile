import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateAuthModel } from '@/store/reducers/auth';
import { signIn } from '@/store/slices/auth';
import { Input, PasswordInput } from '@/components/shared/Input';
import Button from '@/components/shared/Button';
import { COLORS, SIZES } from '@/constants/theme';

const SignIn = () => {
  const dispatch = useAppDispatch();
  const { model } = useAppSelector((s) => s.auth);
  const { pending, success, message } = useAppSelector((s) => s.asyncActions.signIn);

  const handleSubmit = () => {
    dispatch(signIn() as any);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.heading}>Welcome back</Text>
        <Text style={styles.subheading}>Sign in to your Propulse account</Text>

        <View style={styles.form}>
          <Input
            label="Email Address"
            placeholder="johndoe@email.com"
            value={model.email as string}
            onChangeText={(v) => dispatch(updateAuthModel({ email: v }))}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <PasswordInput
            label="Password"
            placeholder="Your password"
            value={model.password}
            onChangeText={(v) => dispatch(updateAuthModel({ password: v }))}
          />

          <Link href="/(auth)/forgot-password" asChild>
            <TouchableOpacity style={styles.forgotLink}>
              <Text style={styles.forgotText}>Forgot your password?</Text>
            </TouchableOpacity>
          </Link>

          {message && !pending && (
            <View style={[styles.feedback, success ? styles.feedbackSuccess : styles.feedbackError]}>
              <Text style={[styles.feedbackText, { color: success ? COLORS.success : COLORS.error }]}>
                {message}
              </Text>
            </View>
          )}

          <Button
            onPress={handleSubmit}
            loading={pending}
            disabled={!model.email || !model.password}
            fullWidth
            size="large"
          >
            Login
          </Button>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <Link href="/(auth)/sign-up" asChild>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Sign up</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: SIZES.lg,
    justifyContent: 'center',
  },
  heading: {
    color: COLORS.textPrimary,
    fontSize: SIZES.display,
    fontWeight: '700',
    marginBottom: SIZES.xs,
  },
  subheading: {
    color: COLORS.textSecondary,
    fontSize: SIZES.body,
    marginBottom: SIZES.xl,
  },
  form: { gap: SIZES.xs },
  forgotLink: { alignSelf: 'flex-end', marginBottom: SIZES.md },
  forgotText: { color: COLORS.primary, fontSize: SIZES.small },
  feedback: {
    padding: SIZES.md,
    borderRadius: SIZES.radiusMd,
    marginBottom: SIZES.sm,
  },
  feedbackSuccess: { backgroundColor: COLORS.successLight },
  feedbackError: { backgroundColor: COLORS.errorLight },
  feedbackText: { fontSize: SIZES.small, fontWeight: '500' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SIZES.xl,
  },
  footerText: { color: COLORS.textSecondary, fontSize: SIZES.body },
  footerLink: { color: COLORS.primary, fontSize: SIZES.body, fontWeight: '600' },
});

export default SignIn;
