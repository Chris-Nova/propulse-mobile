import { AppDispatch, store } from '@/store';
import { Fetch } from '@/utils/api';
import { showFeedback } from '@/store/reducers/feedback';
import { updateChats } from '@/store/reducers/chat';

// POST /messages/conversations/<id>/pin  { pinned: boolean }
// The backend allows a limited number of pinned conversations per user and
// answers with an error message when the limit is reached.
export const setConversationPinned = (chatId: string, pinned: boolean) => async (dispatch: AppDispatch) => {
  const { success, message } = await Fetch({
    path: `/messages/conversations/${chatId}/pin`,
    method: 'POST',
    body: { pinned },
  });

  if (success) {
    const chat = store.getState().chat.chats[chatId];
    if (chat) dispatch(updateChats({ ...chat, is_pinned: pinned } as any));
  } else {
    dispatch(showFeedback({
      feedbackType: 'notification',
      type: 'error',
      message: message || 'Could not update this conversation.',
    }));
  }
};
