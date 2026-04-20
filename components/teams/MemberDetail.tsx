import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '@/store/hooks';
import Avatar from '@/components/shared/Avatar';
import { Card, Badge } from '@/components/shared';
import { COLORS, SIZES } from '@/constants/theme';

const ROLE_COLORS: Record<string, string> = {
  admin: COLORS.primary,
  collaborator: COLORS.success,
  client: COLORS.warning,
  owner: COLORS.infoLight,
};

const InfoRow = ({ label, value }: { label: string; value?: string }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value || '—'}</Text>
  </View>
);

const formatDate = (iso?: string) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
};

const MemberDetail = () => {
  const { member } = useAppSelector((s) => s.team);

  if (!member) {
    return (
      <View style={styles.centered}>
        <Ionicons name="person-outline" size={48} color={COLORS.textMuted} />
        <Text style={styles.noMember}>Member not found</Text>
      </View>
    );
  }

  const firstName = member.user_name?.split(' ')?.[0] ?? '';
  const lastName = member.user_name?.split(' ')?.[1] ?? '';
  const roleColor = ROLE_COLORS[member.role] ?? COLORS.textMuted;

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Avatar & name hero */}
      <View style={styles.hero}>
        <Avatar
          name={member.user_name}
          size={80}
          color={roleColor}
        />
        <Text style={styles.memberName}>{member.user_name}</Text>
        <Badge
          label={member.role}
          color={COLORS.white}
          bgColor={roleColor}
        />
      </View>

      {/* Details card */}
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Personal Information</Text>
        <InfoRow label="First Name" value={firstName} />
        <InfoRow label="Last Name" value={lastName} />
        <InfoRow label="Email" value={member.user_email} />
        <InfoRow label="Date Joined" value={formatDate(member.joined_at)} />
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Project Details</Text>
        <InfoRow label="Project" value={member.project_name} />
        <InfoRow label="Role" value={member.role?.charAt(0).toUpperCase() + member.role?.slice(1)} />
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: SIZES.md, gap: SIZES.md, paddingBottom: SIZES.xxl },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SIZES.md, padding: SIZES.xl },
  noMember: { color: COLORS.textSecondary, fontSize: SIZES.body },
  hero: { alignItems: 'center', gap: SIZES.sm, paddingVertical: SIZES.lg },
  memberName: { color: COLORS.textPrimary, fontSize: SIZES.heading, fontWeight: '700' },
  card: { gap: SIZES.sm },
  cardTitle: {
    color: COLORS.textPrimary,
    fontSize: SIZES.subtitle,
    fontWeight: '700',
    marginBottom: SIZES.xs,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  infoLabel: { color: COLORS.textMuted, fontSize: SIZES.small, fontWeight: '500' },
  infoValue: { color: COLORS.textPrimary, fontSize: SIZES.body, fontWeight: '500', maxWidth: '65%', textAlign: 'right' },
});

export default MemberDetail;
