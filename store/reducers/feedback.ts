// feedback.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FeedbackState } from '@/types';

const initialState: FeedbackState = {
  feedbackType: 'inline',
  placement: 'topRight',
  type: 'success',
  duration: 5,
  show: false,
  message: '',
  target: '',
  title: '',
  actions: {
    secondaryFunction: undefined,
    primaryFunction: undefined,
    secondaryText: 'Cancel',
    primaryText: 'Proceed',
    secondaryUrl: '',
    primaryUrl: '',
  },
};

const feedbackSlice = createSlice({
  name: 'feedback',
  initialState,
  reducers: {
    showFeedback: (state, action: PayloadAction<Partial<FeedbackState>>) => {
      return {
        ...state,
        ...action.payload,
        actions: { ...state.actions, ...action.payload.actions },
      };
    },
    clearFeedback: () => initialState,
  },
});

export const { showFeedback, clearFeedback } = feedbackSlice.actions;
export default feedbackSlice.reducer;
