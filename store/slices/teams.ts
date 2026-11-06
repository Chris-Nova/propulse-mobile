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
  // GET /teams/members answers { members: [...], count } (the web app reads data.members)
  if (success) dispatch(setMembers(data?.members ?? (Array.isArray(data) ? data : (data?.results ?? []))));
};

export const fetchTeamInvites = () => async (dispatch: AppDispatch) => {
  dispatch(startAsyncAction('fetchTeamInvites'));
  const { success, message, data } = await Fetch({ path: '/teams/invites' });
  dispatch(finishAsyncAction({ target: 'fetchTeamInvites', success, message }) as any);
  // GET /teams/invites answers { invites: [...] }
  if (success) dispatch(setInvites(data?.invites ?? (Array.isArray(data) ? data : (data?.results ?? []))));
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
    method: 'PUT',
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

// First human-readable reason from a validation `errors` object (string or list of strings).
const firstReason = (errors: any, fallback: string): string => {
  const all: any[] = errors && typeof errors === 'object'
    ? Object.values(errors).reduce((acc: any[], v: any) => acc.concat(v), [])
    : [];
  return all.find((v) => typeof v === 'string' && v.length > 0) ?? fallback;
};

// GET /users/company-profile -> { id, company_name, company_username, industry, avatar }
export const fetchCompanyProfile = () => async () => {
  const { success, data } = await Fetch({ path: '/users/company-profile' });
  return success ? data : null;
};

// Edit Profile. The name goes to PUT /users/profile. Company name / industry go to
// PUT /users/company-profile, which the server only allows for the company's creator,
// so a refusal comes back as a normal message.
export const saveProfileDetails = (details: {
  profile?: { first_name: string; last_name: string };
  company?: { company_name: string; industry: string };
}) => async (dispatch: AppDispatch) => {
  dispatch(startAsyncAction('updateUserProfile'));
  let ok = true;
  let message = 'Profile updated successfully';

  if (details.profile) {
    const res = await Fetch({ path: '/users/profile', method: 'PUT', body: details.profile });
    if (res.success) {
      if (res.data) dispatch(setUser(res.data));
    } else {
      ok = false;
      message = firstReason(res.errors, res.message);
    }
  }

  if (ok && details.company) {
    const res = await Fetch({ path: '/users/company-profile', method: 'PUT', body: details.company });
    if (!res.success) {
      ok = false;
      const reason = firstReason(res.errors, res.message);
      message = details.profile ? `Your name was saved, but the company details weren't: ${reason}` : reason;
    }
  }

  dispatch(finishAsyncAction({
    feedbackType: 'notification',
    target: 'updateUserProfile',
    success: ok,
    message,
  }) as any);
  return ok;
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
  const { success, message, errors } = await Fetch({
    path: '/users/change-password',
    method: 'POST',
    // ChangePasswordSerializer (propulse-api) requires exactly these three fields.
    body: { old_password: currentPassword, new_password: newPassword, confirm_password: newPassword },
  });
  // Django's password validators (too common, too similar to your name/email, all digits)
  // answer with a generic "validation" message and the real reason inside `errors`.
  const reasons: any[] = errors ? Object.values(errors).reduce((all: any[], v: any) => all.concat(v), []) : [];
  const detail = !success ? reasons.find((v) => typeof v === 'string' && v.length > 0) : undefined;
  dispatch(finishAsyncAction({
    feedbackType: 'notification',
    target: 'changePassword',
    success,
    message: detail ?? message,
  }) as any);
  return success;
};
