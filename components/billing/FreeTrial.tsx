import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { activateFreeTrial } from '@/store/slices/billing';
import Button from '@/components/shared/Button';
import { Card } from '@/components/shared';
import { COLORS, SIZES } from '@/constants/theme';

const TRIAL_FEATURES = [
  'Up to 5 active projects',
  'Up to 3 team members',
  'Milestone & subtask management',
  'Document uploads (1GB storage)',
  'Real-time messaging',
  'Analytics & reports',
];

const FreeTrial = () => {
  const dispatch = useAppDispatch();
  const { pending } = useAppSelector((s) => s.asyncActions.activateFreeTrial);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.iconCircle}>
          <Ionicons name="rocket-outline" size={52} color={COLORS.primary} />
        </View>
        <Text style={styles.heading}>Start Your Free Trial</Text>
        <Text style={styles.subheading}>
          Get 14 days of full access to Propulse — no credit card required.
        </Text>
      </View>

      {/* Features */}
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>What's included</Text>
        {TRIAL_FEATURES.map((feature, i) => (
          <View key={i} style={styles.featureRow}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </Card>

      {/* CTA */}
      <Button
        onPress={() => dispatch(activateFreeTrial() as any)}
        loading={pending}
        disabled={pending}
        size="large"
        fullWidth
        style={styles.cta}
      >
        Activate Free Trial
      </Button>

      <Text style={styles.disclaimer}>
        No credit card needed. Trial expires after 14 days.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: SIZES.lg, gap: SIZES.lg, paddingBottom: SIZES.xxl },
  hero: { alignItems: 'center', gap: SIZES.md, paddingVertical: SIZES.lg },
  iconCircle: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: COLORS.primaryLight + '22',
    alignItems: 'center', justifyContent: 'center',
  },
  heading: {
    color: COLORS.textPrimary,
    fontSize: SIZES.heading,
    fontWeight: '800',
    textAlign: 'center',
  },
  subheading: {
    color: COLORS.textSecondary,
    fontSize: SIZES.body,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  card: { gap: SIZES.sm },
  cardTitle: {
    color: COLORS.textPrimary,
    fontSize: SIZES.subtitle,
    fontWeight: '700',
    marginBottom: SIZES.xs,
  },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: SIZES.sm },
  featureText: { color: COLORS.textSecondary, fontSize: SIZES.body },
  cta: { marginTop: SIZES.md },
  disclaimer: {
    color: COLORS.textMuted,
    fontSize: SIZES.caption,
    textAlign: 'center',
  },
});

export default FreeTrial;
