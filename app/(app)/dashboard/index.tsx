import { SafeAreaView } from 'react-native-safe-area-context';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { COLORS } from '@/constants/theme';
export default function DashboardPage() {
  return <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}><Dashboard /></SafeAreaView>;
}
