import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, TouchableOpacity
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { acceptTeamInvite, fetchTeamInvite } from '@/store/slices/billing';
import Button from '@/components/shared/Button';
import { COLORS, SIZES } from '@/constants/theme';

const AcceptInvite = () => {
  const { inviteId } = useLocalSearchParams<{ inviteId: string }>();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.account);

  const [invite, setInvite] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!inviteId) return;
    (async () => {
      setLoading(true);
      const data = await dispatch(fetchTeamInvite(inviteId) as any);
      if (data) {
        setInvite(data);
        if (data.status === 'accepted') setAccepted(true);
      } else {
        setError('Invite not found or expired. Please contact the person who invited you.');
      }
      setLoading(false);
    })();
  }, [inviteId]);

  const handleAccept = async () => {
    if (accepted) {
      router.replace(`/(app)/projects/${invite?.project_id}`);
      return;
    }

    if (!user) {
      // Not authenticated: redirect to auth with invite context
      router.replace(`/(auth)?invite_id=${inviteId}&invite_email=${invite?.email}`);
      return;
    }

    setAccepting(true);
    const result = await dispatch(acceptTeamInvite(inviteId) as any);
    if (result?.success) {
      setAccepted(true);
    } else {
      setError('Failed to accept invite. Please try again.');
    }
    setAccepting(false);
  };

  const role = invite?.role ?? 'collaborator';
  const roleArticle = role === 'admin' ? 'an' : 'a';

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading invite...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Icon */}
      <View style={[styles.iconCircle, { backgroundColor: error ? COLORS.errorLight : COLORS.successLight }]}>
        <Ionicons
          name={error ? 'close-circle' : accepted ? 'checkmark-circle' : 'mail-open'}
          size={56}
          color={error ? COLORS.error : COLORS.success}
        />
      </View>

      {/* Title */}
      <Text style={styles.title}>
        {error ? 'Invite Error' : accepted ? 'Invite Accepted' : 'Team Invite'}
      </Text>

      {/* Message */}
      <Text style={styles.message}>
        {error ? error : accepted ? (
          `You can now collaborate on project "${invite?.project_name}" as ${roleArticle} ${role}.`
        ) : invite ? (
          `You've been invited by ${invite?.inviter_name} to join "${invite?.project_name}" as ${roleArticle} ${role}. Accept to get started.`
        ) : 'No invite details found.'}
      </Text>

      {/* Action */}
      {!error && invite && (
        <Button
          onPress={handleAccept}
          loading={accepting}
          disabled={accepting}
          size="large"
          fullWidth
          style={styles.btn}
        >
          {accepted ? 'View Project' : 'Accept Invite'}
        </Button>
      )}

      {/* Error retry */}
      {error && (
        <TouchableOpacity onPress={() => router.replace('/(app)/dashboard')} style={styles.link}>
          <Text style={styles.linkText}>Go to Dashboard</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.xl,
    gap: SIZES.lg,
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SIZES.md },
  loadingText: { color: COLORS.textSecondary, fontSize: SIZES.body },
  iconCircle: {
    width: 100, height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: SIZES.heading,
    fontWeight: '800',
    textAlign: 'center',
  },
  message: {
    color: COLORS.textSecondary,
    fontSize: SIZES.body,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 320,
  },
  btn: { marginTop: SIZES.sm },
  link: { marginTop: SIZES.sm },
  linkText: { color: COLORS.primary, fontSize: SIZES.body, fontWeight: '600' },
});

export default AcceptInvite;
