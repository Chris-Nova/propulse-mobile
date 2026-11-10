import { useLocalSearchParams } from 'expo-router';
import { MemberDetail } from '@/components/teams/MemberDetail';

export default function MemberDetailScreen() {
  const { memberId } = useLocalSearchParams<{ memberId: string }>();
  return <MemberDetail memberId={memberId} />;
}
