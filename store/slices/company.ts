import { router } from 'expo-router';
import { AppDispatch, store } from '@/store';
import { Fetch } from '@/utils/api';
import { startAsyncAction, endAsyncAction } from '@/store/reducers/asyncActions';
import { showFeedback } from '@/store/reducers/feedback';
import { setCompany, updateCompanyModel } from '@/store/reducers/misc';

const finishAsyncAction = (payload: any) => (dispatch: AppDispatch) => {
  if (payload.feedbackType) {
    const type = payload.success ? 'success' : 'error';
    dispatch(showFeedback({ ...payload, type }));
  }
  dispatch(endAsyncAction(payload));
};

export const createCompanyProfile = () => async (dispatch: AppDispatch) => {
  const { model } = store.getState().company;
  dispatch(startAsyncAction('createCompanyProfile'));

  const { success, code, message } = await Fetch({
    path: '/users/company-setup',
    method: 'POST',
    body: {
      company_username: model.username,
      company_name: model.name,
      industry: model.industry,
      avatar: model.logo,
    },
  });

  dispatch(finishAsyncAction({
    feedbackType: !success ? 'notification' : undefined,
    target: 'createCompanyProfile',
    success,
    message,
  }) as any);

  if (success) {
    router.replace('/(app)/dashboard');
  }

  return success;
};

export const fetchCompanyProfile = () => async (dispatch: AppDispatch) => {
  dispatch(startAsyncAction('fetchCompanyProfile'));

  const { success, message, data } = await Fetch({ path: '/users/company-profile' });

  dispatch(finishAsyncAction({ target: 'fetchCompanyProfile', success, message }) as any);

  if (success && data) {
    dispatch(updateCompanyModel({
      username: data.company_username,
      industry: data.industry,
      name: data.company_name,
      logo: data.avatar,
    }));
    dispatch(setCompany(data));
  }

  return success;
};

export const updateCompanyProfile = () => async (dispatch: AppDispatch) => {
  const { model } = store.getState().company;
  dispatch(startAsyncAction('updateCompanyProfile'));

  const { success, message, data } = await Fetch({
    path: '/users/company-profile',
    method: 'PUT',
    body: {
      company_username: model.username,
      company_name: model.name,
      industry: model.industry,
      avatar: model.logo,
    },
  });

  dispatch(finishAsyncAction({
    feedbackType: 'notification',
    target: 'updateCompanyProfile',
    success,
    message,
  }) as any);

  if (success && data) dispatch(setCompany(data));

  return success;
};
