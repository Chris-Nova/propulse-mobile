import { SafeAreaView } from 'react-native-safe-area-context';
import { Analytics } from '@/components/analytics/Analytics';
import { COLORS } from '@/constants/theme';
export default function AnalyticsPage() {
  return <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}><Analytics /></SafeAreaView>;
}
