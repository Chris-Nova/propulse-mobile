import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { AppDispatch } from '@/store';
import { Fetch } from '@/utils/api';
import { startAsyncAction, endAsyncAction } from '@/store/reducers/asyncActions';
import { showFeedback } from '@/store/reducers/feedback';
import { setDocuments } from '@/store/reducers/misc';

const finishAsyncAction = (payload: any) => (dispatch: AppDispatch) => {
  if (payload.feedbackType) {
    const type = payload.success ? 'success' : 'error';
    dispatch(showFeedback({ ...payload, type }));
  }
  dispatch(endAsyncAction(payload));
};

export const fetchDocuments = () => async (dispatch: AppDispatch) => {
  dispatch(startAsyncAction('fetchDocuments'));
  const { success, message, data } = await Fetch({ path: '/projects/documents' });
  dispatch(finishAsyncAction({ target: 'fetchDocuments', success, message }) as any);
  if (success && data) dispatch(setDocuments(Array.isArray(data) ? data : (data?.results ?? [])));
};

export const fetchProjectDocuments = (projectId: string) => async (dispatch: AppDispatch) => {
  dispatch(startAsyncAction('fetchProjectDocuments'));
  const { success, message, data } = await Fetch({
    path: `/projects/${projectId}/documents`,
  });
  dispatch(finishAsyncAction({ target: 'fetchProjectDocuments', success, message }) as any);
  if (success && data) dispatch(setDocuments(Array.isArray(data) ? data : (data?.results ?? [])));
};

export const downloadDocument = async (fileUrl: string, fileName: string) => {
  try {
    const localUri = `${FileSystem.documentDirectory}${fileName}`;
    const { uri } = await FileSystem.downloadAsync(fileUrl, localUri);
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(uri);
    }
    return true;
  } catch {
    return false;
  }
};
