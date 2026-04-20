import { useEffect } from 'react';
import { TouchableOpacity } from 'react-native';
import { useAppDispatch } from '@/store/hooks';
import { resetProjectModel } from '@/store/reducers/project';
import ProjectForm from '@/components/projects/ProjectForm';
import { Screen } from '@/components/shared';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';

export default function CreateProjectPage() {
  const dispatch = useAppDispatch();
  useEffect(() => { dispatch(resetProjectModel()); }, []);
  return (
    <Screen
      title="New Project"
      scrollable={false}
      headerLeft={
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
      }
    >
      <ProjectForm mode="create" />
    </Screen>
  );
}
