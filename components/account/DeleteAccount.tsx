import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, TextInput, Alert, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { signOut } from '@/store/slices/auth';
import { BRAND_PURPLE } from '@/constants/authTheme';
import { DeletionPreview, getDeletionPreview, requestAccountDeletion } from '@/utils/accountDeletion';
import { SettingsShell } from '@/components/settings/SettingsShell';
import { Card, DANGER, Gap, useNotify, useSettingsTheme } from '@/components/settings/parts';
import { LoadError } from '@/components/messages/ChatStates';

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

// Delete account, following the web flow: preview what is lost, ask for the password
// (accounts that sign in with Google have none), delete, then sign out.
export const DeleteAccount = () => {
  const dispatch = useAppDispatch();
  const notify = useNotify();
  const { theme, light } = useSettingsTheme();
  const { user } = useAppSelector((s) => s.account);

  const [preview, setPreview] = useState<DeletionPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [needsPassword, setNeedsPassword] = useState(user?.auth_method !== 'google');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    const { data, message } = await getDeletionPreview();
    if (data) setPreview(data);
    else setLoadError(message || "We couldn't load your account details. Please try again.");
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const owned = preview?.owned_projects ?? [];
  const member = preview?.member_projects ?? [];
  const days = preview?.deletion_grace_days ?? 30;
  const ready = !!preview && !deleting && (!needsPassword || password.length > 0);

  const doDelete = async () => {
    setDeleting(true);
    setError('');
    const { success, message, code } = await requestAccountDeletion(password);
    setDeleting(false);

    if (!success) {
      // The server asks for a password even when we thought none was needed (Google users who set one)
      if (code === 'incorrect_current_password') {
        setNeedsPassword(true);
        setError(password ? 'That password is incorrect.' : 'Enter your password to continue.');
      } else {
        setError(message || 'We could not delete your account. Please try again.');
      }
      return;
    }

    notify('Your account has been scheduled for deletion.');
    setTimeout(() => dispatch(signOut() as any), 1200);
  };

  const confirm = () =>
    Alert.alert(
      'Delete your account?',
      `You will be signed out everywhere. You have ${days} days to restore it before it is removed for good.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete },
      ]
    );

  let body: React.ReactNode;
  if (loading) {
    body = <ActivityIndicator style={{ marginTop: 60 }} color={BRAND_PURPLE} />;
  } else if (loadError || !preview) {
    body = <LoadError onRetry={load} message={loadError} />;
  } else {
    const lost = [
      owned.length > 0 && plural(owned.length, 'project you own', 'projects you own'),
      member.length > 0 && plural(member.length, 'project you are a member of', 'projects you are a member of'),
    ].filter(Boolean) as string[];

    body = (
      <>
        <Text style={[styles.lead, { color: theme.text }]}>
          {lost.length > 0
            ? `You will lose access to ${lost.join(' and ')}.`
            : "You don't own or belong to any projects."}
        </Text>

        {owned.length > 0 && (
          <Card style={styles.listCard}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Projects you own</Text>
            {owned.map((p, i) => (
              <View
                key={p.id}
                style={[styles.projectRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.divider }]}
              >
                <Text style={[styles.projectName, { color: theme.text }]} numberOfLines={1}>{p.name}</Text>
                <Text style={[styles.projectMeta, { color: theme.muted }]}>
                  {p.members.length > 0 ? plural(p.members.length, 'other member', 'other members') : 'Only you'}
                </Text>
              </View>
            ))}
            <Text style={[styles.note, { color: DANGER }]}>
              Projects you own are permanently deleted when the {days}-day grace period ends.
            </Text>
          </Card>
        )}

        <Text style={[styles.grace, { color: theme.muted }]}>
          You have a grace period of {days} days to restore your account after this action. To restore it, sign
          in to the ProPulse web app.
        </Text>

        {needsPassword && (
          <View style={{ marginTop: 22 }}>
            <Text style={[styles.label, { color: theme.text }]}>Enter your password to continue</Text>
            <View
              style={[
                styles.inputWrap,
                { backgroundColor: theme.card, borderColor: error ? DANGER : theme.fieldBorder },
              ]}
            >
              <TextInput
                value={password}
                onChangeText={(v: string) => {
                  setPassword(v);
                  setError('');
                }}
                placeholder="Password"
                placeholderTextColor={theme.placeholder}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="password"
                style={[styles.input, { color: theme.text }]}
              />
              <TouchableOpacity
                onPress={() => setShowPassword((v) => !v)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              >
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={theme.muted} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        {!!error && <Text style={styles.error}>{error}</Text>}

        <Gap h={26} />
        <TouchableOpacity
          onPress={confirm}
          disabled={!ready}
          activeOpacity={0.85}
          style={[styles.deleteBtn, !ready && { opacity: 0.5 }]}
          accessibilityRole="button"
        >
          {deleting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.deleteText}>Delete My Account</Text>}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.back()}
          disabled={deleting}
          activeOpacity={0.7}
          style={[styles.cancelBtn, { borderColor: BRAND_PURPLE }]}
          accessibilityRole="button"
        >
          <Text style={[styles.cancelText, { color: light ? BRAND_PURPLE : theme.tabBar.active }]}>Cancel</Text>
        </TouchableOpacity>
      </>
    );
  }

  return (
    <SettingsShell title="Delete Account">
      <View style={styles.hero}>
        <View style={[styles.heroCircle, { backgroundColor: light ? '#FCE7E4' : 'rgba(239,68,68,0.16)' }]}>
          <Ionicons name="warning-outline" size={54} color={light ? DANGER : '#FF7A70'} />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>Delete your account?</Text>
        <Text style={[styles.sub, { color: theme.muted }]}>You have opted to delete your account.</Text>
      </View>
      {body}
    </SettingsShell>
  );
};

const styles = StyleSheet.create({
  hero: { alignItems: 'center', marginBottom: 22 },
  heroCircle: { width: 112, height: 112, borderRadius: 56, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', marginTop: 22 },
  sub: { fontSize: 12.5, marginTop: 8 },
  lead: { fontSize: 14, fontWeight: '600', lineHeight: 20, textAlign: 'center' },
  listCard: { marginTop: 18, paddingVertical: 14 },
  cardTitle: { fontSize: 13.5, fontWeight: '700', marginBottom: 6 },
  projectRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 11 },
  projectName: { flex: 1, fontSize: 13, fontWeight: '600' },
  projectMeta: { fontSize: 11 },
  note: { fontSize: 11.5, lineHeight: 16, marginTop: 8, fontWeight: '500' },
  grace: { fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 18 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10, height: 46, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14,
  },
  input: { flex: 1, fontSize: 14 },
  error: { color: DANGER, fontSize: 12, marginTop: 8 },
  deleteBtn: { height: 46, borderRadius: 10, backgroundColor: DANGER, alignItems: 'center', justifyContent: 'center' },
  deleteText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  cancelBtn: { height: 46, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  cancelText: { fontSize: 14, fontWeight: '600' },
});
