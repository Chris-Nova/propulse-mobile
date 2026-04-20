import { SafeAreaView } from 'react-native-safe-area-context';
import { ChatList } from '@/components/messages/Messages';
import { COLORS } from '@/constants/theme';
export default function MessagesPage() {
  return <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}><ChatList /></SafeAreaView>;
}
