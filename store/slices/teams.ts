import { AppDispatch, store } from '@/store';
import { Fetch } from '@/utils/api';
import { startAsyncAction, endAsyncAction } from '@/store/reducers/asyncActions';
import { showFeedback } from '@/store/reducers/feedback';
import { setMembers, setMember, setInvites, setInvite, updateInviteModel, resetInviteModel } from '@/store/reducers/team';
import { setAnalytics } from '@/store/reducers/misc';
import { setUser, setSubscription, setPlans, setQuota } from '@/store/reducers/account';

const finishAsyncAction = (payload: any) => (dispatch: AppDispatch) => {
  if (payload.feedbackType) {
    const type = payload.success ? 'success' : 'error';
    dispatch(showFeedback({ ...payload, type }));
  }
  dispatch(endAsyncAction(payload));
};

// ─── Teams ────────────────────────────────────────────────
export const fetchTeamMembers = () => async (dispatch: AppDispatch) => {
  dispatch(startAsyncAction('fetchTeamMembers'));
  const { success, message, data } = await Fetch({ path: '/teams/members' });
  dispatch(finishAsyncAction({ target: 'fetchTeamMembers', success, message }) as any);
  if (success) dispatch(setMembers(Array.isArray(data) ? data : (data?.results ?? [])));
};

export const fetchTeamInvites = () => async (dispatch: AppDispatch) => {
  dispatch(startAsyncAction('fetchTeamInvites'));
  const { success, message, data } = await Fetch({ path: '/teams/invites' });
  dispatch(finishAsyncAction({ target: 'fetchTeamInvites', success, message }) as any);
  if (success) dispatch(setInvites(Array.isArray(data) ? data : (data?.results ?? [])));
};

export const sendTeamInvite = () => async (dispatch: AppDispatch) => {
  const { inviteModel } = store.getState().team;
  dispatch(startAsyncAction('sendTeamInvite'));

  const { success, message } = await Fetch({
    path: '/teams/send-invite',
    method: 'POST',
    body: inviteModel as any,
  });

  dispatch(finishAsyncAction({
    feedbackType: 'notification',
    target: 'sendTeamInvite',
    success,
    message,
  }) as any);

  if (success) {
    dispatch(resetInviteModel());
    await dispatch(fetchTeamInvites() as any);
  }

  return success;
};

export const deleteTeamMember = (memberId: string) => async (dispatch: AppDispatch) => {
  dispatch(startAsyncAction('deleteTeamMember'));
  const { success, message } = await Fetch({
    path: `/teams/members/${memberId}/delete`,
    method: 'DELETE',
  });
  dispatch(finishAsyncAction({
    feedbackType: 'notification',
    target: 'deleteTeamMember',
    success,
    message,
  }) as any);
  if (success) await dispatch(fetchTeamMembers() as any);
  return success;
};

export const revokeTeamInvite = (inviteId: string) => async (dispatch: AppDispatch) => {
  dispatch(startAsyncAction('revokeTeamInvite'));
  const { success, message } = await Fetch({
    path: `/teams/invite/${inviteId}/revoke`,
    method: 'POST',
  });
  dispatch(finishAsyncAction({
    feedbackType: 'notification',
    target: 'revokeTeamInvite',
    success,
    message,
  }) as any);
  if (success) await dispatch(fetchTeamInvites() as any);
};

// ─── Analytics ────────────────────────────────────────────
export const fetchAnalytics = () => async (dispatch: AppDispatch) => {
  dispatch(startAsyncAction('fetchAnalytics'));
  const { success, message, data } = await Fetch({ path: '/analytics/dashboard' });
  dispatch(finishAsyncAction({ target: 'fetchAnalytics', success, message }) as any);
  if (success && data) dispatch(setAnalytics(data));
};

// ─── Account / Profile ────────────────────────────────────
export const fetchUserProfile = () => async (dispatch: AppDispatch) => {
  dispatch(startAsyncAction('fetchUserProfile'));
  const { success, message, data } = await Fetch({ path: '/users/profile' });
  dispatch(finishAsyncAction({ target: 'fetchUserProfile', success, message }) as any);
  if (success && data) dispatch(setUser(data));
};

export const updateUserProfile = () => async (dispatch: AppDispatch) => {
  const { model } = store.getState().account;
  dispatch(startAsyncAction('updateUserProfile'));
  const { success, message, data } = await Fetch({
    path: '/users/profile',
    method: 'PATCH',
    body: model,
  });
  dispatch(finishAsyncAction({
    feedbackType: 'notification',
    target: 'updateUserProfile',
    success,
    message,
  }) as any);
  if (success && data) dispatch(setUser(data));
};

export const fetchSubscription = () => async (dispatch: AppDispatch) => {
  dispatch(startAsyncAction('fetchSubscription'));
  const { success, message, data } = await Fetch({ path: '/subscription' });
  dispatch(finishAsyncAction({ target: 'fetchSubscription', success, message }) as any);
  if (success && data) dispatch(setSubscription(data));
};

export const fetchSubscriptionPlans = () => async (dispatch: AppDispatch) => {
  dispatch(startAsyncAction('fetchSubscriptionPlans'));
  const { success, message, data } = await Fetch({ path: '/subscription/plans' });
  dispatch(finishAsyncAction({ target: 'fetchSubscriptionPlans', success, message }) as any);
  if (success && data) dispatch(setPlans(data));
};

export const fetchSubscriptionQuota = () => async (dispatch: AppDispatch) => {
  dispatch(startAsyncAction('fetchSubscriptionQuota'));
  const { success, message, data } = await Fetch({ path: '/subscription/quota' });
  dispatch(finishAsyncAction({ target: 'fetchSubscriptionQuota', success, message }) as any);
  if (success && data) dispatch(setQuota(data));
};

// ─── Individual Member / Invite ───────────────────────────

export const fetchTeamMember = (memberId: string) => async (dispatch: AppDispatch) => {
  dispatch(startAsyncAction('fetchTeamMember'));
  const { success, message, data } = await Fetch({ path: `/teams/members/${memberId}` });
  dispatch(finishAsyncAction({ target: 'fetchTeamMember', success, message }) as any);
  if (success && data) dispatch(setMember(data));
};

export const changePassword = (currentPassword: string, newPassword: string) => async (dispatch: AppDispatch) => {
  dispatch(startAsyncAction('changePassword'));
  const { success, message } = await Fetch({
    path: '/users/change-password',
    method: 'POST',
    body: { current_password: currentPassword, new_password: newPassword },
  });
  dispatch(finishAsyncAction({
    feedbackType: 'notification',
    target: 'changePassword',
    success,
    message,
  }) as any);
  return success;
};
