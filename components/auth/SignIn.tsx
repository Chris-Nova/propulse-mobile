import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateAuthModel } from '@/store/reducers/auth';
import { signIn } from '@/store/slices/auth';
import { COLORS } from '@/constants/theme';
import { AuthShell } from './AuthShell';
import {
  AuthTitle, AuthSubtitle, AuthLinkText, AuthInput, AuthButton,
} from './AuthControls';

const SignIn = () => {
  const dispatch = useAppDispatch();
  const { model } = useAppSelector((s) => s.auth);
  const { pending, success, message } = useAppSelector((s) => s.asyncActions.signIn);

  return (
    <AuthShell solidShape>
      <AuthTitle>Login</AuthTitle>
      <AuthSubtitle text="Don't have an account?">
        <Link href="/(auth)/sign-up" asChild>
          <TouchableOpacity>
            <AuthLinkText>Sign Up</AuthLinkText>
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

      <Link href="/(auth)/forgot-password" asChild>
        <TouchableOpacity style={styles.forgot}>
          <AuthLinkText small>Forgot Password?</AuthLinkText>
        </TouchableOpacity>
      </Link>

      {message && !pending ? (
        <View style={[styles.feedback, { backgroundColor: success ? COLORS.successLight : COLORS.errorLight }]}>
          <Text style={{ color: success ? COLORS.success : COLORS.error, fontSize: 13, fontWeight: '500' }}>
            {message}
          </Text>
        </View>
      ) : null}

      <AuthButton
        label="Login"
        loading={pending}
        disabled={!model.email || !model.password}
        onPress={() => dispatch(signIn() as any)}
      />
    </AuthShell>
  );
};

const styles = StyleSheet.create({
  forgot: { alignSelf: 'flex-start', marginTop: -10, marginBottom: 36 },
  feedback: { padding: 12, borderRadius: 10, marginBottom: 14 },
});

export default SignIn;
