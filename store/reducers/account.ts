import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AccountState, Subscription, Plan, PlanQuota } from '@/types';

const initialState: AccountState = {
  subscription: {
    status: 'inactive',
    is_trial_expired: false,
    is_trial: false,
    start_date: '',
    end_date: '',
  },
  plans: [],
  quota: {
    storage: { allocated: 0, used: 0 },
    active_projects: { allocated: 0, monthly_usage: 0, is_monthly: false, used: 0 },
    users: { admin: { allocated: 0, used: 0 } },
  },
  user: undefined,
  model: {} as any,
};

const accountSlice = createSlice({
  name: 'account',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<any>) => {
      state.user = action.payload;
      state.model = action.payload;
    },
    setSubscription: (state, action: PayloadAction<Subscription>) => {
      state.subscription = action.payload;
    },
    setPlans: (state, action: PayloadAction<Plan[]>) => {
      state.plans = action.payload;
    },
    setQuota: (state, action: PayloadAction<PlanQuota>) => {
      state.quota = action.payload;
    },
    updateUserModel: (state, action: PayloadAction<Partial<any>>) => {
      state.model = { ...state.model, ...action.payload };
    },
  },
});

export const { setUser, setSubscription, setPlans, setQuota, updateUserModel } = accountSlice.actions;
export default accountSlice.reducer;
