import { capitalize } from 'lodash';
import { router } from 'expo-router';

import { startAsyncAction, endAsyncAction } from '@/store/reducers/asyncActions';
import { showFeedback } from '@/store/reducers/feedback';
import { setUser } from '@/store/reducers/account';
import { TokenStorage, Storage } from '@/utils/storage';
import { AppDispatch, store } from '@/store';
import { Fetch } from '@/utils/api';
import { messages } from '@/libs/messages';

const getMessage = (resourceType: string, responseCode: string): string => {
  const resourceMessages = (messages as any)[resourceType] ?? {};
  return resourceMessages[responseCode] ?? resourceMessages['server_error'] ?? 'An error occurred';
};

const finishAsyncAction = (payload: any) => (dispatch: AppDispatch) => {
  if (payload.feedbackType) {
    const type = payload.success ? 'success' : 'error';
    dispatch(showFeedback({ ...payload, type }));
  }
  dispatch(endAsyncAction(payload));
};

// Stores the tokens + user from a successful login response and routes onward.
// Shared by email login and Google login (the backend returns the same payload).
const startSession = async (dispatch: AppDispatch, data: any) => {
  await TokenStorage.setToken(data.access_token);
  if (data.refresh_token) await TokenStorage.setRefreshToken(data.refresh_token);
  if (data.user) {
    await TokenStorage.setUser(data.user);
    dispatch(setUser(data.user));
  }
  if (data.user?.profile_completed) {
    router.replace('/(app)/dashboard');
  } else {
    router.replace('/company/setup');
  }
};

export const signIn = () => async (dispatch: AppDispatch) => {
  const { model } = store.getState().auth;
  dispatch(startAsyncAction('signIn'));

  const rawResponse = await Fetch({
    path: '/users/login',
    removeToken: true,
    method: 'POST',
    body: {
      email: model.email,
      password: model.password,
    },
  });

  console.log('LOGIN RESPONSE:', JSON.stringify(rawResponse));
  const { success, data, code } = rawResponse;
  const message = getMessage('signIn', code ?? (success ? 'login_successful' : 'server_error'));

  dispatch(finishAsyncAction({
    feedbackType: !success ? 'notification' : undefined,
    target: 'signIn',
    success,
    message,
  }) as any);

  if (success && data) {
    await startSession(dispatch, data);
  }

  return success;
};

export const signUp = () => async (dispatch: AppDispatch) => {
  const { model } = store.getState().auth;
  dispatch(startAsyncAction('signUp'));

  // POST /users/register requires `name` (first + last, each 2+ characters).
  const { success, errors, code } = await Fetch({
    removeToken: true,
    path: '/users/register',
    method: 'POST',
    body: {
      password: model.password,
      email: model.email,
      name: `${(model.first_name ?? '').trim()} ${(model.last_name ?? '').trim()}`.trim(),
    },
  });

  const validationErrorMessage = capitalize(
    errors?.name?.[0] ?? errors?.email?.[0] ?? errors?.password?.[0] ?? errors?.non_field_errors?.[0] ?? ''
  );
  const message = validationErrorMessage || getMessage('signUp', code ?? '');

  dispatch(finishAsyncAction({
    feedbackType: !success ? 'notification' : undefined,
    target: 'signUp',
    success,
    message,
  }) as any);

  if (success) {
    await Storage.set('signUpEmail', model.email);
    router.replace('/(auth)/verify-email');
  }

  return success;
};

export const resendVerificationEmail = () => async (dispatch: AppDispatch) => {
  const { model } = store.getState().auth;
  dispatch(startAsyncAction('resendVerificationEmail'));

  const { success, code } = await Fetch({
    path: '/users/resend-email-otp',
    body: { email: model.email },
    removeToken: true,
    method: 'POST',
  });

  const message = getMessage('resendVerificationEmail', code ?? '');

  dispatch(finishAsyncAction({
    feedbackType: 'notification',
    target: 'resendVerificationEmail',
    success,
    message,
  }) as any);
};

export const verifyEmail = () => async (dispatch: AppDispatch) => {
  const { model } = store.getState().auth;
  dispatch(startAsyncAction('verifyEmail'));

  const { success, code } = await Fetch({
    path: '/users/verify-email',
    removeToken: true,
    method: 'POST',
    body: { email: model.email, code: model.otp },
  });

  const message = getMessage('verifyEmail', code ?? '');

  dispatch(finishAsyncAction({
    feedbackType: 'notification',
    target: 'verifyEmail',
    success,
    message,
  }) as any);

  if (success) {
    router.replace('/(auth)');
  }

  return success;
};

export const sendPasswordResetEmail = (opts: { navigate?: boolean } = {}) => async (dispatch: AppDispatch) => {
  const { model } = store.getState().auth;
  dispatch(startAsyncAction('sendPasswordResetEmail'));

  const { success, code } = await Fetch({
    path: '/users/password-reset-request',
    body: { email: model.email },
    removeToken: true,
    method: 'POST',
  });

  const message = getMessage('sendPasswordResetEmail', code ?? '');

  dispatch(finishAsyncAction({
    feedbackType: 'notification',
    target: 'sendPasswordResetEmail',
    success,
    message,
  }) as any);

  if (success && opts.navigate !== false) {
    // Code entry comes first; the new password is collected on the next screen.
    router.push('/(auth)/verify-email?mode=reset');
  }
};

export const resetPassword = () => async (dispatch: AppDispatch) => {
  const { model } = store.getState().auth;
  dispatch(startAsyncAction('resetPassword'));

  const { success, code } = await Fetch({
    path: '/users/password-reset-confirm',
    removeToken: true,
    method: 'POST',
    body: {
      confirm_password: (model as any).confirm_password,
      new_password: model.password,
      email: model.email,
      code: model.otp,
    },
  });

  const message = getMessage('resetPassword', code ?? '');

  dispatch(finishAsyncAction({
    feedbackType: 'notification',
    target: 'resetPassword',
    success,
    message,
  }) as any);

  if (success) {
    router.replace('/(auth)');
  }
};

export const signOut = () => async (dispatch: AppDispatch) => {
  await TokenStorage.clear();
  router.replace('/(auth)/welcome');
};

// Google sign-in. The backend (POST /users/google-auth) verifies the Google ID token
// against ONE client ID (GOOGLE_OAUTH2_CLIENT_ID), so the app must request its token
// with that same *web* client ID as `webClientId`. Native Google sign-in needs a
// development/production build, it cannot run inside Expo Go, so the native module is
// loaded lazily and the button degrades to a clear message when it isn't available.
export const signInWithGoogle = () => async (dispatch: AppDispatch) => {
  const notify = (message: string, type: 'info' | 'error' = 'info') =>
    dispatch(showFeedback({ feedbackType: 'notification', type, message }));

  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  let GoogleSignin: any;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
  } catch {
    GoogleSignin = null;
  }

  if (!GoogleSignin || !webClientId) {
    notify('Google sign-in needs a development build with Google set up. Please use email for now.');
    return;
  }

  try {
    GoogleSignin.configure({ webClientId, scopes: ['email', 'profile'] });
    await GoogleSignin.hasPlayServices();
    const result = await GoogleSignin.signIn();
    const idToken = result?.data?.idToken ?? result?.idToken;
    if (!idToken) return; // user dismissed the Google sheet

    dispatch(startAsyncAction('signIn'));
    const { success, data, code } = await Fetch({
      path: '/users/google-auth',
      removeToken: true,
      method: 'POST',
      body: { id_token: idToken },
    });

    const message = getMessage('signIn', code ?? (success ? 'login_successful' : 'server_error'));
    dispatch(finishAsyncAction({
      feedbackType: !success ? 'notification' : undefined,
      target: 'signIn',
      success,
      message,
    }) as any);

    if (success && data) await startSession(dispatch, data);
  } catch (error: any) {
    // 12501 / SIGN_IN_CANCELLED = the person closed the Google sheet; not an error.
    if (error?.code === 'SIGN_IN_CANCELLED' || error?.code === '12501') return;
    notify('Google sign-in failed. Please try again or use email.', 'error');
  }
};
