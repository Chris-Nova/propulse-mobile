import React, { useState } from 'react';
import {
  Modal, View, Text, TextInput, Alert, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { resendTeamInvite, revokeTeamInvite, sendInviteMessage } from '@/store/slices/teams';
import { TeamInvite } from '@/types';
import { BRAND_PURPLE } from '@/constants/authTheme';
import { SheetAction } from '@/components/settings/ActionSheet';
import { useSettingsTheme } from '@/components/settings/parts';

// You are the invitee when the invite was sent to your email; otherwise you sent it.
export const isInboundInvite = (invite: TeamInvite, email?: string) =>
  !!email && invite.email?.toLowerCase() === email.toLowerCase();

const closed = (s: string) => ['cancelled', 'accepted'].includes(s);

interface Handlers {
  view?: () => void;
  accept: () => void;
  resend: () => void;
  message: () => void;
  revoke: () => void;
}

// Same rules as the web invites table: the invitee can accept; the sender can resend, message
// and revoke while the invite is still open.
export const buildInviteActions = (invite: TeamInvite, email: string | undefined, h: Handlers): SheetAction[] => {
  const out: SheetAction[] = [];
  if (h.view) out.push({ label: 'View details', icon: 'eye-outline', onPress: h.view });

  if (isInboundInvite(invite, email)) {
    out.push({
      label: 'Accept invite',
      icon: 'checkmark-circle-outline',
      onPress: h.accept,
      disabled: invite.status !== 'pending' || invite.is_expired === true,
    });
  } else {
    out.push({
      label: 'Resend invite',
      icon: 'refresh-outline',
      onPress: h.resend,
      disabled: ['rejected', 'accepted'].includes(invite.status),
    });
    out.push({ label: 'Message invitee', icon: 'mail-outline', onPress: h.message, disabled: closed(invite.status) });
    out.push({
      label: 'Revoke invite',
      icon: 'close-circle-outline',
      onPress: h.revoke,
      destructive: true,
      disabled: closed(invite.status),
    });
  }
  return out;
};

// Message the invitee (web: "Message invitee"): POST /teams/invite/<id>/message
export const InviteMessageModal = ({ invite, onClose }: { invite: TeamInvite | null; onClose: () => void }) => {
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const { theme, accent } = useSettingsTheme();
  const { pending } = useAppSelector((s) => s.asyncActions.sendInviteMessage);
  const [text, setText] = useState('');
  const canSend = text.trim().length > 0 && !pending;

  const close = () => {
    setText('');
    onClose();
  };

  const send = async () => {
    if (!invite || !canSend) return;
    const ok = await dispatch(sendInviteMessage(invite.id, text.trim()) as any);
    if (ok) close();
  };

  return (
    <Modal
      visible={!!invite}
      animationType="slide"
      presentationStyle="pageSheet"
      statusBarTranslucent
      onRequestClose={close}
    >
      <KeyboardAvoidingView
        style={[styles.root, { backgroundColor: theme.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? 22 : insets.top + 14 }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: theme.text }]}>Message invitee</Text>
            <Text style={[styles.sub, { color: theme.muted }]}>
              Send a quick note to keep everyone aligned on {invite?.project_name ?? 'this project'}.
            </Text>
          </View>
          <TouchableOpacity
            onPress={close}
            style={[styles.closeBtn, { backgroundColor: theme.field }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Close"
          >
            <Ionicons name="close" size={20} color={theme.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.pad}>
          <View style={[styles.recipient, { backgroundColor: theme.field, borderColor: theme.fieldBorder }]}>
            <Ionicons name="mail-outline" size={20} color={accent} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.to, { color: theme.text }]} numberOfLines={1}>To: {invite?.email}</Text>
              {!!invite?.project_name && (
                <Text style={[styles.project, { color: theme.muted }]} numberOfLines={1}>Project · {invite.project_name}</Text>
              )}
            </View>
            {!!invite?.role && (
              <View style={[styles.rolePill, { backgroundColor: theme.palette.lavender.bg }]}>
                <Text style={[styles.roleText, { color: accent }]}>{invite.role}</Text>
              </View>
            )}
          </View>

          <Text style={[styles.label, { color: theme.text }]}>Message</Text>
          <TextInput
            value={text}
            onChangeText={(v: string) => setText(v)}
            placeholder="Share context, next steps, or anything they should know."
            placeholderTextColor={theme.placeholder}
            multiline
            maxLength={400}
            textAlignVertical="top"
            style={[styles.input, { color: theme.text, backgroundColor: theme.card, borderColor: theme.fieldBorder }]}
          />
          <Text style={[styles.count, { color: theme.muted }]}>{text.length}/400</Text>
        </View>

        <View style={{ flex: 1 }} />
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) + 4 }]}>
          <TouchableOpacity
            onPress={send}
            disabled={!canSend}
            activeOpacity={0.85}
            style={[styles.cta, !canSend && { opacity: 0.5 }]}
            accessibilityRole="button"
          >
            {pending ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.ctaText}>Send message</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// Everything a screen needs to offer invite actions: build the list for an invite, and render
// `messageModal` once somewhere in the screen. `onDone` fires after a resend or revoke succeeds.
export const useInviteActions = (onDone?: (what: 'resend' | 'revoke', invite: TeamInvite) => void) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.account);
  const [messageFor, setMessageFor] = useState<TeamInvite | null>(null);

  const actionsFor = (invite: TeamInvite, withView = true): SheetAction[] =>
    buildInviteActions(invite, user?.email, {
      view: withView ? () => router.push(`/(app)/teams/invites/${invite.id}` as any) : undefined,
      accept: () => router.push(`/invite/${invite.id}` as any),
      resend: async () => {
        const ok = await dispatch(resendTeamInvite(invite.id) as any);
        if (ok) onDone?.('resend', invite);
      },
      message: () => setMessageFor(invite),
      revoke: () =>
        Alert.alert('Revoke invite', `${invite.email} will no longer be able to join ${invite.project_name || 'the project'}.`, [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Revoke',
            style: 'destructive',
            onPress: async () => {
              const ok = await dispatch(revokeTeamInvite(invite.id) as any);
              if (ok) onDone?.('revoke', invite);
            },
          },
        ]),
    });

  const messageModal = <InviteMessageModal invite={messageFor} onClose={() => setMessageFor(null)} />;
  return { actionsFor, messageModal, userEmail: user?.email };
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 16, paddingBottom: 16 },
  title: { fontSize: 22, fontWeight: '700' },
  sub: { fontSize: 12, lineHeight: 17, marginTop: 6 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  pad: { paddingHorizontal: 16 },
  recipient: {
    flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, borderWidth: 1, padding: 14, marginTop: 6,
  },
  to: { fontSize: 13, fontWeight: '600' },
  project: { fontSize: 11, marginTop: 3 },
  rolePill: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 },
  roleText: { fontSize: 10.5, fontWeight: '600', textTransform: 'capitalize' },
  label: { fontSize: 13, fontWeight: '600', marginTop: 20, marginBottom: 8 },
  input: { minHeight: 140, borderRadius: 12, borderWidth: 1, padding: 14, fontSize: 13.5, lineHeight: 20 },
  count: { fontSize: 11, textAlign: 'right', marginTop: 6 },
  footer: { paddingHorizontal: 16, paddingTop: 8 },
  cta: { height: 46, borderRadius: 10, backgroundColor: BRAND_PURPLE, alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
