import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal, Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Line, Polyline, Circle } from 'react-native-svg';
import { Fetch } from '@/utils/api';
import { BRAND_PURPLE } from '@/constants/authTheme';
import { DashboardTheme, Tint, useDashboardTheme } from '@/constants/dashboardTheme';
import { initialOf } from '@/utils/format';
import { AppHeader } from '@/components/shared/AppHeader';
import { DateField } from '@/components/shared/DateField';
import { ThemedStatusBar } from '@/components/shared/ThemedStatusBar';
import { BottomGlow } from '@/components/splash/BottomGlow';

const WINDOW_DAYS = 30; // the backend's default analysis window (ANALYTICS_WINDOW_DAYS)

const pad = (n: number) => String(n).padStart(2, '0');
const toIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return toIso(d); };

interface Range { start: string; end: string }

// ── Stat card ──
type Tone = 'good' | 'bad';
const StatCard = ({
  label, value, rate, upIs, icon, tint, theme, onPress,
}: {
  label: string; value: string; rate?: number; upIs: Tone;
  icon: React.ComponentProps<typeof Ionicons>['name']; tint: Tint; theme: DashboardTheme; onPress: () => void;
}) => {
  const r = rate ?? 0;
  const up = r > 0;
  const down = r < 0;
  // "good" colors the arrow green when the number going up is a good thing (and red when down);
  // for overdue tasks it's the other way round.
  const positive = (up && upIs === 'good') || (down && upIs === 'bad');
  const color = r === 0 ? theme.muted : positive ? '#1BC282' : '#E33629';
  const arrow = r === 0 ? 'remove' : up ? 'trending-up' : 'trending-down';
  const text = `${r > 0 ? '+' : ''}${Math.round(r * 10) / 10}%`;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }, theme.shadow && styles.shadow]}
    >
      <View style={[styles.statTile, { backgroundColor: tint.bg }]}>
        <Ionicons name={icon} size={17} color={tint.icon} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.statLabel, { color: theme.muted }]} numberOfLines={1}>{label}</Text>
        <Text style={[styles.statValue, { color: theme.text }]} numberOfLines={1}>{value}</Text>
        <View style={styles.deltaRow}>
          <Ionicons name={arrow as any} size={11} color={color} />
          <Text style={[styles.deltaText, { color }]}>{text}</Text>
          <Text style={[styles.deltaSub, { color: theme.muted }]} numberOfLines={1}>vs last period</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={13} color={theme.muted} style={styles.statChevron} />
    </TouchableOpacity>
  );
};

// ── Weekly milestone completion line ──
const WeeklyLine = ({ points, width, theme }: { points: number[]; width: number; theme: DashboardTheme }) => {
  const h = 56;
  const inset = 8;
  const max = Math.max(10, ...points); // keeps an all-zero month flat along the bottom
  const xs = points.map((_, i) => inset + (i * (width - inset * 2)) / Math.max(1, points.length - 1));
  const ys = points.map((v) => h - 8 - (v / max) * (h - 18));
  return (
    <Svg width={width} height={h}>
      <Line x1={0} y1={4} x2={width} y2={4} stroke={theme.divider} strokeWidth={StyleSheet.hairlineWidth} />
      <Polyline points={xs.map((x, i) => `${x},${ys[i]}`).join(' ')} fill="none" stroke={BRAND_PURPLE} strokeWidth={1.5} />
      {xs.map((x, i) => <Circle key={i} cx={x} cy={ys[i]} r={3} fill={BRAND_PURPLE} />)}
    </Svg>
  );
};

export const Analytics = () => {
  const theme = useDashboardTheme();
  const defaultRange = useMemo<Range>(() => ({ start: daysAgo(WINDOW_DAYS), end: toIso(new Date()) }), []);
  const [range, setRange] = useState<Range>(defaultRange);
  const [draft, setDraft] = useState<Range>(defaultRange);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [chartWidth, setChartWidth] = useState(0);
  const isDefault = range.start === defaultRange.start && range.end === defaultRange.end;

  // Kept local on purpose: the shared analytics state also feeds the Home dashboard, and a
  // custom date range here should not change the numbers shown there.
  const load = useCallback(async (r: Range) => {
    setLoading(true);
    setError('');
    const { success, data: payload, message } = await Fetch({
      path: `/analytics/dashboard?start_date=${r.start}&end_date=${r.end}`,
    });
    if (success && payload) setData(payload);
    else setError(message || 'Could not load analytics.');
    setLoading(false);
  }, []);

  useEffect(() => { load(range); }, [range, load]);

  const m = (key: string) => data?.[key] ?? { value: 0, rate: 0 };
  const completion = data?.team_performance?.milestone_completion;
  const leaderboard: { name: string; progress: number }[] = data?.team_performance?.leaderboard ?? [];
  const weekly: number[][] = completion?.weekly_history ?? [];
  const weekPoints = weekly.length
    ? weekly.map((week) => (week.length ? week.reduce((a, b) => a + b, 0) / week.length : 0))
    : [0, 0, 0, 0];
  const summary = Math.round((completion?.summary ?? 0) * 10) / 10;
  const compRate = completion?.rate ?? 0;
  const compColor = compRate === 0 ? theme.muted : compRate > 0 ? '#1BC282' : '#E33629';

  const avgDays = Math.round((m('average_completion_time').value ?? 0) * 10) / 10;
  const openProjects = () => router.push('/(app)/projects' as any);

  const applyRange = () => {
    if (draft.end < draft.start) return;
    setRange(draft);
    setPickerOpen(false);
  };

  const card = [styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }, theme.shadow && styles.shadow];

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ThemedStatusBar style={theme.statusBar} />
      {theme.glow && <BottomGlow color={BRAND_PURPLE} opacity={0.22} />}
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => load(range)} tintColor={BRAND_PURPLE} />}
      >
        <AppHeader />

        {/* Title + date range */}
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.text, fontSize: 24, fontWeight: '700' }}>Analytics</Text>
            <Text style={{ color: theme.text, fontSize: 9.5, marginTop: 4, maxWidth: 170 }}>
              Track your project performance and key metrics at a glance.
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => { setDraft(range); setPickerOpen(true); }}
            activeOpacity={0.8}
            style={[styles.rangePill, { backgroundColor: theme.card, borderColor: theme.cardBorder }, theme.shadow && styles.shadow]}
            accessibilityLabel="Change date range"
          >
            <Ionicons name="calendar-outline" size={14} color={theme.text} />
            <Text style={[styles.rangeText, { color: theme.text }]}>{range.start}</Text>
            <Ionicons name="arrow-forward" size={11} color={theme.text} />
            <Text style={[styles.rangeText, { color: theme.text }]}>{range.end}</Text>
            <Ionicons name="chevron-down" size={12} color={theme.text} />
          </TouchableOpacity>
        </View>

        {!!error && <Text style={styles.error}>{error}</Text>}

        {/* Overview */}
        <View style={[styles.grid, loading && !data && { opacity: 0.6 }]}>
          <StatCard label="Active Projects" value={String(m('active_projects').value ?? 0)} rate={m('active_projects').rate}
            upIs="good" icon="folder-outline" tint={{ bg: theme.scheme === 'light' ? '#EBE6F3' : theme.palette.lavender.bg, icon: theme.scheme === 'light' ? '#6B5B95' : theme.palette.lavender.icon }}
            theme={theme} onPress={openProjects} />
          <StatCard label="Completed Milestones" value={String(m('completed_milestones').value ?? 0)} rate={m('completed_milestones').rate}
            upIs="good" icon="checkmark-circle-outline" tint={theme.palette.mint} theme={theme} onPress={openProjects} />
          <StatCard label="Overdue Tasks" value={String(m('overdue_tasks').value ?? 0)} rate={m('overdue_tasks').rate}
            upIs="bad" icon="time-outline" tint={theme.palette.pink} theme={theme} onPress={openProjects} />
          <StatCard label="Average Completion Time" value={`${avgDays} ${avgDays === 1 ? 'day' : 'days'}`} rate={m('average_completion_time').rate}
            upIs="good" icon="calendar-outline" tint={{ bg: theme.scheme === 'light' ? '#EEEFFF' : theme.palette.blue.bg, icon: theme.accent }}
            theme={theme} onPress={openProjects} />
        </View>

        {/* Top team members */}
        <View style={[card, { marginTop: 22, padding: 16 }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Top Team Members Performance</Text>
          <View style={{ marginTop: 14, gap: 14 }}>
            {leaderboard.length === 0 ? (
              <Text style={{ color: theme.muted, fontSize: 12 }}>
                {loading ? 'Loading…' : 'Team performance will appear here once tasks are completed.'}
              </Text>
            ) : (
              leaderboard.map((p) => {
                const pct = Math.max(0, Math.min(100, Math.round(p.progress ?? 0)));
                return (
                  <View key={p.name} style={styles.perfRow}>
                    <View style={[styles.perfAvatar, { backgroundColor: theme.palette.lavender.bg }]}>
                      <Text style={{ color: theme.scheme === 'light' ? '#815DB3' : theme.palette.lavender.icon, fontSize: 11, fontWeight: '600' }}>
                        {initialOf(p.name)}
                      </Text>
                    </View>
                    <Text style={[styles.perfName, { color: theme.text }]} numberOfLines={1}>{p.name}</Text>
                    <View style={[styles.track, { backgroundColor: theme.scheme === 'light' ? '#EFEFEF' : 'rgba(255,255,255,0.14)' }]}>
                      <View style={[styles.fill, { width: `${pct}%` }]} />
                    </View>
                    <Text style={[styles.perfPct, { color: theme.muted }]}>{pct}% completion</Text>
                  </View>
                );
              })
            )}
          </View>
        </View>

        {/* Milestone completion + encouragement */}
        <View style={styles.bottomRow}>
          <View style={[card, { flex: 1.45, padding: 14 }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Milestone Completion</Text>
            <Text style={[styles.bigPct, { color: theme.text }]}>{summary}%</Text>
            <View style={styles.periodRow}>
              <Text style={{ color: theme.muted, fontSize: 9.5 }}>{isDefault ? 'Last 30 Days' : 'Selected period'}</Text>
              <Text style={{ color: compColor, fontSize: 9.5, fontWeight: '600' }}>
                {compRate > 0 ? '+' : ''}{Math.round(compRate * 10) / 10}%
              </Text>
            </View>
            <View onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)} style={{ marginTop: 10 }}>
              {chartWidth > 0 && <WeeklyLine points={weekPoints} width={chartWidth} theme={theme} />}
              <View style={styles.weekLabels}>
                {weekPoints.map((_, i) => (
                  <View key={i} style={styles.weekLabel}>
                    <View style={styles.weekDot} />
                    <Text style={{ color: theme.muted, fontSize: 8.5 }}>Week {i + 1}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View style={[card, { flex: 1, padding: 14, alignItems: 'center', justifyContent: 'center' }]}>
            <View style={[styles.goalCircle, { backgroundColor: theme.palette.lavender.bg }]}>
              <MaterialCommunityIcons name="bullseye-arrow" size={26} color={theme.scheme === 'light' ? BRAND_PURPLE : theme.tabBar.active} />
            </View>
            <Text style={[styles.cardTitle, { color: theme.text, marginTop: 12, alignSelf: 'flex-start' }]}>Keep going!</Text>
            <Text style={{ color: theme.muted, fontSize: 9.5, lineHeight: 13, marginTop: 5, alignSelf: 'flex-start' }}>
              You're making progress. Stay consistent.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Date range picker */}
      <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setPickerOpen(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: theme.sheet, borderColor: theme.cardBorder }]}>
            <Text style={{ color: theme.text, fontSize: 16, fontWeight: '700', marginBottom: 14 }}>Date range</Text>
            <Text style={[styles.pickLabel, { color: theme.muted }]}>From</Text>
            <DateField value={draft.start} onChange={(iso) => setDraft((d) => ({ start: iso, end: d.end < iso ? iso : d.end }))} maxDate={toIso(new Date())} />
            <Text style={[styles.pickLabel, { color: theme.muted, marginTop: 14 }]}>To</Text>
            <DateField value={draft.end} onChange={(iso) => setDraft((d) => ({ ...d, end: iso }))} minDate={draft.start} maxDate={toIso(new Date())} />
            <View style={styles.pickButtons}>
              <TouchableOpacity onPress={() => setDraft(defaultRange)} style={[styles.pickBtn, styles.pickOutline]}>
                <Text style={{ color: BRAND_PURPLE, fontWeight: '600', fontSize: 14 }}>Last 30 days</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={applyRange} style={[styles.pickBtn, { backgroundColor: BRAND_PURPLE }]}>
                <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 14 }}>Apply</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 32 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 20 },
  rangePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6, height: 32, paddingHorizontal: 10,
    borderRadius: 10, borderWidth: 1, marginTop: 2,
  },
  rangeText: { fontSize: 9.5 },
  error: { color: '#EF4444', fontSize: 12, marginTop: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 18 },
  card: { borderRadius: 12, borderWidth: 1 },
  shadow: {
    shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  statCard: {
    width: '48.4%', flexDirection: 'row', gap: 10, borderRadius: 12, borderWidth: 1, padding: 12, minHeight: 82,
  },
  statTile: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  statChevron: { position: 'absolute', top: 12, right: 10 },
  statLabel: { fontSize: 9.5, paddingRight: 14 },
  statValue: { fontSize: 24, fontWeight: '700', marginTop: 2 },
  deltaRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  deltaText: { fontSize: 8.5, fontWeight: '700' },
  deltaSub: { fontSize: 8.5, flexShrink: 1 },
  cardTitle: { fontSize: 14, fontWeight: '700' },
  perfRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  perfAvatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  perfName: { width: 96, fontSize: 11.5, fontWeight: '600' },
  track: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4, backgroundColor: BRAND_PURPLE },
  perfPct: { fontSize: 8.5, width: 66, textAlign: 'right' },
  bottomRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
  bigPct: { fontSize: 22, fontWeight: '700', marginTop: 10 },
  periodRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  weekLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  weekLabel: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  weekDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#F96166' },
  goalCircle: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
  sheet: { borderRadius: 14, borderWidth: 1, padding: 18 },
  pickLabel: { fontSize: 11, marginBottom: 6 },
  pickButtons: { flexDirection: 'row', gap: 12, marginTop: 22 },
  pickBtn: { flex: 1, height: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  pickOutline: { borderWidth: 1.5, borderColor: BRAND_PURPLE },
});
