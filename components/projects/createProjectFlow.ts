import { AppDispatch, store } from '@/store';
import { Fetch } from '@/utils/api';
import { startAsyncAction, endAsyncAction } from '@/store/reducers/asyncActions';
import { showFeedback } from '@/store/reducers/feedback';
import { fetchProjects } from '@/store/slices/projects';

// Same request as createProject(), but it does NOT navigate away afterwards, so the
// wizard can show its own "Done" step. Returns the new project's id (or undefined).
export const createProjectInWizard = () => async (dispatch: AppDispatch): Promise<string | undefined> => {
  const { model } = store.getState().project;
  dispatch(startAsyncAction('createProject'));

  const { success, message, data } = await Fetch({
    path: '/projects/create',
    method: 'POST',
    body: model as any,
  });

  dispatch(endAsyncAction({ target: 'createProject', success, message } as any));
  if (!success || !data) {
    dispatch(showFeedback({
      feedbackType: 'notification',
      type: 'error',
      message: message || 'Could not create the project.',
    }));
    return undefined;
  }

  dispatch(fetchProjects() as any);
  return data.id as string;
};
