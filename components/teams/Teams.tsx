import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { router } from 'expo-router';
import { setMember } from '@/store/reducers/team';
import { fetchTeamMembers, fetchTeamInvites, sendTeamInvite, deleteTeamMember, revokeTeamInvite } from '@/store/slices/teams';
import { updateInviteModel } from '@/store/reducers/team';
import { Card, EmptyState, Loader, SectionHeader, Badge } from '@/components/shared';
import Button from '@/components/shared/Button';
import { COLORS, SIZES } from '@/constants/theme';
import { TeamMember, TeamInvite, MemberRoles } from '@/types';

const ROLE_COLORS: Record<MemberRoles, { color: string; bg: string }> = {
  admin: { color: COLORS.primary, bg: COLORS.infoLight },
  collaborator: { color: COLORS.success, bg: COLORS.successLight },
  client: { color: COLORS.warning, bg: COLORS.warningLight },
};

// ─── Member Card ───────────────────────────────────────────
const MemberCard = ({ member, onDelete }: { member: TeamMember; onDelete: () => void }) => {
  const dispatch = useAppDispatch();
  const roleStyle = ROLE_COLORS[member.role as keyof typeof ROLE_COLORS] ?? ROLE_COLORS['collaborator'];

  const handlePress = () => {
    dispatch(setMember(member));
    router.push(`/(app)/teams/members/${member.id}`);
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.85}>
    <Card style={styles.memberCard}>
      <View style={styles.memberAvatar}>
        <Text style={styles.avatarText}>{member.user_name?.charAt(0)?.toUpperCase() ?? '?'}</Text>
      </View>
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{member.user_name}</Text>
        <Text style={styles.memberEmail}>{member.user_email}</Text>
        <Badge label={member.role} color={roleStyle.color} bgColor={roleStyle.bg + '33'} />
      </View>
      {!member.is_owner && (
        <TouchableOpacity onPress={onDelete} style={styles.deleteBtn} onStartShouldSetResponder={() => true}>
          <Ionicons name="trash-outline" size={18} color={COLORS.error} />
        </TouchableOpacity>
      )}
    </Card>
    </TouchableOpacity>
  );
};

// ─── Invite Form ───────────────────────────────────────────
const InviteForm = () => {
  const dispatch = useAppDispatch();
  const { inviteModel } = useAppSelector((s) => s.team);
  const { pending } = useAppSelector((s) => s.asyncActions.sendTeamInvite);
  const [showForm, setShowForm] = useState(false);

  const roleOptions: MemberRoles[] = ['collaborator', 'admin', 'client'];

  if (!showForm) {
    return (
      <Button onPress={() => setShowForm(true)} size="small">
        + Invite Member
      </Button>
    );
  }

  return (
    <Card style={styles.inviteForm}>
      <Text style={styles.inviteTitle}>Send Invite</Text>

      <TextInput
        style={styles.textInput}
        placeholder="Email address"
        placeholderTextColor={COLORS.textMuted}
        value={inviteModel.email}
        onChangeText={(v) => dispatch(updateInviteModel({ email: v }))}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <View style={styles.roleRow}>
        {roleOptions.map((role) => (
          <TouchableOpacity
            key={role}
            onPress={() => dispatch(updateInviteModel({ role }))}
            style={[styles.roleChip, inviteModel.role === role && styles.roleChipActive]}
          >
            <Text style={[styles.roleChipText, inviteModel.role === role && styles.roleChipTextActive]}>
              {role}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.inviteActions}>
        <Button onPress={() => setShowForm(false)} variant="ghost" size="small">
          Cancel
        </Button>
        <Button
          onPress={() => dispatch(sendTeamInvite() as any)}
          loading={pending}
          disabled={!inviteModel.email}
          size="small"
        >
          Send Invite
        </Button>
      </View>
    </Card>
  );
};

// ─── Teams Screen ──────────────────────────────────────────
export const Teams = () => {
  const dispatch = useAppDispatch();
  const { members, invites } = useAppSelector((s) => s.team);
  const { pending: loadingMembers } = useAppSelector((s) => s.asyncActions.fetchTeamMembers);
  const [activeTab, setActiveTab] = useState<'members' | 'invites'>('members');

  useEffect(() => {
    dispatch(fetchTeamMembers() as any);
    dispatch(fetchTeamInvites() as any);
  }, []);

  const handleDeleteMember = (member: TeamMember) => {
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${member.user_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => dispatch(deleteTeamMember(member.id) as any),
        },
      ]
    );
  };

  if (loadingMembers && !members.length) return <Loader pending fullScreen />;

  return (
    <View style={{ flex: 1, padding: SIZES.md }}>
      <View style={styles.headerRow}>
        <SectionHeader title="Team" />
        <InviteForm />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['members', 'invites'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'members' ? `Members (${members.length})` : `Invites (${invites.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'members' ? (
        <FlatList
          data={members}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: SIZES.sm }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState icon="people-outline" message="No team members yet. Invite someone!" />
          }
          renderItem={({ item }) => (
            <MemberCard member={item} onDelete={() => handleDeleteMember(item)} />
          )}
        />
      ) : (
        <FlatList
          data={invites}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: SIZES.sm }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState icon="mail-outline" message="No pending invites" />
          }
          renderItem={({ item }) => {
            const statusColor = item.status === 'pending' ? COLORS.warning : item.status === 'accepted' ? COLORS.success : COLORS.error;
            return (
              <Card style={styles.inviteCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.memberEmail}>{item.email}</Text>
                  <Badge label={item.status} color={statusColor} bgColor={statusColor + '22'} />
                </View>
                {item.status === 'pending' && (
                  <TouchableOpacity onPress={() => dispatch(revokeTeamInvite(item.id) as any)}>
                    <Ionicons name="close-circle-outline" size={22} color={COLORS.error} />
                  </TouchableOpacity>
                )}
              </Card>
            );
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SIZES.md },
  tabs: { flexDirection: 'row', marginBottom: SIZES.md, backgroundColor: COLORS.surfaceElevated, borderRadius: SIZES.radiusMd, padding: 4 },
  tab: { flex: 1, paddingVertical: SIZES.sm, borderRadius: SIZES.radiusSm, alignItems: 'center' },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { color: COLORS.textSecondary, fontSize: SIZES.small, fontWeight: '600' },
  tabTextActive: { color: COLORS.white },
  memberCard: { flexDirection: 'row', alignItems: 'center', gap: SIZES.md },
  memberAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.primaryDark,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: COLORS.white, fontSize: SIZES.subtitle, fontWeight: '700' },
  memberInfo: { flex: 1, gap: 2 },
  memberName: { color: COLORS.textPrimary, fontSize: SIZES.body, fontWeight: '600' },
  memberEmail: { color: COLORS.textSecondary, fontSize: SIZES.small },
  deleteBtn: { padding: SIZES.xs },
  inviteForm: { marginBottom: SIZES.md, gap: SIZES.sm },
  inviteTitle: { color: COLORS.textPrimary, fontSize: SIZES.subtitle, fontWeight: '600' },
  textInput: {
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    height: SIZES.inputHeight,
    paddingHorizontal: SIZES.md,
    color: COLORS.textPrimary,
    fontSize: SIZES.body,
  },
  roleRow: { flexDirection: 'row', gap: SIZES.sm, flexWrap: 'wrap' },
  roleChip: {
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radiusFull,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  roleChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  roleChipText: { color: COLORS.textSecondary, fontSize: SIZES.small, textTransform: 'capitalize' },
  roleChipTextActive: { color: COLORS.white },
  inviteActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: SIZES.sm },
  inviteCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
