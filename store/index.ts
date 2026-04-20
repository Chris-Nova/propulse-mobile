import { configureStore } from '@reduxjs/toolkit';
import { combineReducers } from 'redux';

// Reuse all reducers directly from the translated source
import asyncActionsReducer from '@/store/reducers/asyncActions';
import feedbackReducer from '@/store/reducers/feedback';
import analyticsReducer from '@/store/reducers/analytics';
import documentReducer from '@/store/reducers/document';
import projectReducer from '@/store/reducers/project';
import accountReducer from '@/store/reducers/account';
import companyReducer from '@/store/reducers/company';
import teamReducer from '@/store/reducers/team';
import chatReducer from '@/store/reducers/chat';
import authReducer from '@/store/reducers/auth';
import appReducer from '@/store/reducers/app';
import modalReducer from '@/store/reducers/modal';

const rootReducer = combineReducers({
  asyncActions: asyncActionsReducer,
  analytics: analyticsReducer,
  feedback: feedbackReducer,
  document: documentReducer,
  company: companyReducer,
  account: accountReducer,
  project: projectReducer,
  modal: modalReducer,
  chat: chatReducer,
  auth: authReducer,
  team: teamReducer,
  app: appReducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['REHYDRATE', 'REGISTER', 'PERSIST', 'FLUSH', 'PAUSE', 'PURGE'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppStore = typeof store;
