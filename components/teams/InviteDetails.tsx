import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchInviteDetails } from '@/store/slices/teams';
import { TeamInvite } from '@/types';
import { BRAND_PURPLE } from '@/constants/authTheme';
import { formatLong } from '@/utils/format';
import { SettingsShell } from '@/components/settings/SettingsShell';
import { Card, Gap, Row, SectionTitle, useSettingsTheme } from '@/components/settings/parts';
import { LoadError } from '@/components/messages/ChatStates';
import { isInboundInvite, useInviteActions } from '@/components/teams/InviteActions';

const DetailRow = ({ label, value, first }: { label: string; value?: string; first?: boolean }) => {
  const { theme } = useSettingsTheme();
  return (
    <View
      style={[styles.detailRow, !first && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.divider }]}
    >
      <Text style={[styles.detailLabel, { color: theme.muted }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: theme.text }]} numberOfLines={2}>{value || '—'}</Text>
    </View>
  );
};

// One invitation: who, which project, role, status and expiry, plus what you can do with it.
// (The web also has an "Edit invite" page, but the API has no endpoint to edit an invite.)
export const InviteDetails = ({ inviteId }: { inviteId: string }) => {
  const dispatch = useAppDispatch();
  const { theme, accent } = useSettingsTheme();
  const cached = useAppSelector((s) => s.team.invites.find((i) => i.id === inviteId));

  const [invite, setInvite] = useState<TeamInvite | null>(cached ?? null);
  const [loading, setLoading] = useState(!cached);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setFailed(false);
    if (!invite) setLoading(true);
    const data = await dispatch(fetchInviteDetails(inviteId) as any);
    if (data) setInvite(data);
    else if (!invite) setFailed(true);
    setLoading(false);
  }, [inviteId, dispatch]);

  useEffect(() => {
    load();
  }, [load]);

  const { actionsFor, messageModal, userEmail } = useInviteActions((what: 'resend' | 'revoke') => {
    // Resending replaces the invite with a new one, so go back to the list
    if (what === 'resend') router.back();
    else load();
  });

  const inbound = invite ? isInboundInvite(invite, userEmail) : false;
  const status = invite?.status ?? '';
  const tone =
    status === 'accepted' ? theme.status.completed
    : status === 'pending' ? theme.status.pending
    : { bg: theme.palette.pink.bg, fg: theme.palette.pink.icon, label: status };

  const expiry = !invite ? '' : invite.is_expired
    ? 'Expired'
    : status === 'pending' && typeof invite.expires_in_days === 'number'
      ? `In ${invite.expires_in_days} ${invite.expires_in_days === 1 ? 'day' : 'days'}`
      : '';

  let body: React.ReactNode;
  if (loading) {
    body = <ActivityIndicator style={{ marginTop: 60 }} color={BRAND_PURPLE} />;
  } else if (failed || !invite) {
    body = <LoadError onRetry={load} message="We couldn't load this invite. It may have been removed. Please try again." />;
  } else {
    const actions = actionsFor(invite, false);
    body = (
      <>
        <View style={styles.hero}>
          <View style={[styles.heroCircle, { backgroundColor: theme.palette.lavender.bg }]}>
            <Ionicons name={inbound ? 'mail-open-outline' : 'paper-plane-outline'} size={34} color={accent} />
          </View>
          <Text style={[styles.email, { color: theme.text }]} numberOfLines={1}>{invite.email}</Text>
          <View style={styles.pills}>
            <View style={[styles.pill, { backgroundColor: theme.palette.lavender.bg }]}>
              <Text style={[styles.pillText, { color: accent }]}>{inbound ? 'Inbound' : 'Outbound'}</Text>
            </View>
            <View style={[styles.pill, { backgroundColor: tone.bg }]}>
              <Text style={[styles.pillText, { color: tone.fg }]}>{status}</Text>
            </View>
          </View>
        </View>

        <Card>
          <DetailRow first label="Project" value={invite.project_name} />
          <DetailRow label="Company" value={invite.project_company} />
          <DetailRow label="Role" value={invite.role ? invite.role.charAt(0).toUpperCase() + invite.role.slice(1) : ''} />
          <DetailRow label={inbound ? 'Invited by' : 'Sent by'} value={invite.inviter_name || invite.inviter_email} />
          <DetailRow label="Date sent" value={formatLong(invite.created_at)} />
          {!!expiry && <DetailRow label="Expires" value={expiry} />}
        </Card>

        <SectionTitle>Actions</SectionTitle>
        <Card>
          {actions.map((a, i) => (
            <Row
              key={a.label}
              icon={a.icon ?? 'ellipse-outline'}
              title={a.label}
              danger={a.destructive}
              divider={i > 0}
              dim={a.disabled}
              onPress={a.disabled ? undefined : a.onPress}
            />
          ))}
        </Card>
        <Gap h={8} />
        {messageModal}
      </>
    );
  }

  return <SettingsShell title="Invite Details">{body}</SettingsShell>;
};

const styles = StyleSheet.create({
  hero: { alignItems: 'center', marginBottom: 22 },
  heroCircle: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center' },
  email: { fontSize: 17, fontWeight: '700', marginTop: 16, maxWidth: '90%' },
  pills: { flexDirection: 'row', gap: 8, marginTop: 10 },
  pill: { borderRadius: 11, paddingHorizontal: 12, paddingVertical: 4 },
  pillText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  detailRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, paddingVertical: 14 },
  detailLabel: { fontSize: 12 },
  detailValue: { flex: 1, textAlign: 'right', fontSize: 13, fontWeight: '600' },
});
