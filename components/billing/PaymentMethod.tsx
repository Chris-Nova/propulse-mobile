import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { createSetupIntent, addPaymentMethod } from '@/store/slices/billing';
import Button from '@/components/shared/Button';
import { Card } from '@/components/shared';
import { COLORS, SIZES } from '@/constants/theme';

const PaymentMethod = () => {
  const dispatch = useAppDispatch();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const { user } = useAppSelector((s) => s.account);
  const { pending: creatingIntent } = useAppSelector((s) => s.asyncActions.createSetupIntent);
  const [loading, setLoading] = useState(false);

  const hasPaymentMethod = Boolean(user?.stripe_payment_method);

  const handleAddCard = async () => {
    setLoading(true);
    try {
      const intentData = await dispatch(createSetupIntent() as any);
      if (!intentData?.client_secret) {
        Alert.alert('Error', 'Could not create payment setup. Please try again.');
        return;
      }

      const { error: initError } = await initPaymentSheet({
        setupIntentClientSecret: intentData.client_secret,
        merchantDisplayName: 'Propulse',
        style: 'alwaysDark',
      });

      if (initError) {
        Alert.alert('Error', initError.message);
        return;
      }

      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code !== 'Canceled') {
          Alert.alert('Payment Error', presentError.message);
        }
        return;
      }

      // Payment method added via webhook — navigate back
      Alert.alert('Success', 'Payment method added successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.hero}>
        <View style={styles.iconCircle}>
          <Ionicons name="card-outline" size={44} color={COLORS.primary} />
        </View>
        <Text style={styles.heading}>Payment Method</Text>
        <Text style={styles.subheading}>
          Add a card to maintain uninterrupted access to your subscription benefits.
        </Text>
      </View>

      {/* Current status */}
      <Card style={styles.statusCard}>
        <View style={styles.statusRow}>
          <Ionicons
            name={hasPaymentMethod ? 'checkmark-circle' : 'alert-circle'}
            size={22}
            color={hasPaymentMethod ? COLORS.success : COLORS.warning}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.statusTitle}>
              {hasPaymentMethod ? 'Payment method on file' : 'No payment method'}
            </Text>
            <Text style={styles.statusSub}>
              {hasPaymentMethod
                ? 'Your subscription will renew automatically.'
                : 'Add a card to avoid service interruptions.'}
            </Text>
          </View>
        </View>
      </Card>

      {/* Security note */}
      <Card style={styles.securityCard}>
        <View style={styles.secRow}>
          <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.success} />
          <Text style={styles.secText}>
            Your card details are securely handled by Stripe and never stored on our servers.
          </Text>
        </View>
      </Card>

      {/* CTA */}
      <Button
        onPress={handleAddCard}
        loading={loading || creatingIntent}
        disabled={loading || creatingIntent}
        size="large"
        fullWidth
        style={styles.cta}
      >
        {hasPaymentMethod ? 'Update Payment Method' : 'Add Payment Method'}
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: SIZES.lg, gap: SIZES.lg, paddingBottom: SIZES.xxl },
  hero: { alignItems: 'center', gap: SIZES.md, paddingTop: SIZES.lg },
  iconCircle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: COLORS.primaryLight + '22',
    alignItems: 'center', justifyContent: 'center',
  },
  heading: { color: COLORS.textPrimary, fontSize: SIZES.heading, fontWeight: '800', textAlign: 'center' },
  subheading: { color: COLORS.textSecondary, fontSize: SIZES.body, textAlign: 'center', lineHeight: 24, maxWidth: 300 },
  statusCard: { gap: SIZES.xs },
  statusRow: { flexDirection: 'row', gap: SIZES.md, alignItems: 'flex-start' },
  statusTitle: { color: COLORS.textPrimary, fontSize: SIZES.body, fontWeight: '600' },
  statusSub: { color: COLORS.textSecondary, fontSize: SIZES.small, marginTop: 2 },
  securityCard: { backgroundColor: COLORS.successLight + '22', borderColor: COLORS.success + '44' },
  secRow: { flexDirection: 'row', gap: SIZES.sm, alignItems: 'flex-start' },
  secText: { flex: 1, color: COLORS.textSecondary, fontSize: SIZES.small, lineHeight: 20 },
  cta: { marginTop: SIZES.sm },
});

export default PaymentMethod;
