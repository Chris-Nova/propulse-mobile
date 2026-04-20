import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TeamState, TeamMember, TeamInvite, InviteModel } from '@/types';

const initialState: TeamState = {
  members: [],
  invites: [],
  inviteModel: { email: '' },
  member: undefined,
  invite: undefined,
};

const teamSlice = createSlice({
  name: 'team',
  initialState,
  reducers: {
    setMembers: (state, action: PayloadAction<TeamMember[]>) => {
      state.members = action.payload;
    },
    setMember: (state, action: PayloadAction<TeamMember | undefined>) => {
      state.member = action.payload;
    },
    setInvites: (state, action: PayloadAction<TeamInvite[]>) => {
      state.invites = action.payload;
    },
    setInvite: (state, action: PayloadAction<TeamInvite | undefined>) => {
      state.invite = action.payload;
    },
    updateInviteModel: (state, action: PayloadAction<Partial<InviteModel>>) => {
      state.inviteModel = { ...state.inviteModel, ...action.payload };
    },
    resetInviteModel: (state) => {
      state.inviteModel = initialState.inviteModel;
    },
  },
});

export const {
  setMembers,
  setMember,
  setInvites,
  setInvite,
  updateInviteModel,
  resetInviteModel,
} = teamSlice.actions;

export default teamSlice.reducer;
