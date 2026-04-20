import React, { useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, TextInput, RefreshControl
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchProjects, deleteProject } from '@/store/slices/projects';
import { setProjectModel } from '@/store/reducers/project';
import { Card, EmptyState, Loader, Badge, SectionHeader } from '@/components/shared';
import Button from '@/components/shared/Button';
import { COLORS, SIZES } from '@/constants/theme';
import { Project, ProjectStatus } from '@/types';

const STATUS_CONFIG: Record<ProjectStatus, { color: string; bg: string; label: string }> = {
  pending: { color: COLORS.warning, bg: COLORS.warningLight, label: 'Pending' },
  incomplete: { color: COLORS.error, bg: COLORS.errorLight, label: 'In Progress' },
  completed: { color: COLORS.success, bg: COLORS.successLight, label: 'Completed' },
};

// ─── Project Card ──────────────────────────────────────────
const ProjectCard = ({ project, onPress }: { project: Project; onPress: () => void }) => {
  const status = STATUS_CONFIG[project.status];

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.projectName} numberOfLines={1}>{project.name}</Text>
          <Badge label={status.label} color={status.color} bgColor={status.bg + '33'} />
        </View>

        <View style={styles.clientRow}>
          <Ionicons name="person-outline" size={14} color={COLORS.textMuted} />
          <Text style={styles.clientText}>{project.client_name || 'No client'}</Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Progress</Text>
            <Text style={styles.progressValue}>{project.progress}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${project.progress}%` as any, backgroundColor: status.color }]} />
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.stat}>
            <Ionicons name="flag-outline" size={14} color={COLORS.textMuted} />
            <Text style={styles.statText}>{project.milestones?.length ?? 0} milestones</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="people-outline" size={14} color={COLORS.textMuted} />
            <Text style={styles.statText}>{project.members?.length ?? 0} members</Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

// ─── Projects List ─────────────────────────────────────────
export const ProjectsList = () => {
  const dispatch = useAppDispatch();
  const { projects } = useAppSelector((s) => s.project);
  const { pending } = useAppSelector((s) => s.asyncActions.fetchProjects);

  useEffect(() => {
    dispatch(fetchProjects() as any);
  }, []);

  if (pending && !projects.length) {
    return <Loader pending fullScreen />;
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={projects}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={pending}
            onRefresh={() => dispatch(fetchProjects() as any)}
            tintColor={COLORS.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <SectionHeader
              title={`Projects (${projects.length})`}
              action={
                <Button
                  onPress={() => router.push('/(app)/projects/create')}
                  size="small"
                >
                  + New
                </Button>
              }
            />
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="folder-open-outline"
            title="No projects yet"
            message="Create your first project to get started"
            action={
              <Button onPress={() => router.push('/(app)/projects/create')} style={{ marginTop: SIZES.md }}>
                Create Project
              </Button>
            }
          />
        }
        renderItem={({ item }) => (
          <ProjectCard
            project={item}
            onPress={() => router.push(`/(app)/projects/${item.id}`)}
          />
        )}
      />
    </View>
  );
};

// ─── Create Project ────────────────────────────────────────
export const CreateProject = () => {
  const dispatch = useAppDispatch();
  const { model } = useAppSelector((s) => s.project);
  const { pending } = useAppSelector((s) => s.asyncActions.createProject);
  const { Input: RNInput } = require('@/components/shared/Input');

  const updateModel = (key: string, val: string) => {
    dispatch(setProjectModel({ ...model, [key]: val }));
  };

  return (
    <View style={{ flex: 1, padding: SIZES.md }}>
      <Text style={styles.formTitle}>New Project</Text>

      <View style={styles.formField}>
        <Text style={styles.fieldLabel}>Project Name *</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Enter project name"
          placeholderTextColor={COLORS.textMuted}
          value={model.name}
          onChangeText={(v) => updateModel('name', v)}
        />
      </View>

      <View style={styles.formField}>
        <Text style={styles.fieldLabel}>Client Name</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Client full name"
          placeholderTextColor={COLORS.textMuted}
          value={model.client_name}
          onChangeText={(v) => updateModel('client_name', v)}
        />
      </View>

      <View style={styles.formField}>
        <Text style={styles.fieldLabel}>Client Email</Text>
        <TextInput
          style={styles.textInput}
          placeholder="client@email.com"
          placeholderTextColor={COLORS.textMuted}
          value={model.client_email}
          keyboardType="email-address"
          autoCapitalize="none"
          onChangeText={(v) => updateModel('client_email', v)}
        />
      </View>

      <Button
        onPress={() => dispatch(require('@/store/slices/projects').createProject() as any)}
        loading={pending}
        disabled={!model.name}
        fullWidth
        size="large"
        style={{ marginTop: SIZES.lg }}
      >
        Create Project
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  list: { padding: SIZES.md, gap: SIZES.sm, flexGrow: 1 },
  listHeader: { marginBottom: SIZES.sm },
  card: { marginBottom: 0 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.xs,
  },
  projectName: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: SIZES.subtitle,
    fontWeight: '600',
    marginRight: SIZES.sm,
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.xs,
    marginBottom: SIZES.md,
  },
  clientText: { color: COLORS.textSecondary, fontSize: SIZES.small },
  progressSection: { marginBottom: SIZES.md },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.xs,
  },
  progressLabel: { color: COLORS.textSecondary, fontSize: SIZES.caption },
  progressValue: { color: COLORS.textPrimary, fontSize: SIZES.caption, fontWeight: '600' },
  progressTrack: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: SIZES.radiusFull,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: SIZES.radiusFull },
  cardFooter: { flexDirection: 'row', gap: SIZES.lg },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { color: COLORS.textMuted, fontSize: SIZES.caption },
  formTitle: {
    color: COLORS.textPrimary,
    fontSize: SIZES.heading,
    fontWeight: '700',
    marginBottom: SIZES.xl,
  },
  formField: { marginBottom: SIZES.md },
  fieldLabel: {
    color: COLORS.textSecondary,
    fontSize: SIZES.small,
    fontWeight: '500',
    marginBottom: SIZES.xs,
  },
  textInput: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    height: SIZES.inputHeight,
    paddingHorizontal: SIZES.md,
    color: COLORS.textPrimary,
    fontSize: SIZES.body,
  },
});
