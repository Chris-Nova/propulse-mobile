import { router } from 'expo-router';
import { AppDispatch, store } from '@/store';
import { Fetch } from '@/utils/api';
import { startAsyncAction, endAsyncAction } from '@/store/reducers/asyncActions';
import { showFeedback } from '@/store/reducers/feedback';
import { setSubscription, setPlans } from '@/store/reducers/account';

const finishAsyncAction = (payload: any) => (dispatch: AppDispatch) => {
  if (payload.feedbackType) {
    const type = payload.success ? 'success' : 'error';
    dispatch(showFeedback({ ...payload, type }));
  }
  dispatch(endAsyncAction(payload));
};

export const activateFreeTrial = () => async (dispatch: AppDispatch) => {
  dispatch(startAsyncAction('activateFreeTrial'));

  const { success, message, data } = await Fetch({
    path: '/payment/subscription',
    method: 'POST',
  });

  dispatch(finishAsyncAction({
    feedbackType: 'notification',
    target: 'activateFreeTrial',
    success,
    message,
  }) as any);

  if (success && data) {
    dispatch(setSubscription(data));
    router.replace('/(app)/dashboard');
  }

  return success;
};

export const createPaymentIntent = (planName: string, quantity = 1) => async (dispatch: AppDispatch) => {
  dispatch(startAsyncAction('createPaymentIntent'));

  const { success, message, data } = await Fetch({
    path: '/payment-intent',
    method: 'POST',
    body: { plan_name: planName, quantity },
  });

  dispatch(finishAsyncAction({ target: 'createPaymentIntent', success, message }) as any);

  return data;
};

export const createSetupIntent = () => async (dispatch: AppDispatch) => {
  dispatch(startAsyncAction('createSetupIntent'));

  const { success, message, data } = await Fetch({
    path: '/payment/setup',
    method: 'POST',
  });

  dispatch(finishAsyncAction({ target: 'createSetupIntent', success, message }) as any);

  return data;
};

export const createSubscription = (planName: string, paymentMethodId: string, quantity = 1) => async (dispatch: AppDispatch) => {
  dispatch(startAsyncAction('createSubscription'));

  const { success, message, data } = await Fetch({
    path: '/payment/subscription',
    method: 'POST',
    body: { plan_name: planName, payment_method: paymentMethodId, quantity },
  });

  dispatch(finishAsyncAction({
    feedbackType: 'notification',
    target: 'createSubscription',
    success,
    message,
  }) as any);

  if (success && data) {
    dispatch(setSubscription(data));
    router.replace('/(app)/account');
  }

  return success;
};

export const updateSubscriptionPlan = (planName: string) => async (dispatch: AppDispatch) => {
  dispatch(startAsyncAction('updateSubscriptionPlan'));

  const { success, message, data } = await Fetch({
    path: '/subscription',
    method: 'PATCH',
    body: { plan_name: planName },
  });

  dispatch(finishAsyncAction({
    feedbackType: 'notification',
    target: 'updateSubscriptionPlan',
    success,
    message,
  }) as any);

  if (success && data) dispatch(setSubscription(data));

  return success;
};

export const addPaymentMethod = (paymentMethodId: string) => async (dispatch: AppDispatch) => {
  const { success, message, data } = await Fetch({
    path: '/payment/setup',
    method: 'POST',
    body: { payment_method_id: paymentMethodId },
  });

  dispatch(finishAsyncAction({
    feedbackType: 'notification',
    target: 'updateSubscriptionPlan',
    success,
    message,
  }) as any);

  return success;
};

export const acceptTeamInvite = (inviteId: string) => async (dispatch: AppDispatch) => {
  dispatch(startAsyncAction('acceptTeamInvite'));

  const { success, message, data } = await Fetch({
    path: '/teams/accept-invite',
    method: 'POST',
  });

  dispatch(finishAsyncAction({
    feedbackType: 'notification',
    target: 'acceptTeamInvite',
    success,
    message,
  }) as any);

  return { success, data };
};

export const fetchTeamInvite = (inviteId: string) => async (dispatch: AppDispatch) => {
  dispatch(startAsyncAction('fetchTeamInvite'));

  const { success, message, data } = await Fetch({
    path: `/teams/invite/${inviteId}`,
    removeToken: true,
  });

  dispatch(finishAsyncAction({ target: 'fetchTeamInvite', success, message }) as any);

  return data;
};
