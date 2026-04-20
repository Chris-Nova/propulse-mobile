import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { createPaymentIntent, createSubscription } from '@/store/slices/billing';
import { fetchSubscriptionPlans } from '@/store/slices/teams';
import Button from '@/components/shared/Button';
import { Card, Badge } from '@/components/shared';
import { COLORS, SIZES } from '@/constants/theme';

const ActivatePlan = () => {
  const { planName } = useLocalSearchParams<{ planName: string }>();
  const dispatch = useAppDispatch();
  const { plans } = useAppSelector((s) => s.account);
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const { pending: creatingIntent } = useAppSelector((s) => s.asyncActions.createPaymentIntent);
  const { pending: subscribing } = useAppSelector((s) => s.asyncActions.createSubscription);

  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const plan = plans.find((p) => p.name === planName || p.display_name?.toLowerCase() === planName?.toLowerCase());

  useEffect(() => {
    if (!plans.length) {
      dispatch(fetchSubscriptionPlans() as any);
    }
  }, []);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const intentData = await dispatch(createPaymentIntent(planName, quantity) as any);

      if (!intentData?.client_secret) {
        Alert.alert('Error', 'Could not create payment. Please try again.');
        return;
      }

      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: intentData.client_secret,
        merchantDisplayName: 'Propulse',
        style: 'alwaysDark',
        defaultBillingDetails: {},
      });

      if (initError) {
        Alert.alert('Error', initError.message);
        return;
      }

      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code !== 'Canceled') {
          Alert.alert('Payment Failed', presentError.message);
        }
        return;
      }

      await dispatch(createSubscription(planName, intentData.payment_method_id ?? '', quantity) as any);
    } finally {
      setLoading(false);
    }
  };

  if (!plan && !plans.length) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!plan) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.error} />
        <Text style={styles.errorText}>Plan "{planName}" not found.</Text>
        <Button onPress={() => router.back()} variant="outline">Go Back</Button>
      </View>
    );
  }

  const features = Object.values(plan.features ?? {}) as Array<{ text: string; supported: boolean }>;
  const priceDisplay = plan.price
    ? `$${plan.price}/${plan.billing_period ?? 'month'}`
    : 'Custom pricing';

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Plan hero */}
      <View style={styles.hero}>
        <View style={styles.iconCircle}>
          <Ionicons name="diamond-outline" size={44} color={COLORS.primary} />
        </View>
        <Text style={styles.planName}>{plan.display_name ?? plan.name}</Text>
        <Text style={styles.price}>{priceDisplay}</Text>
        <Badge label="Most Popular" color={COLORS.white} bgColor={COLORS.primary} />
      </View>

      {/* Features */}
      {features.length > 0 && (
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>What you get</Text>
          {features.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <Ionicons
                name={f.supported ? 'checkmark-circle' : 'close-circle'}
                size={20}
                color={f.supported ? COLORS.success : COLORS.border}
              />
              <Text style={[styles.featureText, !f.supported && styles.unsupportedFeature]}>
                {f.text}
              </Text>
            </View>
          ))}
        </Card>
      )}

      {/* Security note */}
      <Card style={styles.secCard}>
        <View style={styles.secRow}>
          <Ionicons name="lock-closed-outline" size={18} color={COLORS.success} />
          <Text style={styles.secText}>
            Payments are securely processed by Stripe. Cancel anytime.
          </Text>
        </View>
      </Card>

      {/* Subscribe */}
      <Button
        onPress={handleSubscribe}
        loading={loading || creatingIntent || subscribing}
        disabled={loading || creatingIntent || subscribing}
        size="large"
        fullWidth
        style={styles.cta}
      >
        Subscribe to {plan.display_name ?? plan.name}
      </Button>

      <Button onPress={() => router.back()} variant="ghost" style={styles.cancel}>
        Maybe later
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: SIZES.lg, gap: SIZES.lg, paddingBottom: SIZES.xxl },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SIZES.lg, padding: SIZES.xl },
  errorText: { color: COLORS.textSecondary, fontSize: SIZES.body, textAlign: 'center' },
  hero: { alignItems: 'center', gap: SIZES.sm, paddingTop: SIZES.lg },
  iconCircle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: COLORS.primaryLight + '22',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SIZES.sm,
  },
  planName: { color: COLORS.textPrimary, fontSize: SIZES.heading, fontWeight: '800' },
  price: { color: COLORS.primary, fontSize: SIZES.subtitle, fontWeight: '700' },
  card: { gap: SIZES.sm },
  cardTitle: { color: COLORS.textPrimary, fontSize: SIZES.subtitle, fontWeight: '700', marginBottom: SIZES.xs },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: SIZES.sm },
  featureText: { flex: 1, color: COLORS.textSecondary, fontSize: SIZES.body },
  unsupportedFeature: { color: COLORS.textMuted, textDecorationLine: 'line-through' },
  secCard: { backgroundColor: COLORS.successLight + '22' },
  secRow: { flexDirection: 'row', gap: SIZES.sm, alignItems: 'flex-start' },
  secText: { flex: 1, color: COLORS.textSecondary, fontSize: SIZES.small, lineHeight: 20 },
  cta: {},
  cancel: { alignSelf: 'center' },
});

export default ActivatePlan;
