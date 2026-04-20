import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchProjects } from '@/store/slices/projects';
import { fetchTeamMembers } from '@/store/slices/teams';
import { fetchChats } from '@/store/slices/chat';
import { Card, SectionHeader, Badge, Loader } from '@/components/shared';
import { COLORS, SIZES } from '@/constants/theme';
import { ProjectStatus } from '@/types';

const STATUS_CONFIG: Record<ProjectStatus, { color: string; label: string }> = {
  pending: { color: COLORS.warning, label: 'Pending' },
  incomplete: { color: COLORS.primary, label: 'In Progress' },
  completed: { color: COLORS.success, label: 'Completed' },
};

const QuickAction = ({
  icon, label, onPress, color = COLORS.primary
}: { icon: any; label: string; onPress: () => void; color?: string }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.quickAction}>
    <View style={[styles.quickActionIcon, { backgroundColor: color + '22' }]}>
      <Ionicons name={icon} size={22} color={color} />
    </View>
    <Text style={styles.quickActionLabel}>{label}</Text>
  </TouchableOpacity>
);

export const Dashboard = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.account);
  const { projects } = useAppSelector((s) => s.project);
  const { members } = useAppSelector((s) => s.team);
  const { chats } = useAppSelector((s) => s.chat);
  const { subscription } = useAppSelector((s) => s.account);
  const { pending } = useAppSelector((s) => s.asyncActions.fetchProjects);
  const unreadCount = Object.values(chats).filter(
    (c) => c.last_message && c.last_message.status !== 'read'
  ).length;

  useEffect(() => {
    dispatch(fetchProjects() as any);
    dispatch(fetchTeamMembers() as any);
    dispatch(fetchChats() as any);
  }, []);

  const activeProjects = projects.filter((p) => p.status !== 'completed');
  const completedProjects = projects.filter((p) => p.status === 'completed');
  const chatList = Object.values(chats);

  const greetingHour = new Date().getHours();
  const greeting =
    greetingHour < 12 ? 'Good morning' :
    greetingHour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting},</Text>
          <Text style={styles.userName}>{user?.first_name ?? user?.name?.split(' ')[0] ?? 'there'} 👋</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => router.push('/(app)/messages')}
            style={styles.msgIconBtn}
          >
            <Ionicons name="chatbubble-outline" size={22} color={COLORS.textPrimary} />
            {unreadCount > 0 && (
              <View style={styles.msgBadge}>
                <Text style={styles.msgBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.subBadge}>
            <Text style={[styles.subText, { color: subscription.status === 'active' ? COLORS.success : COLORS.warning }]}>
              {subscription.plan?.display_name ?? 'Free'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(app)/account')}
            style={styles.avatarBtn}
          >
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {(user?.name ?? user?.first_name ?? 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* KPI Row */}
      <View style={styles.kpiRow}>
        {[
          { label: 'Projects', value: projects.length, icon: 'folder', color: COLORS.primary },
          { label: 'Active', value: activeProjects.length, icon: 'play-circle', color: COLORS.warning },
          { label: 'Completed', value: completedProjects.length, icon: 'checkmark-circle', color: COLORS.success },
          { label: 'Members', value: members.length, icon: 'people', color: COLORS.info },
        ].map((kpi, i) => (
          <Card key={i} style={styles.kpiCard}>
            <Ionicons name={kpi.icon as any} size={20} color={kpi.color} />
            <Text style={styles.kpiValue}>{kpi.value}</Text>
            <Text style={styles.kpiLabel}>{kpi.label}</Text>
          </Card>
        ))}
      </View>

      {/* Quick Actions */}
      <Card style={styles.quickActionsCard}>
        <SectionHeader title="Quick Actions" />
        <View style={styles.quickActionsGrid}>
          <QuickAction
            icon="add-circle-outline"
            label="New Project"
            onPress={() => router.push('/(app)/projects/create')}
            color={COLORS.primary}
          />
          <QuickAction
            icon="person-add-outline"
            label="Invite Member"
            onPress={() => router.push('/(app)/teams')}
            color={COLORS.success}
          />
          <QuickAction
            icon="chatbubble-outline"
            label="Messages"
            onPress={() => router.push('/(app)/messages')}
            color={COLORS.warning}
          />
          <QuickAction
            icon="bar-chart-outline"
            label="Analytics"
            onPress={() => router.push('/(app)/analytics')}
            color={COLORS.info}
          />
        </View>
      </Card>

      {/* Recent Projects */}
      <View>
        <SectionHeader
          title="Recent Projects"
          action={
            <TouchableOpacity onPress={() => router.push('/(app)/projects')}>
              <Text style={styles.seeAll}>See all →</Text>
            </TouchableOpacity>
          }
        />
        {pending && !projects.length ? (
          <Loader pending><Text /></Loader>
        ) : projects.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="folder-open-outline" size={32} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No projects yet</Text>
          </Card>
        ) : (
          projects.slice(0, 3).map((project) => {
            const status = STATUS_CONFIG[project.status];
            return (
              <TouchableOpacity
                key={project.id}
                onPress={() => router.push(`/(app)/projects/${project.id}`)}
                activeOpacity={0.8}
              >
                <Card style={styles.projectRow}>
                  <View style={[styles.projectColorDot, { backgroundColor: status.color }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.projectName} numberOfLines={1}>{project.name}</Text>
                    <Text style={styles.projectMeta}>{project.milestones?.length ?? 0} milestones</Text>
                  </View>
                  <View style={styles.projectRight}>
                    <Text style={[styles.projectProgress, { color: status.color }]}>
                      {project.progress}%
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })
        )}
      </View>

      {/* Recent Messages */}
      {chatList.length > 0 && (
        <View>
          <SectionHeader
            title="Recent Messages"
            action={
              <TouchableOpacity onPress={() => router.push('/(app)/messages')}>
                <Text style={styles.seeAll}>See all →</Text>
              </TouchableOpacity>
            }
          />
          {chatList.slice(0, 3).map((chat) => {
            const lastMsg = chat.last_message;
            const name = chat.room?.name ?? chat.participants?.[0]?.name ?? 'Chat';
            return (
              <TouchableOpacity
                key={chat.id}
                onPress={() => router.push(`/(app)/messages/${chat.id}`)}
                activeOpacity={0.8}
              >
                <Card style={styles.chatRow}>
                  <View style={styles.chatAvatar}>
                    <Text style={styles.chatAvatarText}>{name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.chatName} numberOfLines={1}>{name}</Text>
                    <Text style={styles.chatLastMsg} numberOfLines={1}>
                      {lastMsg?.text ?? 'No messages'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
                </Card>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: SIZES.md, gap: SIZES.lg, paddingBottom: SIZES.xl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: { color: COLORS.textSecondary, fontSize: SIZES.body },
  userName: { color: COLORS.textPrimary, fontSize: SIZES.heading, fontWeight: '700' },
  subBadge: {
    backgroundColor: COLORS.surfaceElevated,
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radiusFull,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  subText: { fontSize: SIZES.caption, fontWeight: '600' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: SIZES.sm },
  msgIconBtn: { position: 'relative', padding: SIZES.xs },
  msgBadge: {
    position: 'absolute', top: 0, right: 0,
    minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: COLORS.error,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
  },
  msgBadgeText: { color: COLORS.white, fontSize: 9, fontWeight: '700' },
  avatarBtn: { padding: 2 },
  avatarCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: COLORS.white, fontSize: SIZES.small, fontWeight: '700' },
  kpiRow: { flexDirection: 'row', gap: SIZES.sm },
  kpiCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    padding: SIZES.sm,
  },
  kpiValue: { color: COLORS.textPrimary, fontSize: SIZES.title, fontWeight: '700' },
  kpiLabel: { color: COLORS.textMuted, fontSize: SIZES.caption },
  quickActionsCard: { gap: 0 },
  quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.sm, marginTop: SIZES.xs },
  quickAction: { width: '47%', alignItems: 'center', gap: SIZES.xs, paddingVertical: SIZES.sm },
  quickActionIcon: {
    width: 52, height: 52, borderRadius: SIZES.radiusMd,
    alignItems: 'center', justifyContent: 'center',
  },
  quickActionLabel: { color: COLORS.textSecondary, fontSize: SIZES.small, textAlign: 'center' },
  seeAll: { color: COLORS.primary, fontSize: SIZES.small, fontWeight: '600' },
  emptyCard: { alignItems: 'center', gap: SIZES.sm, paddingVertical: SIZES.xl },
  emptyText: { color: COLORS.textMuted, fontSize: SIZES.body },
  projectRow: { flexDirection: 'row', alignItems: 'center', gap: SIZES.sm, marginBottom: SIZES.xs },
  projectColorDot: { width: 10, height: 10, borderRadius: 5 },
  projectName: { color: COLORS.textPrimary, fontSize: SIZES.body, fontWeight: '600' },
  projectMeta: { color: COLORS.textMuted, fontSize: SIZES.caption },
  projectRight: { flexDirection: 'row', alignItems: 'center', gap: SIZES.xs },
  projectProgress: { fontSize: SIZES.small, fontWeight: '700' },
  chatRow: { flexDirection: 'row', alignItems: 'center', gap: SIZES.sm, marginBottom: SIZES.xs },
  chatAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.primaryDark,
    alignItems: 'center', justifyContent: 'center',
  },
  chatAvatarText: { color: COLORS.white, fontSize: SIZES.body, fontWeight: '700' },
  chatName: { color: COLORS.textPrimary, fontSize: SIZES.body, fontWeight: '600' },
  chatLastMsg: { color: COLORS.textMuted, fontSize: SIZES.caption },
});
