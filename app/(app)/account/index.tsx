import { SafeAreaView } from 'react-native-safe-area-context';
import { Account } from '@/components/account/Account';
import { COLORS } from '@/constants/theme';
export default function AccountPage() {
  return <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}><Account /></SafeAreaView>;
}
