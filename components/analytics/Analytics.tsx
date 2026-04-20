import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchAnalytics } from '@/store/slices/teams';
import { Card, Loader, SectionHeader } from '@/components/shared';
import { COLORS, SIZES } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

const SCREEN_WIDTH = Dimensions.get('window').width - SIZES.md * 2;

const chartConfig = {
  backgroundColor: COLORS.card,
  backgroundGradientFrom: COLORS.card,
  backgroundGradientTo: COLORS.card,
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
  labelColor: () => COLORS.textSecondary,
  propsForLabels: { fontSize: 10 },
};

// ─── Stat Card ─────────────────────────────────────────────
const StatCard = ({
  label, value, icon, change, color = COLORS.primary
}: { label: string; value: number | string; icon: any; change?: number; color?: string }) => (
  <Card style={styles.statCard}>
    <View style={[styles.statIcon, { backgroundColor: color + '22' }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
    {change !== undefined && (
      <Text style={[styles.statChange, { color: change >= 0 ? COLORS.success : COLORS.error }]}>
        {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
      </Text>
    )}
  </Card>
);

// ─── Analytics Screen ──────────────────────────────────────
export const Analytics = () => {
  const dispatch = useAppDispatch();
  const { analytics } = useAppSelector((s) => s.analytics);
  const { pending } = useAppSelector((s) => s.asyncActions.fetchAnalytics);

  useEffect(() => {
    dispatch(fetchAnalytics() as any);
  }, []);

  if (pending && !analytics?.active_projects) return <Loader pending fullScreen />;

  const a = analytics;

  // Monthly chart data
  const monthlyData = a?.monthly_project_status?.slice(-6) ?? [];
  const barLabels = monthlyData.map((m: any) => m.month_name?.slice(0, 3) ?? '');
  const completedData = monthlyData.map((m: any) =>
    m.weeks?.reduce((acc: number, w: any) => acc + (w.completed ?? 0), 0) ?? 0
  );

  // Pie chart
  const pieData = a?.all_projects ? [
    {
      name: 'Completed',
      population: a.all_projects.completed,
      color: COLORS.success,
      legendFontColor: COLORS.textSecondary,
      legendFontSize: 12,
    },
    {
      name: 'In Progress',
      population: a.all_projects.incomplete,
      color: COLORS.warning,
      legendFontColor: COLORS.textSecondary,
      legendFontSize: 12,
    },
  ].filter((d) => d.population > 0) : [];

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <SectionHeader title="Analytics" />

      {/* KPI Stats */}
      <View style={styles.statsGrid}>
        <StatCard
          label="Active Projects"
          value={a?.active_projects?.value ?? 0}
          icon="folder-outline"
          change={a?.active_projects?.rate}
          color={COLORS.primary}
        />
        <StatCard
          label="Team Members"
          value={a?.team_members?.value ?? 0}
          icon="people-outline"
          color={COLORS.success}
        />
        <StatCard
          label="Milestones Done"
          value={a?.completed_milestones?.value ?? 0}
          icon="checkmark-circle-outline"
          change={a?.completed_milestones?.rate}
          color={COLORS.warning}
        />
        <StatCard
          label="Overdue Tasks"
          value={a?.overdue_tasks?.value ?? 0}
          icon="alert-circle-outline"
          color={COLORS.error}
        />
      </View>

      {/* Monthly Bar Chart */}
      {barLabels.length > 0 && (
        <Card style={styles.chartCard}>
          <Text style={styles.chartTitle}>Monthly Completed Projects</Text>
          <BarChart
            data={{ labels: barLabels, datasets: [{ data: completedData.length ? completedData : [0] }] }}
            width={SCREEN_WIDTH - SIZES.md * 2}
            height={200}
            chartConfig={chartConfig}
            style={styles.chart}
            showValuesOnTopOfBars
            fromZero
            yAxisLabel=""
            yAxisSuffix=""
          />
        </Card>
      )}

      {/* Pie Chart */}
      {pieData.length > 0 && (
        <Card style={styles.chartCard}>
          <Text style={styles.chartTitle}>Project Status Overview</Text>
          <PieChart
            data={pieData}
            width={SCREEN_WIDTH - SIZES.md * 2}
            height={180}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
          <View style={styles.pieSummary}>
            <Text style={styles.pieSummaryText}>
              Total: {a?.all_projects?.total ?? 0} projects
            </Text>
            <Text style={styles.pieSummaryText}>
              Avg Completion: {a?.all_projects?.average_completion_percentage ?? 0}%
            </Text>
          </View>
        </Card>
      )}

      {/* Team Performance */}
      {a?.team_performance?.leaderboard?.length > 0 && (
        <Card style={styles.chartCard}>
          <Text style={styles.chartTitle}>Team Leaderboard</Text>
          {a.team_performance.leaderboard.slice(0, 5).map((entry: any, i: number) => (
            <View key={i} style={styles.leaderboardItem}>
              <View style={styles.leaderboardRank}>
                <Text style={styles.rankText}>{i + 1}</Text>
              </View>
              <Text style={styles.leaderboardName}>{entry.name}</Text>
              <View style={styles.leaderboardBarTrack}>
                <View
                  style={[styles.leaderboardBarFill, { width: `${entry.progress}%` as any }]}
                />
              </View>
              <Text style={styles.leaderboardPct}>{entry.progress}%</Text>
            </View>
          ))}
        </Card>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: SIZES.md, gap: SIZES.md },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.sm,
  },
  statCard: {
    width: (SCREEN_WIDTH - SIZES.sm) / 2,
    alignItems: 'flex-start',
    gap: SIZES.xs,
  },
  statIcon: {
    width: 40, height: 40, borderRadius: SIZES.radiusMd,
    alignItems: 'center', justifyContent: 'center',
  },
  statValue: { color: COLORS.textPrimary, fontSize: SIZES.heading, fontWeight: '700' },
  statLabel: { color: COLORS.textSecondary, fontSize: SIZES.caption },
  statChange: { fontSize: SIZES.caption, fontWeight: '600' },
  chartCard: { overflow: 'hidden' },
  chartTitle: {
    color: COLORS.textPrimary,
    fontSize: SIZES.subtitle,
    fontWeight: '600',
    marginBottom: SIZES.md,
  },
  chart: { borderRadius: SIZES.radiusMd },
  pieSummary: { flexDirection: 'row', justifyContent: 'space-around', marginTop: SIZES.sm },
  pieSummaryText: { color: COLORS.textSecondary, fontSize: SIZES.small },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.sm,
    gap: SIZES.sm,
  },
  leaderboardRank: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center', justifyContent: 'center',
  },
  rankText: { color: COLORS.textSecondary, fontSize: SIZES.caption, fontWeight: '700' },
  leaderboardName: { color: COLORS.textPrimary, fontSize: SIZES.small, width: 80 },
  leaderboardBarTrack: {
    flex: 1, height: 8, backgroundColor: COLORS.border,
    borderRadius: SIZES.radiusFull, overflow: 'hidden',
  },
  leaderboardBarFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: SIZES.radiusFull },
  leaderboardPct: { color: COLORS.textSecondary, fontSize: SIZES.caption, width: 36, textAlign: 'right' },
});
