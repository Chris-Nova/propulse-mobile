import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { connectSocket, disconnectSocket } from '@/store/slices/chat';

// Keeps the chat socket open for as long as a user is signed in and the app is on screen.
// Used once, in the (app) layout. It closes when the app goes to the background (phones cut
// background sockets anyway) and reopens when the app comes back.
export const useChatSocket = () => {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((s) => s.account.user?.id);

  useEffect(() => {
    if (!userId) return;
    dispatch(connectSocket() as any);

    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') dispatch(connectSocket() as any);
      else if (state === 'background') dispatch(disconnectSocket() as any);
    });

    return () => {
      sub.remove();
      dispatch(disconnectSocket() as any);
    };
  }, [userId, dispatch]);
};
