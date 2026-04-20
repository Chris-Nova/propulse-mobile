import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthState } from '@/types';

export const initialState: AuthState = {
  isSigningOut: false,
  invite: undefined,
  query: '',
  model: {
    is_terms_accepted: false,
    password: '',
    email: '',
    name: '',
    otp: '',
  },
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    updateAuthModel: (state, action: PayloadAction<Partial<AuthState['model']>>) => {
      state.model = { ...state.model, ...action.payload };
    },
    setInvite: (state, action: PayloadAction<AuthState['invite']>) => {
      state.model.email = action.payload?.email || state.model.email;
      state.invite = action.payload;
    },
    setQuery: (state, action: PayloadAction<string>) => {
      state.query = action.payload;
    },
    setIsSigningOut: (state, action: PayloadAction<boolean>) => {
      state.isSigningOut = action.payload;
    },
    resetAuthModel: (state) => {
      state.model = initialState.model;
    },
  },
});

export const {
  updateAuthModel,
  setIsSigningOut,
  resetAuthModel,
  setInvite,
  setQuery,
} = authSlice.actions;

export default authSlice.reducer;
