import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { router } from 'expo-router';
import { setMember } from '@/store/reducers/team';
import { fetchTeamMembers, fetchTeamInvites, deleteTeamMember, revokeTeamInvite } from '@/store/slices/teams';
import { fetchProjects } from '@/store/slices/projects';
import { TeamMember } from '@/types';
import { BRAND_PURPLE } from '@/constants/authTheme';
import { useDashboardTheme } from '@/constants/dashboardTheme';
import { isValidEmail } from '@/utils/validators';
import { initialOf } from '@/utils/format';
import { AppHeader } from '@/components/shared/AppHeader';
import { FilterPills } from '@/components/shared/ListControls';
import { SelectField } from '@/components/shared/SelectField';
import { BottomGlow } from '@/components/splash/BottomGlow';
import { sendInvites } from './inviteMany';


// ─── Invite Team Member form ───────────────────────────────
const ROLE_OPTIONS = [
  { label: 'Admin', value: 'admin', sub: 'Full access to the project' },
  { label: 'Collaborator', value: 'collaborator', sub: 'Can work on milestones and tasks' },
  { label: 'Client', value: 'client', sub: 'Can follow progress and give feedback' },
];

const InviteTeamForm = () => {
  const dispatch = useAppDispatch();
  const theme = useDashboardTheme();
  const { projects } = useAppSelector((s) => s.project);
  const { pending } = useAppSelector((s) => s.asyncActions.fetchProjects);
  const [input, setInput] = useState('');
  const [emails, setEmails] = useState<string[]>([]);
  const [project, setProject] = useState<string>();
  const [role, setRole] = useState<string>();
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const light = theme.scheme === 'light';

  useEffect(() => { dispatch(fetchProjects() as any); }, [dispatch]);

  const addEmail = () => {
    const value = input.trim().toLowerCase();
    if (!value) return;
    if (!isValidEmail(value)) return setError('Enter a valid email address');
    if (emails.includes(value)) return setError('That email is already on the list');
    setEmails((e) => [...e, value]);
    setInput('');
    setError('');
  };

  // Only projects the person is allowed to send invites for
  const projectOptions = projects
    .filter((p) => p.permissions?.can_send_invite ?? (p as any).is_owner ?? true)
    .map((p) => ({ label: p.name, value: p.id, sub: p.client_name || undefined }));

  const canSend = emails.length > 0 && !!project && !!role && !sending;

  const submit = async () => {
    // Include an email that was typed but not yet added
    let list = emails;
    const pendingEmail = input.trim().toLowerCase();
    if (pendingEmail && isValidEmail(pendingEmail) && !list.includes(pendingEmail)) list = [...list, pendingEmail];
    if (!list.length || !project || !role) return;
    setSending(true);
    const ok = await dispatch(sendInvites(list, project, role) as any);
    setSending(false);
    if (ok) { setEmails([]); setInput(''); setProject(undefined); setRole(undefined); setError(''); }
  };

  const label = (text: string) => (
    <Text style={[styles.fieldLabel, { color: theme.text }]}>
      {text}<Text style={{ color: '#E33629' }}> *</Text>
    </Text>
  );

  return (
    <View
      style={[
        styles.formCard,
        { backgroundColor: theme.card, borderColor: theme.cardBorder },
        theme.shadow && styles.shadow,
      ]}
    >
      {label('Emails')}
      <View style={[styles.emailField, { backgroundColor: light ? '#FFFFFF' : theme.field, borderColor: error ? '#EF4444' : light ? '#DFDFDF' : theme.fieldBorder }]}>
        <Ionicons name="mail-outline" size={17} color={theme.text} />
        <TextInput
          value={input}
          onChangeText={(v) => { setInput(v); if (error) setError(''); }}
          onSubmitEditing={addEmail}
          placeholder="Enter email address"
          placeholderTextColor={theme.placeholder}
          style={[styles.emailInput, { color: theme.text }]}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
        />
        <TouchableOpacity onPress={addEmail} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityLabel="Add email">
          <Ionicons name="add-circle-outline" size={22} color={BRAND_PURPLE} />
        </TouchableOpacity>
      </View>
      {!!error && <Text style={styles.errorText}>{error}</Text>}

      {emails.length > 0 && (
        <View style={styles.chips}>
          {emails.map((e) => (
            <View key={e} style={[styles.chip, { backgroundColor: theme.field }]}>
              <Text style={[styles.chipText, { color: theme.scheme === 'light' ? BRAND_PURPLE : theme.tabBar.active }]} numberOfLines={1}>{e}</Text>
              <TouchableOpacity onPress={() => setEmails((l) => l.filter((x) => x !== e))} accessibilityLabel={`Remove ${e}`}>
                <Ionicons name="close" size={16} color={BRAND_PURPLE} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <View style={{ marginTop: 18 }}>{label('Projects')}</View>
      <SelectField
        icon="briefcase-outline"
        placeholder="Select project"
        value={project}
        options={projectOptions}
        onSelect={setProject}
        title="Select project"
        emptyText={pending ? 'Loading projects…' : 'You have no projects you can invite people to yet.'}
      />

      <View style={{ marginTop: 18 }}>{label('Role')}</View>
      <SelectField
        icon="person-outline"
        placeholder="Select role"
        value={role}
        options={ROLE_OPTIONS}
        onSelect={setRole}
        title="Select role"
      />

      <TouchableOpacity
        onPress={submit}
        disabled={!canSend && !(input.trim() && project && role)}
        activeOpacity={0.85}
        style={[styles.sendBtn, (!canSend && !(input.trim() && project && role)) && { opacity: 0.55 }]}
      >
        {sending ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Ionicons name="paper-plane-outline" size={16} color="#FFFFFF" />
            <Text style={styles.sendText}>Send Invite</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

// ─── Member row ────────────────────────────────────────────
const MemberRow = ({ member, onDelete }: { member: TeamMember; onDelete: () => void }) => {
  const dispatch = useAppDispatch();
  const theme = useDashboardTheme();
  const tint = member.role === 'admin' ? theme.palette.blue : member.role === 'client' ? theme.palette.amber : theme.palette.mint;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => { dispatch(setMember(member)); router.push(`/(app)/teams/members/${member.id}` as any); }}
      style={[styles.memberRow, { backgroundColor: theme.card, borderColor: theme.cardBorder }, theme.shadow && styles.shadow]}
    >
      <View style={[styles.memberAvatar, { backgroundColor: theme.palette.lavender.bg }]}>
        <Text style={{ color: theme.palette.lavender.icon, fontWeight: '600', fontSize: 15 }}>{initialOf(member.user_name)}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.memberName, { color: theme.text }]} numberOfLines={1}>{member.user_name}</Text>
        <Text style={[styles.memberEmail, { color: theme.muted }]} numberOfLines={1}>
          {member.user_email}{member.project_name ? `  ·  ${member.project_name}` : ''}
        </Text>
      </View>
      <View style={[styles.rolePill, { backgroundColor: tint.bg }]}>
        <Text style={{ color: tint.icon, fontSize: 9.5, fontWeight: '600', textTransform: 'capitalize' }}>{member.role}</Text>
      </View>
      {!member.is_owner && (
        <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityLabel="Remove member">
          <Ionicons name="trash-outline" size={17} color="#E33629" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

// ─── Teams screen ──────────────────────────────────────────
export const Teams = () => {
  const dispatch = useAppDispatch();
  const theme = useDashboardTheme();
  const { members, invites } = useAppSelector((s) => s.team);
  const [activeTab, setActiveTab] = useState<'members' | 'invites'>('members');

  useEffect(() => {
    dispatch(fetchTeamMembers() as any);
    dispatch(fetchTeamInvites() as any);
  }, []);

  const handleDeleteMember = (member: TeamMember) => {
    Alert.alert('Remove Member', `Are you sure you want to remove ${member.user_name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => dispatch(deleteTeamMember(member.id) as any) },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar style={theme.statusBar} />
      {theme.glow && <BottomGlow color={BRAND_PURPLE} opacity={0.22} />}
      <ScrollView
        contentContainerStyle={styles.screenList}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <AppHeader />

        <View style={styles.titleRow}>
          <View style={[styles.titleIcon, { backgroundColor: theme.field }]}>
            <Ionicons name="person-add-outline" size={22} color={BRAND_PURPLE} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.text, fontSize: 22, fontWeight: '700' }}>Invite Team Member</Text>
            <Text style={{ color: theme.text, fontSize: 10, marginTop: 3 }}>
              Kindly fill this form to invite a member to your project.
            </Text>
          </View>
        </View>

        <View style={{ marginTop: 18 }}>
          <InviteTeamForm />
        </View>

        <View style={[styles.permCard, { backgroundColor: theme.field, borderColor: theme.fieldBorder }]}>
          <View style={[styles.permIcon, { backgroundColor: theme.palette.lavender.bg }]}>
            <Ionicons name="alert" size={18} color={BRAND_PURPLE} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.permTitle, { color: theme.scheme === 'light' ? BRAND_PURPLE : theme.tabBar.active }]}>Team Permissions</Text>
            <Text style={[styles.permText, { color: theme.text }]}>
              You can manage permissions and access levels for your team members after they join.
            </Text>
          </View>
        </View>

        {/* Existing team + pending invites */}
        <View style={{ marginTop: 26 }}>
          <FilterPills
            options={[
              { label: `Members (${members.length})`, value: 'members' as const },
              { label: `Invites (${invites.length})`, value: 'invites' as const },
            ]}
            value={activeTab}
            onChange={setActiveTab}
          />
        </View>

        <View style={{ gap: 10, marginTop: 14 }}>
          {activeTab === 'members' ? (
            members.length === 0 ? (
              <Text style={[styles.emptyText, { color: theme.muted }]}>No team members yet. Invite someone above.</Text>
            ) : (
              members.map((m) => <MemberRow key={m.id} member={m} onDelete={() => handleDeleteMember(m)} />)
            )
          ) : invites.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.muted }]}>No pending invites.</Text>
          ) : (
            invites.map((item) => {
              const st = item.status === 'pending' ? theme.status.pending : item.status === 'accepted' ? theme.status.completed : { bg: theme.palette.pink.bg, fg: theme.palette.pink.icon, label: item.status };
              return (
                <View key={item.id} style={[styles.memberRow, { backgroundColor: theme.card, borderColor: theme.cardBorder }, theme.shadow && styles.shadow]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.memberName, { color: theme.text }]} numberOfLines={1}>{item.email}</Text>
                    {!!(item as any).project_name && (
                      <Text style={[styles.memberEmail, { color: theme.muted }]} numberOfLines={1}>{(item as any).project_name}</Text>
                    )}
                  </View>
                  <View style={[styles.rolePill, { backgroundColor: st.bg }]}>
                    <Text style={{ color: st.fg, fontSize: 9.5, fontWeight: '600', textTransform: 'capitalize' }}>{st.label}</Text>
                  </View>
                  {item.status === 'pending' && (
                    <TouchableOpacity onPress={() => dispatch(revokeTeamInvite(item.id) as any)} accessibilityLabel="Revoke invite">
                      <Ionicons name="close-circle-outline" size={20} color="#E33629" />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screenList: { paddingHorizontal: 16, paddingBottom: 32 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20 },
  titleIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  formCard: { borderRadius: 12, borderWidth: 1, padding: 18 },
  shadow: {
    shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  fieldLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  emailField: {
    height: 42, borderRadius: 10, borderWidth: 1, flexDirection: 'row', alignItems: 'center',
    gap: 14, paddingLeft: 16, paddingRight: 12,
  },
  emailInput: { flex: 1, fontSize: 12.5, paddingVertical: 0, height: '100%' },
  errorText: { color: '#EF4444', fontSize: 11.5, marginTop: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 10, height: 34, borderRadius: 17,
    paddingHorizontal: 14, maxWidth: '100%',
  },
  chipText: { fontSize: 11.5, fontWeight: '700', flexShrink: 1 },
  sendBtn: {
    marginTop: 24, height: 42, borderRadius: 8, backgroundColor: BRAND_PURPLE,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  sendText: { color: '#FFFFFF', fontSize: 12.5, fontWeight: '700' },
  permCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 16,
    borderRadius: 12, borderWidth: 1, padding: 16,
  },
  permIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  permTitle: { fontSize: 14, fontWeight: '600', marginBottom: 3 },
  permText: { fontSize: 10, lineHeight: 14 },
  emptyText: { textAlign: 'center', fontSize: 13, paddingVertical: 24 },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, borderWidth: 1, padding: 12 },
  memberAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  memberName: { fontSize: 13, fontWeight: '600' },
  memberEmail: { fontSize: 10.5, marginTop: 2 },
  rolePill: { paddingHorizontal: 10, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
});
