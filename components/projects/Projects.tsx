import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, TextInput, RefreshControl, Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchProjects, deleteProject } from '@/store/slices/projects';
import { setProjectModel } from '@/store/reducers/project';
import { Card, EmptyState, Loader, Badge, SectionHeader } from '@/components/shared';
import Button from '@/components/shared/Button';
import { COLORS, SIZES } from '@/constants/theme';
import { Project, ProjectStatus } from '@/types';
import { BRAND_PURPLE } from '@/constants/authTheme';
import { StatusKey, useDashboardTheme } from '@/constants/dashboardTheme';
import { formatDay } from '@/utils/format';
import { AppHeader } from '@/components/shared/AppHeader';
import { SearchField, FilterPills, Pagination, PageTitle } from '@/components/shared/ListControls';
import { BottomGlow } from '@/components/splash/BottomGlow';

const STATUS_CONFIG: Record<ProjectStatus, { color: string; bg: string; label: string }> = {
  pending: { color: COLORS.warning, bg: COLORS.warningLight, label: 'Pending' },
  incomplete: { color: COLORS.error, bg: COLORS.errorLight, label: 'In Progress' },
  completed: { color: COLORS.success, bg: COLORS.successLight, label: 'Completed' },
};

// ─── Projects List ─────────────────────────────────────────
const PAGE_SIZE = 5;
type StatusFilter = 'all' | 'incomplete' | 'on_hold' | 'completed';

const FILTERS: { label: string; value: StatusFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'In Progress', value: 'incomplete' },
  { label: 'On Hold', value: 'on_hold' },
  { label: 'Completed', value: 'completed' },
];

const ProjectRow = ({ project, onPress, onMenu }: { project: Project; onPress: () => void; onMenu: () => void }) => {
  const theme = useDashboardTheme();
  const key = (['pending', 'incomplete', 'completed', 'on_hold'].includes(project.status as string)
    ? project.status
    : 'pending') as StatusKey;
  const status = theme.status[key];
  const tile = { pending: theme.palette.amber, incomplete: theme.palette.lavender, completed: theme.palette.mint, on_hold: theme.palette.pink }[key];
  const progress = Math.max(0, Math.min(100, Math.round(project.progress ?? 0)));
  const meta = (icon: string, text: string) => (
    <View style={styles.metaRow}>
      <Ionicons name={icon as any} size={12} color={theme.muted} />
      <Text style={[styles.metaText, { color: theme.muted }]} numberOfLines={1}>{text}</Text>
    </View>
  );

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        styles.projCard,
        { backgroundColor: theme.card, borderColor: theme.cardBorder },
        theme.shadow && styles.projShadow,
      ]}
    >
      <View style={[styles.projTile, { backgroundColor: tile.bg }]}>
        <Ionicons name="folder-open-outline" size={18} color={tile.icon} />
      </View>

      <View style={{ flex: 1, gap: 5 }}>
        <Text style={[styles.projName, { color: theme.text }]} numberOfLines={2}>{project.name}</Text>
        {meta('person-outline', project.client_name || 'No client')}
        {meta('people-outline', project.owner_name || '—')}
        {meta('calendar-outline', project.end_date ? `Due: ${formatDay(project.end_date)}` : 'No due date')}
      </View>

      <View style={styles.projRight}>
        <View style={styles.projTop}>
          <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusText, { color: status.fg }]}>{status.label}</Text>
          </View>
          <TouchableOpacity onPress={onMenu} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityLabel="Project actions">
            <Ionicons name="ellipsis-vertical" size={15} color={theme.muted} />
          </TouchableOpacity>
        </View>
        <View style={styles.progressRow}>
          <Text style={[styles.progressPct, { color: theme.muted }]}>{progress}%</Text>
          <View style={[styles.track, { backgroundColor: theme.scheme === 'light' ? '#EFEFEF' : 'rgba(255,255,255,0.14)' }]}>
            <View style={[styles.fill, { width: `${progress}%`, backgroundColor: theme.accent }]} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const ProjectsList = () => {
  const dispatch = useAppDispatch();
  const theme = useDashboardTheme();
  const { projects } = useAppSelector((s) => s.project);
  const { pending } = useAppSelector((s) => s.asyncActions.fetchProjects);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    dispatch(fetchProjects() as any);
  }, []);

  // The projects endpoint returns everything at once, so search, filter and paging happen here.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((p) => {
      if (filter !== 'all' && (p.status as string) !== filter) return false;
      if (!q) return true;
      return [p.name, p.client_name, p.owner_name].some((v) => (v ?? '').toLowerCase().includes(q));
    });
  }, [projects, search, filter]);

  useEffect(() => { setPage(1); }, [search, filter]);
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openMenu = (p: Project) => {
    const buttons: any[] = [{ text: 'View', onPress: () => router.push(`/(app)/projects/${p.id}` as any) }];
    if (p.permissions?.can_edit) {
      buttons.push({ text: 'Edit', onPress: () => router.push(`/(app)/projects/${p.id}/edit` as any) });
    }
    if (p.permissions?.can_delete) {
      buttons.push({
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          Alert.alert('Delete project', `Delete "${p.name}"? This cannot be undone.`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => dispatch(deleteProject(p.id) as any) },
          ]),
      });
    }
    buttons.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert(p.name, undefined, buttons);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar style={theme.statusBar} />
      {theme.glow && <BottomGlow color={BRAND_PURPLE} opacity={0.22} />}
      <FlatList
        data={pageItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.screenList}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={pending} onRefresh={() => dispatch(fetchProjects() as any)} tintColor={BRAND_PURPLE} />
        }
        ListHeaderComponent={
          <View>
            <AppHeader />
            <View style={styles.titleRow}>
              <View style={[styles.titleIcon, { backgroundColor: theme.field }]}>
                <Ionicons name="folder-open-outline" size={20} color={BRAND_PURPLE} />
              </View>
              <View style={{ flex: 1 }}>
                <PageTitle
                  title="Projects"
                  subtitle="View and manage your projects, track progress and stay on top of deadlines."
                />
              </View>
              <TouchableOpacity
                onPress={() => router.push('/(app)/projects/create' as any)}
                activeOpacity={0.85}
                style={styles.newBtn}
              >
                <Ionicons name="add" size={16} color="#FFFFFF" />
                <Text style={styles.newBtnText}>New Project</Text>
              </TouchableOpacity>
            </View>
            <View style={{ marginTop: 16 }}>
              <SearchField value={search} onChangeText={setSearch} placeholder="Search projects by name, client or manager..." />
            </View>
            <View style={{ marginTop: 14, marginBottom: 14 }}>
              <FilterPills options={FILTERS} value={filter} onChange={setFilter} />
            </View>
          </View>
        }
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: theme.muted }]}>
            {pending
              ? 'Loading projects…'
              : projects.length === 0
                ? 'No projects yet. Tap New Project to create your first one.'
                : 'No projects match your search or filter.'}
          </Text>
        }
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => (
          <ProjectRow
            project={item}
            onPress={() => router.push(`/(app)/projects/${item.id}` as any)}
            onMenu={() => openMenu(item)}
          />
        )}
        ListFooterComponent={
          <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onChange={setPage} variant="numbers" />
        }
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
  screenList: { paddingHorizontal: 16, paddingBottom: 28, flexGrow: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 20 },
  titleIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  newBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4, height: 34, paddingHorizontal: 12,
    borderRadius: 10, backgroundColor: BRAND_PURPLE,
  },
  newBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  emptyText: { textAlign: 'center', fontSize: 13, marginTop: 40, paddingHorizontal: 24 },
  projCard: { flexDirection: 'row', gap: 12, borderRadius: 12, borderWidth: 1, padding: 12 },
  projShadow: {
    shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  projTile: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  projName: { fontSize: 12.5, fontWeight: '700' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 10, flexShrink: 1 },
  projRight: { alignItems: 'flex-end', justifyContent: 'space-between', minWidth: 112 },
  projTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusPill: { paddingHorizontal: 10, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statusText: { fontSize: 9.5, fontWeight: '500' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressPct: { fontSize: 9.5, minWidth: 26, textAlign: 'right' },
  track: { width: 62, height: 5, borderRadius: 3, overflow: 'hidden' },
  fill: { height: 5, borderRadius: 3 },
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
