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
  }

  return success;
};

export const signUp = () => async (dispatch: AppDispatch) => {
  const { model } = store.getState().auth;
  dispatch(startAsyncAction('signUp'));

  const { success, errors, code } = await Fetch({
    removeToken: true,
    path: '/users/register',
    method: 'POST',
    body: {
      password: model.password,
      email: model.email,
      name: `${(model as any).first_name ?? ''} ${(model as any).last_name ?? ''}`.trim(),
    },
  });

  const validationErrorMessage = capitalize(errors?.email?.[0] ?? '');
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
    router.replace('/(auth)/');
  }

  return success;
};

export const sendPasswordResetEmail = () => async (dispatch: AppDispatch) => {
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

  if (success) {
    router.replace('/(auth)/password-reset');
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
    router.replace('/(auth)/');
  }
};

export const signOut = () => async (dispatch: AppDispatch) => {
  await TokenStorage.clear();
  router.replace('/(auth)/');
};
