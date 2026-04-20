import { useEffect } from 'react';
import Toast from 'react-native-toast-message';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { clearFeedback } from '@/store/reducers/feedback';

/**
 * Mount this once inside the root layout (inside <Provider>).
 * It watches Redux feedback state and fires react-native-toast-message.
 */
export const FeedbackToast = () => {
  const dispatch = useAppDispatch();
  const feedback = useAppSelector((s) => s.feedback);

  useEffect(() => {
    if (!feedback.show && !feedback.message) return;
    if (feedback.feedbackType !== 'notification') return;

    const typeMap: Record<string, string> = {
      success: 'success',
      error: 'error',
      warning: 'info',
      info: 'info',
      primary: 'info',
    };

    Toast.show({
      type: typeMap[feedback.type] ?? 'info',
      text1: feedback.title || undefined,
      text2: feedback.message,
      visibilityTime: (feedback.duration ?? 5) * 1000,
      onHide: () => dispatch(clearFeedback()),
    });
  }, [feedback.message, feedback.show]);

  return null;
};

export default FeedbackToast;
