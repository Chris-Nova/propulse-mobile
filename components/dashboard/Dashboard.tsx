import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchProjects } from '@/store/slices/projects';
import { fetchChats } from '@/store/slices/chat';
import { fetchAnalytics } from '@/store/slices/teams';
import { Activity, fetchRecentActivities } from './activities';
import { setActiveChartMonthIndex } from '@/store/reducers/misc';
import { BRAND_PURPLE } from '@/constants/authTheme';
import { CHART, DashboardTheme, useDashboardTheme } from '@/constants/dashboardTheme';
import { BottomGlow } from '@/components/splash/BottomGlow';
import { useMenu } from '@/components/menu/MenuContext';
import { DonutChart } from './DonutChart';
import { MonthlyStatusChart } from './MonthlyStatusChart';

// Section sizes from the design, plus the requested +25pt on both chart sections.
const ALL_PROJECTS_HEIGHT = 100 + 25;
const MONTHLY_STATUS_HEIGHT = 136 + 25;
const MONTHLY_PLOT_HEIGHT = 55 + 25; // the extra 25pt goes to the chart's plot area
// How far the "All Projects" title (and its chevron) sits closer to the card's top border.
// Only the title moves, so the donut and legend stay exactly where they were.
const ALL_PROJECTS_TITLE_LIFT = 6;

// Where "See all" (Quick Actions) and "View all" (Recent Activities) should go.
// No destination screens exist yet, so those links stay hidden until set.
const QUICK_ACTIONS_SEE_ALL_ROUTE: string | undefined = undefined;
const ACTIVITIES_VIEW_ALL_ROUTE: string | undefined = undefined;

const DAY_MS = 24 * 60 * 60 * 1000;
const DUE_SOON_DAYS = 7;

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  if (!isFinite(diff) || diff < 60_000) return 'now';
  const m = Math.floor(diff / 60_000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d < 7 ? `${d}d ago` : `${Math.floor(d / 7)}w ago`;
};

const humanize = (s = '') => {
  const t = s.replace(/[_-]+/g, ' ').trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1).toLowerCase() : 'Activity';
};

const activityStyle = (a: Activity, theme: DashboardTheme) => {
  const kind = `${a.activity_type ?? ''} ${a.type ?? ''}`.toLowerCase();
  if (/member|team|invite|join/.test(kind)) return { icon: 'person-add-outline', tint: theme.activity.green };
  if (/link|share/.test(kind)) return { icon: 'link-outline', tint: theme.activity.blue };
  return { icon: 'document-text-outline', tint: theme.activity.purple };
};

// Initial on a tinted circle, with the photo layered on top. If the photo URL is missing,
// not a full http(s) URL, or fails to load, the initial simply stays visible.
const HeaderAvatar = ({ uri, initial, theme }: { uri?: string; initial: string; theme: DashboardTheme }) => {
  const [failed, setFailed] = useState(false);
  const showPhoto = !!uri && /^https?:\/\//i.test(uri) && !failed;
  return (
    <View style={[styles.avatar, { backgroundColor: theme.avatarBg }]}>
      <Text style={[styles.avatarText, { color: theme.avatarText }]}>{initial}</Text>
      {showPhoto && (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} onError={() => setFailed(true)} />
      )}
    </View>
  );
};

const Card = ({ theme, style, children }: { theme: DashboardTheme; style?: any; children: React.ReactNode }) => (
  <View
    style={[
      styles.card,
      { backgroundColor: theme.card, borderColor: theme.cardBorder },
      theme.shadow && styles.shadow,
      style,
    ]}
  >
    {children}
  </View>
);

const SectionTitle = ({
  title, theme, linkLabel, onPress, style,
}: { title: string; theme: DashboardTheme; linkLabel?: string; onPress?: () => void; style?: any }) => (
  <View style={[styles.sectionRow, style]}>
    <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
    {linkLabel && onPress ? (
      <TouchableOpacity onPress={onPress} style={styles.linkRow}>
        <Text style={styles.linkText}>{linkLabel}</Text>
        <Ionicons name="chevron-forward" size={14} color={BRAND_PURPLE} />
      </TouchableOpacity>
    ) : null}
  </View>
);

export const Dashboard = () => {
  const dispatch = useAppDispatch();
  const theme = useDashboardTheme();
  const insets = useSafeAreaInsets();
  const { openMenu } = useMenu();
  const { user } = useAppSelector((s) => s.account);
  const { projects } = useAppSelector((s) => s.project);
  const { chats } = useAppSelector((s) => s.chat);
  const { analytics, activeChartMonthIndex } = useAppSelector((s) => s.analytics);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    dispatch(fetchProjects() as any);
    dispatch(fetchChats() as any);
    dispatch(fetchAnalytics() as any);
    setActivities(await fetchRecentActivities());
  }, [dispatch]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  // ── Stats ──
  const openProjects = projects.filter((p) => p.status !== 'completed');
  const activeCount = analytics?.active_projects?.value ?? openProjects.length;
  const { dueSoon, delayed } = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    let soon = 0; let late = 0;
    openProjects.forEach((p) => {
      if (!p.end_date) return;
      const end = new Date(p.end_date); end.setHours(0, 0, 0, 0);
      const days = Math.round((end.getTime() - today.getTime()) / DAY_MS);
      if (days < 0) late += 1; else if (days <= DUE_SOON_DAYS) soon += 1;
    });
    return { dueSoon: soon, delayed: late };
  }, [projects]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Charts ──
  const completePct = Math.round((analytics?.all_projects?.average_completion_percentage ?? 0) * 10) / 10;
  const incompletePct = Math.round((100 - completePct) * 10) / 10;
  const monthly: any[] = analytics?.monthly_project_status ?? [];
  const monthIndex = activeChartMonthIndex ?? new Date().getMonth();
  const activeMonth = monthly.find((m) => m.month - 1 === monthIndex) ?? monthly[monthIndex];
  const months = monthly.map((m) => ({ label: m.month_name, value: m.month - 1 }));

  const unread = Object.values(chats).reduce((t, c) => t + (c.unread_count ?? 0), 0);
  const firstName = user?.first_name ?? user?.name?.split(' ')[0] ?? 'there';

  const go = (path: string) => router.push(path as any);

  const tiles = [
    { label: 'New Project', icon: 'add-circle-outline', tint: theme.tiles.project, route: '/(app)/projects/create' },
    { label: 'Invite to Project', icon: 'person-add-outline', tint: theme.tiles.invite, route: '/(app)/teams' },
    { label: 'Messages', icon: 'chatbox-ellipses-outline', tint: theme.tiles.messages, route: '/(app)/messages', badge: unread },
    { label: 'View Reports', icon: 'bar-chart-outline', tint: theme.tiles.reports, route: '/(app)/analytics' },
  ];

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <StatusBar style={theme.statusBar} />
      {theme.glow && <BottomGlow color={BRAND_PURPLE} opacity={0.22} />}
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 14 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND_PURPLE} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={openMenu} activeOpacity={0.7} accessibilityLabel="Open menu">
            <Image source={require('../../assets/splash-logo.png')} style={styles.logo} resizeMode="contain" />
          </TouchableOpacity>
          <View style={styles.headerIcons}>
            <Ionicons name="search-outline" size={22} color={theme.text} />
            <View>
              <Ionicons name="notifications" size={22} color={BRAND_PURPLE} />
              <View style={[styles.bellDot, { borderColor: theme.background }]} />
            </View>
          </View>
        </View>

        {/* Greeting */}
        <View style={styles.greetingRow}>
          <TouchableOpacity onPress={() => go('/(app)/account')} activeOpacity={0.8}>
            <HeaderAvatar
              key={user?.avatar ?? 'no-avatar'}
              uri={user?.avatar}
              initial={firstName.charAt(0).toUpperCase()}
              theme={theme}
            />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.welcome, { color: theme.text }]}>Welcome, {firstName}</Text>
            <Text style={[styles.welcomeSub, { color: theme.text }]}>Stay on top of your projects.</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.stats}>
          <View style={styles.stat}>
            <View style={[styles.statIcon, { backgroundColor: '#A372E7', width: 38, height: 38 }]}>
              <Ionicons name="folder" size={18} color="#FFFFFF" />
            </View>
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.statLabel}>Active Projects</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={styles.statBig}>{activeCount}</Text>
                <TouchableOpacity onPress={() => go('/(app)/projects')} style={styles.statChevron}>
                  <Ionicons name="chevron-forward" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <View style={[styles.statIcon, { backgroundColor: '#9A7192' }]}>
              <Ionicons name="calendar" size={15} color="#FBCD5B" />
            </View>
            <View style={{ marginLeft: 8 }}>
              <Text style={styles.statLabel}>Due Soon</Text>
              <Text style={[styles.statMid, { color: '#FBCD5B' }]}>{dueSoon}</Text>
            </View>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <View style={[styles.statIcon, { backgroundColor: '#E05D73' }]}>
              <Ionicons name="alert" size={16} color="#FFFFFF" />
            </View>
            <View style={{ marginLeft: 8 }}>
              <Text style={styles.statLabel}>Delayed</Text>
              <Text style={[styles.statMid, { color: '#F96166' }]}>{delayed}</Text>
            </View>
          </View>
        </View>

        {/* Quick actions */}
        <View style={{ marginTop: 18 }}>
          <SectionTitle
            title="Quick Actions"
            theme={theme}
            linkLabel="See all"
            onPress={QUICK_ACTIONS_SEE_ALL_ROUTE ? () => go(QUICK_ACTIONS_SEE_ALL_ROUTE) : undefined}
          />
          <View style={styles.tiles}>
            {tiles.map((t) => (
              <TouchableOpacity
                key={t.label}
                onPress={() => go(t.route)}
                activeOpacity={0.8}
                style={[styles.tile, { backgroundColor: t.tint.bg }]}
              >
                <Ionicons name={t.icon as any} size={17} color={t.tint.icon} />
                <Text style={[styles.tileLabel, { color: theme.text }]} numberOfLines={1}>{t.label}</Text>
                {!!t.badge && (
                  <View style={styles.tileBadge}>
                    <Text style={styles.tileBadgeText}>{t.badge > 99 ? '99+' : t.badge}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* All Projects (+25pt) */}
        <Card theme={theme} style={{ height: ALL_PROJECTS_HEIGHT, marginTop: 12 }}>
          <SectionTitle title="All Projects" theme={theme} style={{ top: -ALL_PROJECTS_TITLE_LIFT }} />
          <TouchableOpacity
            onPress={() => go('/(app)/projects')}
            style={[styles.cardChevron, { top: 12 - ALL_PROJECTS_TITLE_LIFT }]}
          >
            <Ionicons name="chevron-forward" size={16} color={BRAND_PURPLE} />
          </TouchableOpacity>
          <View style={styles.donutRow}>
            <DonutChart completePct={completePct} textColor={theme.text} />
            <View style={{ gap: 14 }}>
              <View style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: CHART.legendComplete }]} />
                <Text style={[styles.legendLabel, { color: theme.text }]}>Complete</Text>
                <Text style={[styles.legendValue, { color: theme.text }]}>{completePct}%</Text>
              </View>
              <View style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: CHART.incomplete }]} />
                <Text style={[styles.legendLabel, { color: theme.text }]}>Incomplete</Text>
                <Text style={[styles.legendValue, { color: theme.text }]}>{incompletePct}%</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Monthly Project Status (+25pt) */}
        <Card theme={theme} style={{ minHeight: MONTHLY_STATUS_HEIGHT, marginTop: 12 }}>
          <SectionTitle title="Monthly Project Status" theme={theme} />
          <View style={{ marginTop: 16 }}>
            <MonthlyStatusChart
              weeks={activeMonth?.weeks ?? []}
              monthName={activeMonth?.month_name ?? 'Month'}
              months={months}
              onSelectMonth={(i) => dispatch(setActiveChartMonthIndex(i))}
              theme={theme}
              plotHeight={MONTHLY_PLOT_HEIGHT}
            />
          </View>
        </Card>

        {/* Recent activities */}
        <Card theme={theme} style={{ marginTop: 12 }}>
          <SectionTitle
            title="Recent Activities"
            theme={theme}
            linkLabel="View all"
            onPress={ACTIVITIES_VIEW_ALL_ROUTE ? () => go(ACTIVITIES_VIEW_ALL_ROUTE) : undefined}
          />
          {activities.length === 0 ? (
            <Text style={[styles.empty, { color: theme.muted }]}>Recent activity will show here.</Text>
          ) : (
            activities.slice(0, 3).map((a) => {
              const { icon, tint } = activityStyle(a, theme);
              return (
                <View key={a.id} style={styles.activityRow}>
                  <View style={[styles.activityIcon, { backgroundColor: tint.bg }]}>
                    <Ionicons name={icon as any} size={16} color={tint.icon} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.activityTitle, { color: theme.text }]} numberOfLines={1}>
                      {a.project_name ?? humanize(a.activity_type ?? a.type)}
                    </Text>
                    <Text style={[styles.activityDesc, { color: theme.muted }]} numberOfLines={2}>
                      {a.description}
                    </Text>
                  </View>
                  <Text style={[styles.activityTime, { color: theme.muted }]}>{timeAgo(a.created_at)}</Text>
                </View>
              );
            })
          )}
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 28 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logo: { width: 94, height: 15 },
  headerIcons: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  bellDot: {
    position: 'absolute', top: 0, right: 1, width: 8, height: 8, borderRadius: 4,
    backgroundColor: BRAND_PURPLE, borderWidth: 1.5,
  },
  greetingRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 18 },
  avatar: {
    width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  avatarText: { fontSize: 26, fontWeight: '500' },
  welcome: { fontSize: 17, fontWeight: '700' },
  welcomeSub: { fontSize: 12, marginTop: 2 },
  stats: {
    marginTop: 14, height: 70, borderRadius: 12, backgroundColor: BRAND_PURPLE,
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14,
  },
  stat: { flexDirection: 'row', alignItems: 'center' },
  statDivider: { width: StyleSheet.hairlineWidth, height: 38, backgroundColor: 'rgba(255,255,255,0.45)', marginHorizontal: 12 },
  statIcon: { width: 32, height: 32, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  statLabel: { color: '#FFFFFF', fontSize: 10 },
  statBig: { color: '#FFFFFF', fontSize: 26, fontWeight: '700', lineHeight: 30 },
  statMid: { fontSize: 22, fontWeight: '700', lineHeight: 26 },
  statChevron: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: '#9A7192',
    alignItems: 'center', justifyContent: 'center',
  },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '700' },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  linkText: { color: BRAND_PURPLE, fontSize: 13, fontWeight: '700' },
  tiles: { flexDirection: 'row', gap: 10, marginTop: 10 },
  tile: {
    flex: 1, height: 60, borderRadius: 10, alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingHorizontal: 4,
  },
  tileLabel: { fontSize: 10 },
  tileBadge: {
    position: 'absolute', top: 4, right: 6, minWidth: 16, height: 16, borderRadius: 8,
    paddingHorizontal: 4, backgroundColor: '#E33629', alignItems: 'center', justifyContent: 'center',
  },
  tileBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '700' },
  card: { borderRadius: 12, borderWidth: 1, padding: 14 },
  shadow: {
    shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  cardChevron: { position: 'absolute', top: 12, right: 14 },
  donutRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 24, paddingLeft: 12, paddingTop: 6 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 9, height: 9, borderRadius: 5 },
  legendLabel: { fontSize: 11, width: 66 },
  legendValue: { fontSize: 11 },
  empty: { fontSize: 12, marginTop: 14, marginBottom: 6 },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14 },
  activityIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  activityTitle: { fontSize: 12, fontWeight: '700' },
  activityDesc: { fontSize: 10, marginTop: 1 },
  activityTime: { fontSize: 10, alignSelf: 'flex-start', marginTop: 4 },
});
