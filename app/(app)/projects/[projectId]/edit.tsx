import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchProject } from '@/store/slices/projects';
import { setProjectModel } from '@/store/reducers/project';
import ProjectForm from '@/components/projects/ProjectForm';
import { Screen } from '@/components/shared';
import { COLORS } from '@/constants/theme';

export default function EditProjectScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const dispatch = useAppDispatch();
  const { pending } = useAppSelector((s) => s.asyncActions.fetchProject);
  const { project } = useAppSelector((s) => s.project);

  useEffect(() => {
    if (projectId) {
      dispatch(fetchProject(projectId) as any);
    }
  }, [projectId]);

  // When project loads, seed the model
  useEffect(() => {
    if (project) dispatch(setProjectModel(project));
  }, [project?.id]);

  if (pending) {
    return (
      <Screen title="Edit Project" scrollable={false}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen title="Edit Project" scrollable={false}>
      <ProjectForm mode="edit" projectId={projectId} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
