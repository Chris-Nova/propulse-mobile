import { useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchTeamMember } from '@/store/slices/teams';
import MemberDetail from '@/components/teams/MemberDetail';
import { Screen, Loader } from '@/components/shared';

export default function MemberDetailScreen() {
  const { memberId } = useLocalSearchParams<{ memberId: string }>();
  const dispatch = useAppDispatch();
  const { pending } = useAppSelector((s) => s.asyncActions.fetchTeamMember);

  useEffect(() => {
    if (memberId) dispatch(fetchTeamMember(memberId) as any);
  }, [memberId]);

  return (
    <Screen title="Member Details" scrollable={false}>
      {pending ? <Loader pending fullScreen /> : <MemberDetail />}
    </Screen>
  );
}
