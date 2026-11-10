import { useLocalSearchParams } from 'expo-router';
import { InviteDetails } from '@/components/teams/InviteDetails';

export default function InviteDetailsPage() {
  const { inviteId } = useLocalSearchParams<{ inviteId: string }>();
  return <InviteDetails inviteId={inviteId} />;
}
