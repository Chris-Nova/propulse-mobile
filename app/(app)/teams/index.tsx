import { SafeAreaView } from 'react-native-safe-area-context';
import { Teams } from '@/components/teams/Teams';
import { COLORS } from '@/constants/theme';
export default function TeamsPage() {
  return <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}><Teams /></SafeAreaView>;
}
