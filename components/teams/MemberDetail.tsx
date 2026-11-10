import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Alert, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  deleteTeamMember, fetchMemberActivities, fetchTeamMember, updateTeamMemberRole,
} from '@/store/slices/teams';
import { Activity } from '@/components/dashboard/activities';
import { MemberRoles } from '@/types';
import { BRAND_PURPLE } from '@/constants/authTheme';
import { formatLong, timeAgo } from '@/utils/format';
import { GradientAvatar } from '@/components/shared/GradientAvatar';
import { SettingsShell } from '@/components/settings/SettingsShell';
import { Card, DANGER, Gap, SectionTitle, useSettingsTheme } from '@/components/settings/parts';
import { LoadError } from '@/components/messages/ChatStates';

const ROLES: { value: MemberRoles; label: string; hint: string }[] = [
  { value: MemberRoles.ADMIN, label: 'Admin', hint: 'Full access' },
  { value: MemberRoles.COLLABORATOR, label: 'Collaborator', hint: 'Works on projects' },
  { value: MemberRoles.CLIENT, label: 'Client', hint: 'Views progress' },
];

const DetailRow = ({ label, value, first }: { label: string; value?: string; first?: boolean }) => {
  const { theme } = useSettingsTheme();
  return (
    <View style={[styles.detailRow, !first && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.divider }]}>
      <Text style={[styles.detailLabel, { color: theme.muted }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: theme.text }]} numberOfLines={1}>{value || '—'}</Text>
    </View>
  );
};

// A person in your team directory: details, role (editable if you manage them), recent
// activity, and removal. Mirrors the web member page.
export const MemberDetail = ({ memberId }: { memberId: string }) => {
  const dispatch = useAppDispatch();
  const { theme, accent, light } = useSettingsTheme();
  const member = useAppSelector((s) => s.team.member);
  const { pending: saving } = useAppSelector((s) => s.asyncActions.updateTeamMember);
  const { pending: removing } = useAppSelector((s) => s.asyncActions.deleteTeamMember);

  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [role, setRole] = useState<MemberRoles | undefined>(undefined);
  const [activities, setActivities] = useState<Activity[] | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    const ok = await dispatch(fetchTeamMember(memberId) as any);
    if (!ok) setFailed(true);
    setLoading(false);
  }, [memberId, dispatch]);

  useEffect(() => {
    load();
  }, [load]);

  // Follow the loaded member: start the role picker on their role, then fetch their activity
  const current = member?.id === memberId ? member : undefined;
  useEffect(() => {
    setRole(current?.role);
    setActivities(null);
    if (current?.user_id) {
      dispatch(fetchMemberActivities(current.user_id) as any).then((list: Activity[]) => setActivities(list));
    }
  }, [current?.id, current?.user_id]);

  const name = current?.user_name ?? '';
  const [first, ...rest] = name.trim().split(/\s+/);
  const canManage = !!current?.is_owner;
  const roleChanged = !!role && role !== current?.role;

  const save = () => {
    if (current && role && roleChanged) dispatch(updateTeamMemberRole(current.id, role) as any);
  };

  const remove = () => {
    if (!current) return;
    Alert.alert(
      'Remove from team',
      `Remove ${current.user_name || current.user_email} from your team? They will be removed from all projects you own, and pending invites to them will be cleared.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const ok = await dispatch(deleteTeamMember(current.id) as any);
            if (ok) router.back();
          },
        },
      ]
    );
  };

  let body: React.ReactNode;
  if (loading && !current) {
    body = <ActivityIndicator style={{ marginTop: 60 }} color={BRAND_PURPLE} />;
  } else if (failed || !current) {
    body = (
      <LoadError
        onRetry={load}
        message="We couldn't find this team member. They may have been removed. Please try again."
      />
    );
  } else {
    body = (
      <>
        <View style={styles.hero}>
          <GradientAvatar initial={(first?.charAt(0) || '?').toUpperCase()} size={76} fontSize={30} />
          <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>{current.user_name}</Text>
          <Text style={[styles.email, { color: theme.muted }]} numberOfLines={1}>{current.user_email}</Text>
          <View style={[styles.rolePill, { backgroundColor: theme.palette.lavender.bg }]}>
            <Text style={[styles.roleText, { color: accent }]}>{current.role}</Text>
          </View>
        </View>

        <Card>
          <DetailRow first label="First name" value={first} />
          <DetailRow label="Last name" value={rest.join(' ')} />
          <DetailRow label="Email" value={current.user_email} />
          <DetailRow label="Date joined" value={formatLong(current.joined_at)} />
          {!!current.project_name && <DetailRow label="Project" value={current.project_name} />}
        </Card>

        {canManage && (
          <>
            <SectionTitle>Role</SectionTitle>
            <View style={styles.roles}>
              {ROLES.map((r) => {
                const on = role === r.value;
                return (
                  <TouchableOpacity
                    key={r.value}
                    onPress={() => setRole(r.value)}
                    activeOpacity={0.8}
                    style={[
                      styles.roleCard,
                      { backgroundColor: on ? BRAND_PURPLE : theme.card, borderColor: on ? BRAND_PURPLE : theme.cardBorder },
                    ]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: on }}
                  >
                    <Text style={[styles.roleLabel, { color: on ? '#FFFFFF' : theme.text }]}>{r.label}</Text>
                    <Text style={[styles.roleHint, { color: on ? 'rgba(255,255,255,0.8)' : theme.muted }]}>{r.hint}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity
              onPress={save}
              disabled={!roleChanged || saving}
              activeOpacity={0.85}
              style={[styles.saveBtn, (!roleChanged || saving) && { opacity: 0.5 }]}
              accessibilityRole="button"
            >
              {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveText}>Save Changes</Text>}
            </TouchableOpacity>
          </>
        )}

        {!!current.user_id && (
          <>
            <SectionTitle>Recent Activity</SectionTitle>
            <Card>
              {activities === null ? (
                <ActivityIndicator style={{ marginVertical: 22 }} color={BRAND_PURPLE} />
              ) : activities.length === 0 ? (
                <Text style={[styles.empty, { color: theme.muted }]}>No recent activity in your shared projects.</Text>
              ) : (
                activities.map((a, i) => (
                  <View
                    key={a.id}
                    style={[styles.activityRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.divider }]}
                  >
                    <View style={[styles.dot, { backgroundColor: accent }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.activityText, { color: theme.text }]}>{a.description}</Text>
                      <Text style={[styles.activityMeta, { color: theme.muted }]} numberOfLines={1}>
                        {[a.project_name, timeAgo(a.created_at)].filter(Boolean).join('  ·  ')}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </Card>
          </>
        )}

        {canManage && (
          <>
            <Gap h={26} />
            <TouchableOpacity
              onPress={remove}
              disabled={removing}
              activeOpacity={0.8}
              style={[styles.removeBtn, { borderColor: DANGER, backgroundColor: light ? '#FCEAEA' : 'rgba(239,68,68,0.12)' }]}
              accessibilityRole="button"
            >
              {removing ? (
                <ActivityIndicator color={DANGER} />
              ) : (
                <>
                  <Ionicons name="trash-outline" size={18} color={DANGER} />
                  <Text style={styles.removeText}>Remove from team</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}
      </>
    );
  }

  return <SettingsShell title="Member Details">{body}</SettingsShell>;
};

export default MemberDetail;

const styles = StyleSheet.create({
  hero: { alignItems: 'center', marginBottom: 22 },
  name: { fontSize: 19, fontWeight: '700', marginTop: 14, maxWidth: '90%' },
  email: { fontSize: 12, marginTop: 4, maxWidth: '90%' },
  rolePill: { borderRadius: 11, paddingHorizontal: 14, paddingVertical: 4, marginTop: 10 },
  roleText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  detailRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, paddingVertical: 14 },
  detailLabel: { fontSize: 12 },
  detailValue: { flex: 1, textAlign: 'right', fontSize: 13, fontWeight: '600' },
  roles: { flexDirection: 'row', gap: 8 },
  roleCard: { flex: 1, borderRadius: 12, borderWidth: 1, paddingVertical: 12, paddingHorizontal: 10, alignItems: 'center' },
  roleLabel: { fontSize: 12.5, fontWeight: '700' },
  roleHint: { fontSize: 10, marginTop: 3, textAlign: 'center' },
  saveBtn: { height: 46, borderRadius: 10, backgroundColor: BRAND_PURPLE, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  saveText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  activityRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 13 },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  activityText: { fontSize: 12.5, lineHeight: 18 },
  activityMeta: { fontSize: 10.5, marginTop: 3 },
  empty: { textAlign: 'center', fontSize: 12.5, paddingVertical: 22 },
  removeBtn: {
    height: 46, borderRadius: 10, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  removeText: { color: DANGER, fontSize: 14, fontWeight: '700' },
});
