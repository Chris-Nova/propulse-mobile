import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView, KeyboardAvoidingView, Platform,
  TouchableOpacity, Modal, Pressable, Alert, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  updateProjectModel, resetProjectModel, updateMilestoneModel, resetMilestoneModel,
} from '@/store/reducers/project';
import { fetchProjects } from '@/store/slices/projects';
import { Milestone } from '@/types';
import { BRAND_PURPLE } from '@/constants/authTheme';
import { useDashboardTheme } from '@/constants/dashboardTheme';
import { isValidEmail } from '@/utils/validators';
import { formatLong } from '@/utils/format';
import { SelectField } from '@/components/shared/SelectField';
import { DateField } from '@/components/shared/DateField';
import { BottomGlow } from '@/components/splash/BottomGlow';
import MilestoneModal from './MilestoneModal';
import { createProjectInWizard } from './createProjectFlow';

const STEPS = ['Project Details', 'Milestones', 'Review', 'Done'];
const NAME_MAX = 100;
const DESC_MAX = 500;

export const CreateProjectWizard = () => {
  const dispatch = useAppDispatch();
  const theme = useDashboardTheme();
  const insets = useSafeAreaInsets();
  const light = theme.scheme === 'light';
  const { model, projects } = useAppSelector((s) => s.project);
  const { pending } = useAppSelector((s) => s.asyncActions.createProject);

  const [step, setStep] = useState(1);
  const [attempted, setAttempted] = useState(false);
  const [createdId, setCreatedId] = useState<string>();
  const [clientModal, setClientModal] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', email: '' });
  const [clientError, setClientError] = useState('');
  const [extraClients, setExtraClients] = useState<{ name: string; email: string }[]>([]);
  const [milestoneOpen, setMilestoneOpen] = useState(false);

  useEffect(() => {
    dispatch(resetProjectModel());
    dispatch(fetchProjects() as any);
    return () => { dispatch(resetProjectModel()); };
  }, [dispatch]);

  const m: any = model;
  const description: string = m.description ?? '';
  const update = (patch: Record<string, any>) => dispatch(updateProjectModel(patch as any));

  // Existing clients come from the person's other projects; new ones are added in this screen.
  const clients = useMemo(() => {
    const map = new Map<string, { name: string; email: string }>();
    [...projects.map((p) => ({ name: p.client_name, email: p.client_email })), ...extraClients].forEach((c) => {
      if (c.name && c.email) map.set(c.email.toLowerCase(), c);
    });
    return [...map.values()];
  }, [projects, extraClients]);

  const nameOk = model.name.trim().length > 0;
  const clientOk = !!model.client_name && isValidEmail(model.client_email ?? '');
  const datesOk = !!model.start_date && !!model.end_date && model.end_date >= model.start_date;
  const step1Ok = nameOk && clientOk && datesOk;

  const today = new Date();
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const addClient = () => {
    if (!newClient.name.trim()) return setClientError('Enter the client\'s name');
    if (!isValidEmail(newClient.email.trim())) return setClientError('Enter a valid email address');
    const c = { name: newClient.name.trim(), email: newClient.email.trim() };
    setExtraClients((l) => [...l, c]);
    update({ client_name: c.name, client_email: c.email });
    setNewClient({ name: '', email: '' });
    setClientError('');
    setClientModal(false);
  };

  const goNext = () => {
    if (step === 1) {
      setAttempted(true);
      if (!step1Ok) return;
    }
    setStep((s) => s + 1);
  };

  const create = async () => {
    const id = await dispatch(createProjectInWizard() as any);
    if (id) { setCreatedId(id); setStep(4); }
  };

  const cancel = () => {
    const dirty = model.name || model.client_name || description;
    if (!dirty) return router.back();
    Alert.alert('Discard this project?', 'What you entered will be lost.', [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => router.back() },
    ]);
  };

  const border = light ? '#DFDFDF' : theme.fieldBorder;
  const fieldBg = light ? '#FFFFFF' : theme.field;
  const label = (text: string, required = false, optional = false) => (
    <Text style={[styles.label, { color: theme.text }]}>
      {text}
      {required && <Text style={{ color: '#E33629' }}> *</Text>}
      {optional && <Text style={{ color: theme.muted, fontWeight: '400' }}> (optional)</Text>}
    </Text>
  );
  const err = (show: boolean, text: string) =>
    show ? <Text style={styles.err}>{text}</Text> : null;

  // ── Buttons ──
  const Buttons = ({ left, onLeft, right, onRight, rightDisabled, rightLoading }: any) => (
    <View style={styles.buttons}>
      <TouchableOpacity
        onPress={onLeft}
        activeOpacity={0.8}
        style={[styles.btn, styles.btnOutline, { borderColor: BRAND_PURPLE }]}
      >
        <Text style={[styles.btnText, { color: light ? BRAND_PURPLE : theme.tabBar.active }]}>{left}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onRight}
        disabled={rightDisabled || rightLoading}
        activeOpacity={0.85}
        style={[styles.btn, { backgroundColor: BRAND_PURPLE, opacity: rightDisabled ? 0.55 : 1 }]}
      >
        {rightLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={[styles.btnText, { color: '#FFFFFF' }]}>{right}</Text>}
      </TouchableOpacity>
    </View>
  );

  // ── Stepper ──
  const Stepper = () => (
    <View style={styles.stepper}>
      {STEPS.map((name, i) => {
        const n = i + 1;
        const done = n < step;
        const current = n === step;
        return (
          <View key={name} style={styles.stepCol}>
            {i < STEPS.length - 1 && (
              <View style={[styles.stepLine, { backgroundColor: n < step ? BRAND_PURPLE : light ? '#DADADA' : 'rgba(255,255,255,0.2)' }]} />
            )}
            <View
              style={[
                styles.stepCircle,
                { backgroundColor: done || current ? BRAND_PURPLE : light ? '#F1F1F1' : 'rgba(255,255,255,0.12)' },
              ]}
            >
              {done ? (
                <Ionicons name="checkmark" size={15} color="#FFFFFF" />
              ) : (
                <Text style={{ color: current ? '#FFFFFF' : theme.placeholder, fontSize: 12, fontWeight: '600' }}>{n}</Text>
              )}
            </View>
            <Text style={[styles.stepLabel, { color: current ? theme.text : theme.placeholder }]} numberOfLines={1}>{name}</Text>
          </View>
        );
      })}
    </View>
  );

  const reviewRow = (k: string, v: string) => (
    <View style={[styles.reviewRow, { borderTopColor: theme.divider }]}>
      <Text style={[styles.reviewKey, { color: theme.muted }]}>{k}</Text>
      <Text style={[styles.reviewVal, { color: theme.text }]}>{v}</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar style={theme.statusBar} />
      {theme.glow && <BottomGlow color={BRAND_PURPLE} opacity={0.22} />}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: insets.top + 28 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={step === 4 ? () => router.replace('/(app)/projects' as any) : step === 1 ? cancel : () => setStep((s) => s - 1)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityLabel="Go back"
            >
              <Ionicons name="arrow-back" size={22} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.text }]}>Create Project</Text>
          </View>
          <Text style={[styles.subtitle, { color: theme.text }]}>
            Set up your project details. You can add milestones later.
          </Text>

          <Stepper />

          {/* ── Step 1: details ── */}
          {step === 1 && (
            <View>
              {label('Project Name', true)}
              <View style={[styles.field, { backgroundColor: fieldBg, borderColor: attempted && !nameOk ? '#EF4444' : border }]}>
                <Ionicons name="briefcase-outline" size={17} color={theme.text} />
                <TextInput
                  value={model.name}
                  onChangeText={(v) => update({ name: v.slice(0, NAME_MAX) })}
                  placeholder="e.g. Brand Identity Design"
                  placeholderTextColor={theme.placeholder}
                  style={[styles.input, { color: theme.text }]}
                  maxLength={NAME_MAX}
                />
              </View>
              <Text style={[styles.counter, { color: theme.muted }]}>{model.name.length}/{NAME_MAX}</Text>
              {err(attempted && !nameOk, 'Enter a project name')}

              <View style={styles.gap}>{label('Client', true)}</View>
              <SelectField
                icon="person-outline"
                placeholder="Select a client"
                value={model.client_email || undefined}
                options={clients.map((c) => ({ label: c.name, value: c.email, sub: c.email }))}
                onSelect={(email) => {
                  const c = clients.find((x) => x.email === email);
                  if (c) update({ client_name: c.name, client_email: c.email });
                }}
                title="Select a client"
                emptyText="No clients yet. Use “Add new client” below."
                invalid={attempted && !clientOk}
              />
              {err(attempted && !clientOk, 'Choose or add a client')}
              <TouchableOpacity onPress={() => setClientModal(true)} style={styles.addClient} activeOpacity={0.7}>
                <View style={styles.plus}><Ionicons name="add" size={16} color="#FFFFFF" /></View>
                <Text style={[styles.addClientText, { color: light ? BRAND_PURPLE : theme.tabBar.active }]}>Add new client</Text>
              </TouchableOpacity>

              <View style={styles.gap}>{label('Start date', true)}</View>
              <DateField
                value={model.start_date}
                onChange={(iso) => {
                  update({ start_date: iso });
                  if (model.end_date && model.end_date < iso) update({ end_date: undefined });
                }}
                minDate={todayIso}
                placeholder="Select start date"
                invalid={attempted && !model.start_date}
              />

              <View style={styles.gap}>{label('Expected completion date', true)}</View>
              <DateField
                value={model.end_date}
                onChange={(iso) => update({ end_date: iso })}
                minDate={model.start_date || todayIso}
                placeholder="Select completion date"
                invalid={attempted && !datesOk}
              />
              {err(attempted && !!model.start_date && !!model.end_date && !datesOk, 'Completion date must be after the start date')}

              <View style={styles.gap}>{label('Project description', false, true)}</View>
              <View style={[styles.field, styles.descField, { backgroundColor: fieldBg, borderColor: border }]}>
                <Ionicons name="reorder-three-outline" size={18} color={theme.text} style={{ marginTop: 2 }} />
                <TextInput
                  value={description}
                  onChangeText={(v) => update({ description: v.slice(0, DESC_MAX) })}
                  placeholder="Briefly describe the project..."
                  placeholderTextColor={theme.placeholder}
                  style={[styles.input, { color: theme.text, textAlignVertical: 'top', minHeight: 56 }]}
                  multiline
                  maxLength={DESC_MAX}
                />
              </View>
              <Text style={[styles.counter, { color: theme.muted, textAlign: 'right' }]}>{description.length}/{DESC_MAX}</Text>

              <Buttons left="Cancel" onLeft={cancel} right="Continue" onRight={goNext} />
            </View>
          )}

          {/* ── Step 2: milestones ── */}
          {step === 2 && (
            <View>
              <Text style={[styles.stepIntro, { color: theme.muted }]}>
                Break the project into milestones. This step is optional — you can add them later from the project page.
              </Text>
              <TouchableOpacity
                onPress={() => { dispatch(resetMilestoneModel()); setMilestoneOpen(true); }}
                activeOpacity={0.8}
                style={[styles.addMilestone, { borderColor: BRAND_PURPLE }]}
              >
                <Ionicons name="add-circle-outline" size={18} color={light ? BRAND_PURPLE : theme.tabBar.active} />
                <Text style={{ color: light ? BRAND_PURPLE : theme.tabBar.active, fontWeight: '600', fontSize: 13 }}>Add milestone</Text>
              </TouchableOpacity>

              {(model.milestones ?? []).map((ms: Milestone) => (
                <View key={ms.id} style={[styles.msRow, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  <Ionicons name="flag-outline" size={17} color={theme.accent} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.text, fontSize: 13, fontWeight: '600' }} numberOfLines={1}>{ms.name}</Text>
                    {!!ms.start_date && (
                      <Text style={{ color: theme.muted, fontSize: 10.5, marginTop: 2 }}>
                        {formatLong(ms.start_date)} → {formatLong(ms.end_date) || '?'}
                        {ms.subtasks?.length ? `  ·  ${ms.subtasks.length} subtask${ms.subtasks.length === 1 ? '' : 's'}` : ''}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity onPress={() => { dispatch(updateMilestoneModel({ ...ms })); setMilestoneOpen(true); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="pencil-outline" size={17} color={theme.accent} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => update({ milestones: model.milestones.filter((x) => x.id !== ms.id) })}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="trash-outline" size={17} color="#E33629" />
                  </TouchableOpacity>
                </View>
              ))}

              <Buttons left="Back" onLeft={() => setStep(1)} right="Continue" onRight={goNext} />
            </View>
          )}

          {/* ── Step 3: review ── */}
          {step === 3 && (
            <View>
              <Text style={[styles.stepIntro, { color: theme.muted }]}>Check everything looks right, then create the project.</Text>
              <View style={[styles.reviewCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                {reviewRow('Project', model.name)}
                {reviewRow('Client', `${model.client_name} (${model.client_email})`)}
                {reviewRow('Start date', formatLong(model.start_date))}
                {reviewRow('Completion date', formatLong(model.end_date))}
                {!!description && reviewRow('Description', description)}
                {reviewRow('Milestones', String(model.milestones?.length ?? 0))}
              </View>
              <Buttons
                left="Back"
                onLeft={() => setStep(2)}
                right="Create Project"
                onRight={create}
                rightLoading={pending}
              />
            </View>
          )}

          {/* ── Step 4: done ── */}
          {step === 4 && (
            <View style={styles.done}>
              <View style={[styles.doneIcon, { backgroundColor: theme.palette.mint.bg }]}>
                <Ionicons name="checkmark" size={38} color={theme.palette.mint.icon} />
              </View>
              <Text style={[styles.doneTitle, { color: theme.text }]}>Project created</Text>
              <Text style={[styles.doneText, { color: theme.muted }]}>
                “{model.name}” is ready. Invite your team and upload documents from the project page.
              </Text>
              <Buttons
                left="All Projects"
                onLeft={() => router.replace('/(app)/projects' as any)}
                right="View Project"
                onRight={() => router.replace(`/(app)/projects/${createdId}` as any)}
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Add new client */}
      <Modal visible={clientModal} transparent animationType="fade" onRequestClose={() => setClientModal(false)}>
        <Pressable style={styles.backdrop} onPress={() => setClientModal(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: theme.sheet, borderColor: theme.cardBorder }]}>
            <Text style={{ color: theme.text, fontSize: 16, fontWeight: '700', marginBottom: 14 }}>Add new client</Text>
            <View style={[styles.field, { backgroundColor: fieldBg, borderColor: border, marginBottom: 12 }]}>
              <Ionicons name="person-outline" size={17} color={theme.text} />
              <TextInput
                value={newClient.name}
                onChangeText={(v) => setNewClient((c) => ({ ...c, name: v }))}
                placeholder="Client name"
                placeholderTextColor={theme.placeholder}
                style={[styles.input, { color: theme.text }]}
                autoCapitalize="words"
              />
            </View>
            <View style={[styles.field, { backgroundColor: fieldBg, borderColor: border }]}>
              <Ionicons name="mail-outline" size={17} color={theme.text} />
              <TextInput
                value={newClient.email}
                onChangeText={(v) => setNewClient((c) => ({ ...c, email: v }))}
                placeholder="Client email"
                placeholderTextColor={theme.placeholder}
                style={[styles.input, { color: theme.text }]}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            {err(!!clientError, clientError)}
            <View style={[styles.buttons, { marginTop: 18 }]}>
              <TouchableOpacity onPress={() => { setClientModal(false); setClientError(''); }} style={[styles.btn, styles.btnOutline, { borderColor: BRAND_PURPLE }]}>
                <Text style={[styles.btnText, { color: light ? BRAND_PURPLE : theme.tabBar.active }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={addClient} style={[styles.btn, { backgroundColor: BRAND_PURPLE }]}>
                <Text style={[styles.btnText, { color: '#FFFFFF' }]}>Add client</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Existing milestone editor (unchanged styling) */}
      <MilestoneModal visible={milestoneOpen} onClose={() => setMilestoneOpen(false)} savedProjectId={undefined} />
    </View>
  );
};

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginLeft: 8 },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { fontSize: 10, marginLeft: 44, marginTop: 6, maxWidth: 220 },
  stepper: { flexDirection: 'row', marginTop: 20, marginBottom: 22 },
  stepCol: { flex: 1, alignItems: 'center' },
  stepLine: { position: 'absolute', top: 13, left: '50%', width: '100%', height: 1.5 },
  stepCircle: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  stepLabel: { fontSize: 8, marginTop: 6 },
  label: { fontSize: 12.5, fontWeight: '600', marginBottom: 8 },
  gap: { marginTop: 16 },
  field: {
    height: 42, borderRadius: 10, borderWidth: 1, flexDirection: 'row', alignItems: 'center',
    gap: 14, paddingHorizontal: 16,
  },
  descField: { height: undefined, minHeight: 72, alignItems: 'flex-start', paddingVertical: 12 },
  input: { flex: 1, fontSize: 12.5, paddingVertical: 0 },
  counter: { fontSize: 9.5, marginTop: 5 },
  err: { color: '#EF4444', fontSize: 11.5, marginTop: 6 },
  addClient: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  plus: { width: 24, height: 24, borderRadius: 12, backgroundColor: BRAND_PURPLE, alignItems: 'center', justifyContent: 'center' },
  addClientText: { fontSize: 12, fontWeight: '500' },
  buttons: { flexDirection: 'row', gap: 12, marginTop: 28 },
  btn: { flex: 1, height: 46, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  btnOutline: { borderWidth: 1.5 },
  btnText: { fontSize: 15, fontWeight: '600' },
  stepIntro: { fontSize: 12.5, lineHeight: 18, marginBottom: 18 },
  addMilestone: {
    height: 44, borderRadius: 10, borderWidth: 1, borderStyle: 'dashed', flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 14,
  },
  msRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 10 },
  reviewCard: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14 },
  reviewRow: { paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth, gap: 3 },
  reviewKey: { fontSize: 10.5 },
  reviewVal: { fontSize: 13.5, fontWeight: '600' },
  done: { alignItems: 'center', paddingTop: 30 },
  doneIcon: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center' },
  doneTitle: { fontSize: 22, fontWeight: '700', marginTop: 22 },
  doneText: { fontSize: 13, textAlign: 'center', lineHeight: 19, marginTop: 10, paddingHorizontal: 18 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
  sheet: { borderRadius: 14, borderWidth: 1, padding: 18 },
});
