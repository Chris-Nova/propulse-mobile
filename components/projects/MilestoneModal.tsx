import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Switch as RNSwitch, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { isEqual } from 'lodash';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  updateMilestoneModel,
  resetMilestoneModel,
  updateProjectModel,
} from '@/store/reducers/project';
import { updateProject } from '@/store/slices/projects';
import { fetchTeamMembers } from '@/store/slices/teams';
import { showFeedback } from '@/store/reducers/feedback';
import { Modal } from '@/components/shared/Modal';
import { Input } from '@/components/shared/Input';
import SelectInput from '@/components/shared/SelectInput';
import DatePickerInput from '@/components/shared/DatePickerInput';
import Button from '@/components/shared/Button';
import { COLORS, SIZES } from '@/constants/theme';
import { Milestone, Subtask } from '@/types';

const randomId = () => Math.random().toString(36).substring(2, 10);

interface MilestoneModalProps {
  visible: boolean;
  onClose: () => void;
  /** Pass projectId when editing an already-saved project (not just the local model) */
  savedProjectId?: string;
}

const MilestoneModal: React.FC<MilestoneModalProps> = ({
  visible,
  onClose,
  savedProjectId,
}) => {
  const dispatch = useAppDispatch();
  const { milestoneModel, model, project } = useAppSelector((s) => s.project);
  const { members } = useAppSelector((s) => s.team);

  const projectData = savedProjectId ? project : model;
  const existingMilestones = projectData?.milestones ?? [];
  const milestoneIndex = model.milestones.findIndex((m) => m.id === milestoneModel.id);
  const isEditing = milestoneIndex >= 0;

  const collaborators = members
    .filter((m) => m.role === 'collaborator')
    .map((m) => ({ label: m.user_name, value: m.user_id }));

  const disabled =
    !milestoneModel.name || !milestoneModel.start_date || !milestoneModel.end_date;

  useEffect(() => {
    if (visible) dispatch(fetchTeamMembers() as any);
  }, [visible]);

  const update = (key: keyof Milestone, val: any) =>
    dispatch(updateMilestoneModel({ [key]: val }));

  const addSubtask = () => {
    const subtask: Subtask = {
      id: milestoneModel.subtasks.length,
      status: 'pending',
      title: '',
      created_at: new Date().toISOString(),
    };
    dispatch(updateMilestoneModel({ subtasks: [...milestoneModel.subtasks, subtask] }));
  };

  const updateSubtask = (idx: number, title: string) => {
    const subtasks = milestoneModel.subtasks.map((s, i) =>
      i === idx ? { ...s, title } : s
    );
    dispatch(updateMilestoneModel({ subtasks }));
  };

  const removeSubtask = (idx: number) => {
    const subtasks = milestoneModel.subtasks.filter((_, i) => i !== idx);
    dispatch(updateMilestoneModel({ subtasks }));
  };

  const saveMilestone = async (andExit = false) => {
    const dupe = existingMilestones.find(
      ({ name, id }) =>
        name.toLowerCase() === milestoneModel.name.toLowerCase() &&
        !isEqual(id, milestoneModel.id)
    );

    if (dupe) {
      dispatch(
        showFeedback({
          message: 'A milestone with the same name already exists.',
          feedbackType: 'notification',
          type: 'error',
        })
      );
      return;
    }

    const milestones = [...model.milestones];
    const milestone = { ...milestoneModel };

    if (isEditing) {
      milestones[milestoneIndex] = milestone;
    } else {
      milestone.id = randomId();
      milestone.created_at = new Date().toISOString();
      milestones.push(milestone);
    }

    dispatch(updateProjectModel({ milestones }));

    // If editing a saved project, persist immediately
    if (savedProjectId && project) {
      const updated = { ...project, milestones };
      await dispatch(updateProject(savedProjectId) as any);
    }

    dispatch(
      showFeedback({
        message: `Milestone ${isEditing ? 'updated' : 'added'} successfully!`,
        feedbackType: 'notification',
        type: 'success',
      })
    );

    if (isEditing || andExit) {
      dispatch(resetMilestoneModel());
      onClose();
    } else {
      dispatch(resetMilestoneModel());
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={() => {
        dispatch(resetMilestoneModel());
        onClose();
      }}
      title={`${isEditing ? 'Edit' : 'Add'} Milestone`}
      footer={
        <View style={styles.footer}>
          <Button
            onPress={() => saveMilestone(true)}
            disabled={disabled}
            fullWidth
            size="large"
          >
            Save &amp; Exit
          </Button>
          {!isEditing && (
            <Button
              onPress={() => saveMilestone(false)}
              disabled={disabled}
              variant="outline"
              fullWidth
              style={{ marginTop: SIZES.sm }}
            >
              Save &amp; Add Another
            </Button>
          )}
        </View>
      }
    >
      <Input
        label="Milestone Name *"
        placeholder="e.g. Foundation Work"
        value={milestoneModel.name}
        onChangeText={(v) => update('name', v)}
        autoFocus
      />

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <DatePickerInput
            label="Start Date *"
            value={milestoneModel.start_date}
            onChange={(v) => update('start_date', v)}
            minDate={projectData?.start_date}
            maxDate={projectData?.end_date}
          />
        </View>
        <View style={{ flex: 1 }}>
          <DatePickerInput
            label="End Date *"
            value={milestoneModel.end_date}
            onChange={(v) => update('end_date', v)}
            minDate={milestoneModel.start_date ?? projectData?.start_date}
            maxDate={projectData?.end_date}
          />
        </View>
      </View>

      {collaborators.length > 0 && (
        <SelectInput
          label="Assign To (optional)"
          placeholder="Select collaborator"
          value={milestoneModel.assigned_to}
          options={[{ label: 'Unassigned', value: '' }, ...collaborators]}
          onChange={(v) => update('assigned_to', v)}
        />
      )}

      {/* Subtasks */}
      <View style={styles.subtasksSection}>
        <View style={styles.subtasksHeader}>
          <Text style={styles.subtasksTitle}>Subtasks</Text>
          <TouchableOpacity onPress={addSubtask} style={styles.addSubtaskBtn}>
            <Ionicons name="add-circle-outline" size={20} color={COLORS.primary} />
            <Text style={styles.addSubtaskText}>Add</Text>
          </TouchableOpacity>
        </View>

        {milestoneModel.subtasks.map((subtask, idx) => (
          <View key={idx} style={styles.subtaskRow}>
            <Input
              placeholder={`Subtask ${idx + 1}`}
              value={subtask.title}
              onChangeText={(v) => updateSubtask(idx, v)}
              containerStyle={styles.subtaskInput}
              autoFocus
            />
            <TouchableOpacity onPress={() => removeSubtask(idx)} style={styles.removeBtn}>
              <Ionicons name="close-circle" size={22} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        ))}

        {milestoneModel.subtasks.length === 0 && (
          <Text style={styles.noSubtasks}>No subtasks yet — tap Add to create one.</Text>
        )}
      </View>

      {/* Enable Client Feedback */}
      <View style={styles.switchRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.switchLabel}>Enable Client Feedback</Text>
          <Text style={styles.switchHint}>Allow client to review this milestone</Text>
        </View>
        <RNSwitch
          value={milestoneModel.enable_feedback}
          onValueChange={(v) => update('enable_feedback', v)}
          trackColor={{ true: COLORS.primary, false: COLORS.border }}
          thumbColor={COLORS.white}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: SIZES.md },
  footer: { gap: SIZES.xs },
  subtasksSection: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    gap: SIZES.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  subtasksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subtasksTitle: {
    color: COLORS.textPrimary,
    fontSize: SIZES.body,
    fontWeight: '600',
  },
  addSubtaskBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addSubtaskText: { color: COLORS.primary, fontSize: SIZES.small, fontWeight: '600' },
  subtaskRow: { flexDirection: 'row', alignItems: 'center', gap: SIZES.xs },
  subtaskInput: { flex: 1, marginBottom: 0 },
  removeBtn: { padding: 4 },
  noSubtasks: {
    color: COLORS.textMuted,
    fontSize: SIZES.small,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: SIZES.sm,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.md,
    backgroundColor: COLORS.surfaceElevated,
    padding: SIZES.md,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  switchLabel: { color: COLORS.textPrimary, fontSize: SIZES.body, fontWeight: '600' },
  switchHint: { color: COLORS.textMuted, fontSize: SIZES.caption, marginTop: 2 },
});

export default MilestoneModal;
