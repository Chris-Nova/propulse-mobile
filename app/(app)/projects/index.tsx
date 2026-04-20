import { SafeAreaView } from 'react-native-safe-area-context';
import { ProjectsList } from '@/components/projects/Projects';
import { COLORS } from '@/constants/theme';
export default function ProjectsPage() {
  return <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}><ProjectsList /></SafeAreaView>;
}
