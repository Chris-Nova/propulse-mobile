import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AsyncActionsState, AsyncActionTargets, EndAsyncAction } from '@/types';

const asyncAction = { pending: false, success: false, message: '' };
const pendingAsyncAction = { ...asyncAction, pending: true };

const initialState: AsyncActionsState = {
  createPaymentIntent: pendingAsyncAction,
  createSetupIntent: pendingAsyncAction,
  resendVerificationEmail: asyncAction,
  updateSubscriptionPlan: asyncAction,
  fetchSubscriptionQuota: asyncAction,
  fetchSubscriptionPlans: asyncAction,
  sendPasswordResetEmail: asyncAction,
  fetchTeamInvite: pendingAsyncAction,
  addTeamMemberToProject: asyncAction,
  fetchProjectDocuments: asyncAction,
  updateCompanyProfile: asyncAction,
  createCompanyProfile: asyncAction,
  fetchCompanyProfile: asyncAction,
  createSubscription: asyncAction,
  activateFreeTrial: asyncAction,
  fetchChats: pendingAsyncAction,
  updateUserProfile: asyncAction,
  sendInviteMessage: asyncAction,
  fetchSubscription: asyncAction,
  revokeTeamInvite: asyncAction,
  updateTeamInvite: asyncAction,
  fetchUserByEmail: asyncAction,
  fetchUserProfile: asyncAction,
  fetchTeamInvites: asyncAction,
  deleteTeamMember: asyncAction,
  acceptTeamInvite: asyncAction,
  fetchTeamMembers: asyncAction,
  updateTeamMember: asyncAction,
  resendTeamInvite: asyncAction,
  fetchTeamMember: asyncAction,
  sendTeamInvite: asyncAction,
  changePassword: asyncAction,
  fetchDocuments: asyncAction,
  fetchAnalytics: asyncAction,
  fetchMessages: asyncAction,
  updateProject: asyncAction,
  createProject: asyncAction,
  resetPassword: asyncAction,
  fetchProjects: asyncAction,
  deleteProject: asyncAction,
  deleteMessage: asyncAction,
  updateMessage: asyncAction,
  socialSignIn: asyncAction,
  fetchProject: asyncAction,
  sendMessage: asyncAction,
  verifyEmail: asyncAction,
  createChat: asyncAction,
  deleteChat: asyncAction,
  signIn: asyncAction,
  signUp: asyncAction,
};

const asyncActionsSlice = createSlice({
  name: 'asyncActions',
  initialState,
  reducers: {
    startAsyncAction: (state, action: PayloadAction<AsyncActionTargets>) => {
      const target = action.payload;
      state[target].success = false;
      state[target].pending = true;
      state[target].message = '';
    },
    endAsyncAction: (state, action: PayloadAction<EndAsyncAction>) => {
      const { target, ...rest } = action.payload;
      state[target] = {
        message: rest.message ?? '',
        success: rest.success,
        pending: false,
      };
    },
    resetActionState: (state, action: PayloadAction<AsyncActionTargets>) => {
      state[action.payload] = asyncAction;
    },
  },
});

export const { startAsyncAction, endAsyncAction, resetActionState } =
  asyncActionsSlice.actions;

export default asyncActionsSlice.reducer;
