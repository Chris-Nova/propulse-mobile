import { useLocalSearchParams } from 'expo-router';
import { ChatRoom } from '@/components/messages/ChatRoom';

export default function ChatRoomPage() {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  return <ChatRoom chatId={chatId} />;
}
