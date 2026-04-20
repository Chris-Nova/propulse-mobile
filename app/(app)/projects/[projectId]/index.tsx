import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchProject, updateProjectSubtask } from '@/store/slices/projects';
import { Loader, Card, Badge, SectionHeader } from '@/components/shared';
import Avatar from '@/components/shared/Avatar';
import { COLORS, SIZES } from '@/constants/theme';
import { Milestone, Subtask } from '@/types';

const ProgressBar = ({ value }: { value: number }) => (
  <View style={styles.progressTrack}>
    <View style={[styles.progressFill, { width: `${Math.min(value, 100)}%` as any }]} />
  </View>
);

const SubtaskRow = ({
  subtask, milestoneId, canToggle,
}: { subtask: Subtask; milestoneId: string; canToggle: boolean }) => {
  const dispatch = useAppDispatch();
  const [toggling, setToggling] = useState(false);
  const isCompleted = subtask.status === 'completed';

  const handleToggle = async () => {
    if (!canToggle || toggling) return;
    setToggling(true);
    const newStatus = isCompleted ? 'pending' : 'completed';
    await dispatch(updateProjectSubtask({
      milestoneId,
      subtask: {
        ...subtask,
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : subtask.completed_at,
      },
    }) as any);
    setToggling(false);
  };

  return (
    <View style={styles.subtaskRow}>
      <TouchableOpacity onPress={handleToggle} disabled={!canToggle || toggling} style={styles.subtaskCheck}>
        <Ionicons
          name={isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
          size={20}
          color={isCompleted ? COLORS.success : COLORS.border}
        />
      </TouchableOpacity>
      <Text style={[styles.subtaskTitle, isCompleted && styles.subtaskDone]} numberOfLines={2}>
        {subtask.title}
      </Text>
      <Badge
        label={subtask.status}
        color={isCompleted ? COLORS.success : COLORS.warning}
        bgColor={isCompleted ? COLORS.successLight + '55' : COLORS.warningLight + '55'}
      />
    </View>
  );
};

const MilestoneCard = ({ milestone, canUpdateSubtasks }: { milestone: Milestone; canUpdateSubtasks: boolean }) => {
  const [expanded, setExpanded] = useState(false);
  const hasSubtasks = (milestone.subtasks?.length ?? 0) > 0;

  return (
    <View style={styles.milestoneCard}>
      <TouchableOpacity
        onPress={() => hasSubtasks && setExpanded((e) => !e)}
        activeOpacity={hasSubtasks ? 0.7 : 1}
        style={styles.milestoneHeader}
      >
        <Ionicons
          name={milestone.is_completed ? 'checkmark-circle' : 'ellipse-outline'}
          size={22}
          color={milestone.is_completed ? COLORS.success : COLORS.textMuted}
        />
        <View style={{ flex: 1 }}>
          <Text style={[styles.milestoneName, milestone.is_completed && styles.milestoneNameDone]}>
            {milestone.name}
          </Text>
          {(milestone.start_date || milestone.end_date) && (
            <Text style={styles.milestoneDates}>
              {milestone.start_date ?? "?"} -> {milestone.end_date ?? "?"}
            </Text>
          )}
          <ProgressBar value={milestone.progress ?? 0} />
        </View>
        <Text style={styles.milestonePct}>{milestone.progress ?? 0}%</Text>
        {hasSubtasks && (
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={COLORS.textMuted} />
        )}
      </TouchableOpacity>
      {expanded && hasSubtasks && (
        <View style={styles.subtaskList}>
          {milestone.subtasks.map((subtask, idx) => (
            <SubtaskRow
              key={String(subtask.id ?? idx)}
              subtask={subtask}
              milestoneId={milestone.id}
              canToggle={canUpdateSubtasks}
            />
          ))}
        </View>
      )}
    </View>
  );
};

export default function ProjectDetailScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const dispatch = useAppDispatch();
  const { project } = useAppSelector((s) => s.project);
  const { pending } = useAppSelector((s) => s.asyncActions.fetchProject);
  const { user } = useAppSelector((s) => s.account);

  const canEdit = project?.permissions?.can_edit ?? (user as any)?.is_admin ?? false;
  const canUpdateSubtasks = project?.permissions?.can_update_subtasks ?? true;

  useEffect(() => {
    if (projectId) dispatch(fetchProject(projectId) as any);
  }, [projectId]);

  if (pending || !project) return <Loader pending fullScreen />;

  const statusColor =
    project.status === 'completed' ? COLORS.success :
    project.status === 'incomplete' ? COLORS.primary :
    COLORS.warning;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={pending}
          onRefresh={() => dispatch(fetchProject(projectId) as any)}
          tintColor={COLORS.primary}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.projectName}>{project.name}</Text>
          <Text style={styles.clientName}>{project.client_name}</Text>
        </View>
        {canEdit && (
          <TouchableOpacity
            onPress={() => router.push(`/(app)/projects/${projectId}/edit` as any)}
            style={styles.editBtn}
          >
            <Ionicons name="pencil-outline" size={18} color={COLORS.primary} />
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Stats */}
      <Card style={styles.statsCard}>
        <View style={styles.statsRow}>
          {[
            { label: 'Status', value: project.status, isStatus: true },
            { label: 'Progress', value: `${project.progress ?? 0}%`, isStatus: false },
            { label: 'Milestones', value: String(project.milestones?.length ?? 0), isStatus: false },
            { label: 'Members', value: String(project.members?.length ?? 0), isStatus: false },
          ].map((s) => (
            <View key={s.label} style={styles.statItem}>
              <Text style={styles.statLabel}>{s.label}</Text>
              {s.isStatus ? (
                <Badge label={s.value} color={statusColor} bgColor={statusColor + '22'} />
              ) : (
                <Text style={[styles.statValue, s.label === 'Progress' && { color: statusColor }]}>
                  {s.value}
                </Text>
              )}
            </View>
          ))}
        </View>
        <ProgressBar value={project.progress ?? 0} />
      </Card>

      {/* Dates */}
      {(project.start_date || project.end_date) && (
        <Card>
          <View style={styles.datesRow}>
            <View style={styles.dateItem}>
              <Ionicons name="calendar-outline" size={16} color={COLORS.textMuted} />
              <View>
                <Text style={styles.dateLabel}>Start</Text>
                <Text style={styles.dateValue}>{project.start_date ?? '—'}</Text>
              </View>
            </View>
            <Ionicons name="arrow-forward" size={16} color={COLORS.border} />
            <View style={styles.dateItem}>
              <Ionicons name="flag-outline" size={16} color={COLORS.textMuted} />
              <View>
                <Text style={styles.dateLabel}>End</Text>
                <Text style={styles.dateValue}>{project.end_date ?? '—'}</Text>
              </View>
            </View>
          </View>
        </Card>
      )}

      {/* Milestones */}
      <View>
        <SectionHeader
          title={`Milestones (${project.milestones?.length ?? 0})`}
          action={<Text style={styles.tapHint}>Tap milestone to see subtasks</Text>}
        />
        {(project.milestones?.length ?? 0) === 0 ? (
          <Card><Text style={styles.emptyText}>No milestones added yet.</Text></Card>
        ) : (
          project.milestones.map((m) => (
            <MilestoneCard key={m.id} milestone={m} canUpdateSubtasks={canUpdateSubtasks} />
          ))
        )}
      </View>

      {/* Team Members */}
      {(project.members?.length ?? 0) > 0 && (
        <View>
          <SectionHeader title={`Team (${project.members.length})`} />
          <View style={styles.membersRow}>
            {project.members.map((member, idx) => (
              <View key={member.user_id ?? idx} style={styles.memberChip}>
                <Avatar name={member.user_name} size={32} />
                <View>
                  <Text style={styles.memberName} numberOfLines={1}>{member.user_name}</Text>
                  <Text style={styles.memberRole}>{member.role}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: SIZES.md, gap: SIZES.md, paddingBottom: SIZES.xxl },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: SIZES.md },
  projectName: { color: COLORS.textPrimary, fontSize: SIZES.heading, fontWeight: '800', lineHeight: 30 },
  clientName: { color: COLORS.textSecondary, fontSize: SIZES.body, marginTop: 2 },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm,
    borderRadius: SIZES.radiusMd, borderWidth: 1.5, borderColor: COLORS.primary,
  },
  editBtnText: { color: COLORS.primary, fontWeight: '600', fontSize: SIZES.small },
  statsCard: { gap: SIZES.sm },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statItem: { alignItems: 'center', gap: 4 },
  statLabel: { color: COLORS.textMuted, fontSize: SIZES.caption },
  statValue: { color: COLORS.textPrimary, fontWeight: '700', fontSize: SIZES.subtitle },
  progressTrack: { height: 6, backgroundColor: COLORS.border, borderRadius: 3, overflow: 'hidden', marginTop: SIZES.xs },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 3 },
  datesRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly', padding: SIZES.sm },
  dateItem: { flexDirection: 'row', alignItems: 'center', gap: SIZES.sm },
  dateLabel: { color: COLORS.textMuted, fontSize: SIZES.caption },
  dateValue: { color: COLORS.textPrimary, fontWeight: '600', fontSize: SIZES.small },
  tapHint: { color: COLORS.textMuted, fontSize: SIZES.caption, fontStyle: 'italic' },
  milestoneCard: {
    backgroundColor: COLORS.card, borderRadius: SIZES.radiusMd,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: SIZES.sm, overflow: 'hidden',
  },
  milestoneHeader: { flexDirection: 'row', alignItems: 'center', gap: SIZES.sm, padding: SIZES.md },
  milestoneName: { color: COLORS.textPrimary, fontWeight: '600', fontSize: SIZES.body },
  milestoneNameDone: { color: COLORS.textMuted, textDecorationLine: 'line-through' },
  milestoneDates: { color: COLORS.textMuted, fontSize: SIZES.caption, marginTop: 2 },
  milestonePct: { color: COLORS.textSecondary, fontSize: SIZES.small, fontWeight: '600', minWidth: 36, textAlign: 'right' },
  subtaskList: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingHorizontal: SIZES.md, paddingBottom: SIZES.sm },
  subtaskRow: {
    flexDirection: 'row', alignItems: 'center', gap: SIZES.sm,
    paddingVertical: SIZES.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border + '66',
  },
  subtaskCheck: { padding: 2 },
  subtaskTitle: { flex: 1, color: COLORS.textPrimary, fontSize: SIZES.small },
  subtaskDone: { color: COLORS.textMuted, textDecorationLine: 'line-through' },
  emptyText: { color: COLORS.textMuted, fontSize: SIZES.body, textAlign: 'center', paddingVertical: SIZES.md },
  membersRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.sm },
  memberChip: {
    flexDirection: 'row', alignItems: 'center', gap: SIZES.sm,
    backgroundColor: COLORS.surfaceElevated, borderRadius: SIZES.radiusMd,
    paddingHorizontal: SIZES.sm, paddingVertical: SIZES.xs,
    borderWidth: 1, borderColor: COLORS.border,
  },
  memberName: { color: COLORS.textPrimary, fontSize: SIZES.small, fontWeight: '600', maxWidth: 100 },
  memberRole: { color: COLORS.textMuted, fontSize: SIZES.caption, textTransform: 'capitalize' },
});
