import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '@/store/hooks';
import { ChatRoom } from '@/components/messages/Messages';
import { COLORS, SIZES } from '@/constants/theme';

export default function ChatRoomPage() {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const { chats } = useAppSelector((s) => s.chat);
  const { user } = useAppSelector((s) => s.account);
  const chat = chats[chatId];

  const otherParticipant = chat?.participants?.find((p) => p.id !== user?.id);
  const chatName = chat?.room?.name ?? otherParticipant?.name ?? 'Chat';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerAvatar}>
          <Text style={styles.headerAvatarText}>{chatName.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.headerTitle} numberOfLines={1}>{chatName}</Text>
      </View>
      <ChatRoom chatId={chatId} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SIZES.sm,
  },
  backBtn: { padding: SIZES.xs },
  headerAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.primaryDark,
    alignItems: 'center', justifyContent: 'center',
  },
  headerAvatarText: { color: COLORS.white, fontWeight: '700' },
  headerTitle: { flex: 1, color: COLORS.textPrimary, fontSize: SIZES.subtitle, fontWeight: '600' },
});
