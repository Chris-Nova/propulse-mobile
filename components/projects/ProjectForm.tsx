import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, KeyboardAvoidingView,
  Platform, TouchableOpacity, Alert
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  updateProjectModel, resetProjectModel, updateMilestoneModel,
  setModelFiles, resetMilestoneModel
} from '@/store/reducers/project';
import { createProject, updateProject } from '@/store/slices/projects';
import { Input } from '@/components/shared/Input';
import Button from '@/components/shared/Button';
import DatePickerInput from '@/components/shared/DatePickerInput';
import FileUpload, { PickedFile } from '@/components/shared/FileUpload';
import MilestoneModal from './MilestoneModal';
import { ConfirmModal } from '@/components/shared/Modal';
import { Card, SectionHeader, Badge } from '@/components/shared';
import { COLORS, SIZES } from '@/constants/theme';
import { Milestone } from '@/types';

interface ProjectFormProps {
  mode: 'create' | 'edit';
  projectId?: string;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ mode, projectId }) => {
  const dispatch = useAppDispatch();
  const { model, project } = useAppSelector((s) => s.project);
  const { pending: creating } = useAppSelector((s) => s.asyncActions.createProject);
  const { pending: updating } = useAppSelector((s) => s.asyncActions.updateProject);
  const pending = creating || updating;

  const [milestoneModalOpen, setMilestoneModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const isSaved = mode === 'edit' && Boolean(model.id);
  const canAddMilestones = Boolean(model.start_date && model.end_date);

  const update = (key: string, val: string) =>
    dispatch(updateProjectModel({ [key]: val } as any));

  const disabled =
    !model.name || !model.client_name || !model.client_email ||
    !model.start_date || !model.end_date || pending;

  const handleSubmit = async () => {
    const action = isSaved
      ? updateProject(projectId ?? model.id)
      : createProject();
    dispatch(action as any);
  };

  const handleFilesSelected = (files: PickedFile[]) => {
    const mapped = files.map((f) => ({
      id: Math.random().toString(36).slice(2),
      name: f.name,
      url: f.uri,
      mime_type: f.mimeType,
      size: f.size,
      created_at: new Date().toISOString(),
      status: 'pending' as const,
    }));
    const existing = model.files ?? [];
    dispatch(setModelFiles([...existing, ...mapped]));
  };

  const handleRemoveFile = (id: string) => {
    const updated = (model.files ?? []).filter((f) => f.id !== id);
    dispatch(setModelFiles(updated));
  };

  const handleEditMilestone = (m: Milestone) => {
    dispatch(updateMilestoneModel({ ...m }));
    setMilestoneModalOpen(true);
  };

  const handleDeleteMilestone = (id: string) => {
    const milestones = model.milestones.filter((m) => m.id !== id);
    dispatch(updateProjectModel({ milestones }));
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.heading}>{mode === 'create' ? 'New Project' : 'Edit Project'}</Text>

        {/* Basic Info */}
        <Input
          label="Project Name *"
          placeholder="e.g. Hilton View Hotel"
          value={model.name}
          onChangeText={(v) => update('name', v)}
          autoCapitalize="words"
        />

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Input
              label="Client Name *"
              placeholder="John Doe"
              value={model.client_name}
              onChangeText={(v) => update('client_name', v)}
              autoCapitalize="words"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Input
              label="Client Email *"
              placeholder="client@email.com"
              value={model.client_email}
              onChangeText={(v) => update('client_email', v)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <DatePickerInput
              label="Start Date *"
              value={model.start_date}
              onChange={(v) => update('start_date', v)}
              minDate={new Date().toISOString().split('T')[0]}
            />
          </View>
          <View style={{ flex: 1 }}>
            <DatePickerInput
              label="End Date *"
              value={model.end_date}
              onChange={(v) => update('end_date', v)}
              minDate={model.start_date}
            />
          </View>
        </View>

        {/* Milestones */}
        <Card style={styles.section}>
          <View style={styles.sectionRow}>
            <SectionHeader title={`Milestones (${model.milestones?.length ?? 0})`} />
            <Button
              onPress={() => {
                if (!canAddMilestones) {
                  Alert.alert('Dates Required', 'Set start and end dates first.');
                  return;
                }
                dispatch(resetMilestoneModel());
                setMilestoneModalOpen(true);
              }}
              size="small"
              variant={canAddMilestones ? 'primary' : 'secondary'}
            >
              + Add
            </Button>
          </View>

          {model.milestones?.length === 0 ? (
            <Text style={styles.emptyHint}>
              {canAddMilestones
                ? 'No milestones yet. Tap + Add to create one.'
                : 'Set project dates to unlock milestones.'}
            </Text>
          ) : (
            model.milestones?.map((m) => (
              <View key={m.id} style={styles.milestoneRow}>
                <Ionicons
                  name={m.is_completed ? 'checkmark-circle' : 'ellipse-outline'}
                  size={18}
                  color={m.is_completed ? COLORS.success : COLORS.textMuted}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.milestoneName}>{m.name}</Text>
                  {m.start_date && (
                    <Text style={styles.milestoneDates}>
                      {m.start_date} → {m.end_date ?? '?'}
                    </Text>
                  )}
                  {m.subtasks?.length > 0 && (
                    <Text style={styles.subtaskCount}>{m.subtasks.length} subtask{m.subtasks.length !== 1 ? 's' : ''}</Text>
                  )}
                </View>
                <TouchableOpacity onPress={() => handleEditMilestone(m)} style={styles.iconBtn}>
                  <Ionicons name="pencil-outline" size={18} color={COLORS.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setDeleteConfirm(m.id)} style={styles.iconBtn}>
                  <Ionicons name="trash-outline" size={18} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </Card>

        {/* Files */}
        <Card style={styles.section}>
          <SectionHeader title="Project Files" />
          <FileUpload
            label="Upload Project Files"
            multiple
            onFilesSelected={handleFilesSelected}
            existingFiles={model.files?.map((f) => ({
              id: f.id,
              name: f.name,
              status: f.status,
            })) ?? []}
            onRemoveFile={handleRemoveFile}
            uploading={false}
          />
        </Card>

        {/* Actions */}
        <View style={styles.actions}>
          <Button onPress={() => router.back()} variant="outline" style={{ flex: 1 }}>
            Cancel
          </Button>
          <Button
            onPress={handleSubmit}
            loading={pending}
            disabled={disabled}
            style={{ flex: 2 }}
            size="large"
          >
            {isSaved ? 'Save Changes' : 'Create Project'}
          </Button>
        </View>
      </ScrollView>

      {/* Milestone Modal */}
      <MilestoneModal
        visible={milestoneModalOpen}
        onClose={() => setMilestoneModalOpen(false)}
        savedProjectId={isSaved ? projectId : undefined}
      />

      {/* Delete Milestone Confirm */}
      <ConfirmModal
        visible={!!deleteConfirm}
        title="Delete Milestone"
        message="Are you sure you want to delete this milestone?"
        confirmText="Delete"
        danger
        onConfirm={() => {
          if (deleteConfirm) handleDeleteMilestone(deleteConfirm);
          setDeleteConfirm(null);
        }}
        onCancel={() => setDeleteConfirm(null)}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { padding: SIZES.md, gap: SIZES.md, paddingBottom: SIZES.xxl },
  heading: { color: COLORS.textPrimary, fontSize: SIZES.heading, fontWeight: '700' },
  row: { flexDirection: 'row', gap: SIZES.md },
  section: { gap: SIZES.sm },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  emptyHint: {
    color: COLORS.textMuted,
    fontSize: SIZES.small,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: SIZES.sm,
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.sm,
    paddingVertical: SIZES.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  milestoneName: { color: COLORS.textPrimary, fontSize: SIZES.body, fontWeight: '600' },
  milestoneDates: { color: COLORS.textMuted, fontSize: SIZES.caption, marginTop: 2 },
  subtaskCount: { color: COLORS.textSecondary, fontSize: SIZES.caption },
  iconBtn: { padding: SIZES.xs },
  actions: {
    flexDirection: 'row',
    gap: SIZES.md,
    marginTop: SIZES.sm,
  },
});

export default ProjectForm;
