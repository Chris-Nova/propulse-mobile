import React, { useEffect, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { changePassword } from '@/store/slices/teams';
import { StripeProvider, useStripe } from '@stripe/stripe-react-native';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchUserProfile,
  updateUserProfile,
  fetchSubscription,
  fetchSubscriptionPlans,
  fetchSubscriptionQuota,
} from '@/store/slices/teams';
import { signOut } from '@/store/slices/auth';
import { updateUserModel } from '@/store/reducers/account';
import { Card, Loader, SectionHeader, Badge } from '@/components/shared';
import Button from '@/components/shared/Button';
import { Input, PasswordInput } from '@/components/shared/Input';
import { COLORS, SIZES } from '@/constants/theme';
import { Plan, PlanNames } from '@/types';

const STRIPE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';

// ─── Plan Card ─────────────────────────────────────────────
const PlanCard = ({ plan, isActive, onSelect }: { plan: Plan; isActive: boolean; onSelect: () => void }) => {
  const planColors: Record<PlanNames, string> = {
    basic: COLORS.success,
    pro: COLORS.primary,
    enterprise: COLORS.warning,
  };
  const color = planColors[plan.name] ?? COLORS.primary;

  return (
    <TouchableOpacity onPress={onSelect} activeOpacity={0.8}>
      <Card style={[styles.planCard, isActive && { borderColor: color }]}>
        {isActive && (
          <View style={[styles.activePlanBadge, { backgroundColor: color }]}>
            <Text style={styles.activePlanText}>Current Plan</Text>
          </View>
        )}
        <Text style={[styles.planName, { color }]}>{plan.display_name}</Text>
        <Text style={styles.planPrice}>
          ${plan.price}
          <Text style={styles.planUnit}>/{plan.billing_unit === 'per_seat' ? 'seat' : 'company'}/mo</Text>
        </Text>
        <View style={styles.planFeatures}>
          {Object.values(plan.features).slice(0, 4).map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <Ionicons
                name={f.supported ? 'checkmark-circle' : 'close-circle'}
                size={16}
                color={f.supported ? COLORS.success : COLORS.textMuted}
              />
              <Text style={[styles.featureText, !f.supported && styles.featureTextDisabled]}>
                {f.text}
              </Text>
            </View>
          ))}
        </View>
        {!isActive && (
          <Button onPress={onSelect} fullWidth size="small" style={{ marginTop: SIZES.md }}>
            Choose {plan.display_name}
          </Button>
        )}
      </Card>
    </TouchableOpacity>
  );
};

// ─── Account Screen ────────────────────────────────────────
export const Account = () => {
  const dispatch = useAppDispatch();
  const { user, model, subscription, plans, quota } = useAppSelector((s) => s.account);
  const { pending: updatingProfile } = useAppSelector((s) => s.asyncActions.updateUserProfile);
  const { pending: loadingProfile } = useAppSelector((s) => s.asyncActions.fetchUserProfile);
  const [activeSection, setActiveSection] = useState<'profile' | 'subscription' | 'security'>('profile');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  useEffect(() => {
    dispatch(fetchUserProfile() as any);
    dispatch(fetchSubscription() as any);
    dispatch(fetchSubscriptionPlans() as any);
    dispatch(fetchSubscriptionQuota() as any);
  }, []);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => dispatch(signOut() as any) },
    ]);
  };

  if (loadingProfile && !user) return <Loader pending fullScreen />;

  const subStatusColor =
    subscription.status === 'active' ? COLORS.success :
    subscription.status === 'trialing' ? COLORS.warning : COLORS.error;

  return (
    <StripeProvider publishableKey={STRIPE_KEY}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <TouchableOpacity onPress={pickAvatar} activeOpacity={0.8} style={styles.avatarWrapper}>
            {avatarUri || user?.avatar ? (
              <Image
                source={{ uri: avatarUri || user?.avatar }}
                style={styles.avatarLarge}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.avatarLarge, styles.avatarFallback]}>
                <Text style={styles.avatarLargeText}>
                  {user?.first_name?.charAt(0)?.toUpperCase() ?? '?'}
                </Text>
              </View>
            )}
            <View style={styles.avatarEditBadge}>
              <Ionicons name="camera" size={14} color={COLORS.white} />
            </View>
          </TouchableOpacity>
          <Text style={styles.userName}>{user?.first_name ? `${user.first_name} ${user.last_name ?? ''}`.trim() : user?.name ?? ''}</Text>
          <Text style={styles.userEmail}>{user?.email ?? ''}</Text>
          <Badge
            label={subscription.status}
            color={subStatusColor}
            bgColor={subStatusColor + '22'}
          />
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabs}>
          {(['profile', 'subscription', 'security'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveSection(tab)}
              style={[styles.tab, activeSection === tab && styles.tabActive]}
            >
              <Text style={[styles.tabText, activeSection === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Profile Section */}
        {activeSection === 'profile' && (
          <View style={styles.section}>
            <Input
              label="Full Name"
              value={model?.name ?? ''}
              onChangeText={(v) => dispatch(updateUserModel({ name: v }))}
              placeholder="Your full name"
            />
            <Input
              label="Email"
              value={model?.email ?? ''}
              onChangeText={(v) => dispatch(updateUserModel({ email: v }))}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={false}
              containerStyle={{ opacity: 0.6 }}
            />
            <Button
              onPress={() => dispatch(updateUserProfile() as any)}
              loading={updatingProfile}
              fullWidth
              size="large"
            >
              Save Changes
            </Button>
          </View>
        )}

        {/* Subscription Section */}
        {activeSection === 'subscription' && (
          <View style={styles.section}>
            <Card style={styles.subCard}>
              <Text style={styles.subTitle}>Current Subscription</Text>
              <View style={styles.subRow}>
                <Text style={styles.subLabel}>Plan</Text>
                <Text style={styles.subValue}>{subscription.plan?.display_name ?? 'None'}</Text>
              </View>
              <View style={styles.subRow}>
                <Text style={styles.subLabel}>Status</Text>
                <Badge label={subscription.status} color={subStatusColor} bgColor={subStatusColor + '22'} />
              </View>
              {subscription.end_date && (
                <View style={styles.subRow}>
                  <Text style={styles.subLabel}>Renewal</Text>
                  <Text style={styles.subValue}>
                    {new Date(subscription.end_date).toLocaleDateString()}
                  </Text>
                </View>
              )}
            </Card>

            {/* Quota */}
            <Card style={styles.subCard}>
              <Text style={styles.subTitle}>Usage Quota</Text>
              <View style={styles.quotaItem}>
                <Text style={styles.quotaLabel}>Projects</Text>
                <Text style={styles.quotaValue}>
                  {quota.active_projects.used} / {quota.active_projects.allocated === 'unlimited' ? '∞' : quota.active_projects.allocated}
                </Text>
              </View>
              <View style={styles.quotaItem}>
                <Text style={styles.quotaLabel}>Team Members</Text>
                <Text style={styles.quotaValue}>
                  {quota.users.admin.used} / {quota.users.admin.allocated === 'unlimited' ? '∞' : quota.users.admin.allocated}
                </Text>
              </View>
            </Card>

            <SectionHeader title="Available Plans" />
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isActive={subscription.plan?.name === plan.name}
                onSelect={() => router.push(`/subscription/activate/${plan.name}`)}
              />
            ))}
          </View>
        )}

        {/* Security Section */}
        {activeSection === 'security' && (
          <View style={styles.section}>
            <PasswordInput
              label="Current Password"
              placeholder="Enter current password"
              value={(model as any)?.current_password ?? ''}
              onChangeText={(v) => dispatch(updateUserModel({ current_password: v } as any))}
            />
            <PasswordInput
              label="New Password"
              placeholder="Min. 8 characters"
              value={(model as any)?.new_password ?? ''}
              onChangeText={(v) => dispatch(updateUserModel({ new_password: v } as any))}
            />
            <Button fullWidth size="large" onPress={() => {}}>
              Update Password
            </Button>
          </View>
        )}

        {/* Sign Out */}
        <Button
          onPress={handleSignOut}
          variant="outline"
          fullWidth
          style={styles.signOutBtn}
        >
          Sign Out
        </Button>
      </ScrollView>
    </StripeProvider>
  );
};

const styles = StyleSheet.create({
  container: { padding: SIZES.md, gap: SIZES.md },
  profileHeader: { alignItems: 'center', paddingVertical: SIZES.lg, gap: SIZES.sm },
  avatarWrapper: { position: 'relative', alignSelf: 'center' },
  avatarEditBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: COLORS.background,
  },
  avatarFallback: { backgroundColor: COLORS.primaryDark, alignItems: 'center', justifyContent: 'center' },
  avatarLarge: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.primaryDark,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarLargeText: { color: COLORS.white, fontSize: 32, fontWeight: '700' },
  userName: { color: COLORS.textPrimary, fontSize: SIZES.heading, fontWeight: '700' },
  userEmail: { color: COLORS.textSecondary, fontSize: SIZES.body },
  tabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: SIZES.radiusMd,
    padding: 4,
  },
  tab: { flex: 1, paddingVertical: SIZES.sm, borderRadius: SIZES.radiusSm, alignItems: 'center' },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { color: COLORS.textSecondary, fontSize: SIZES.small, fontWeight: '600' },
  tabTextActive: { color: COLORS.white },
  section: { gap: SIZES.md },
  planCard: { marginBottom: 0, position: 'relative', borderWidth: 1.5 },
  activePlanBadge: {
    position: 'absolute', top: -10, right: SIZES.md,
    paddingHorizontal: SIZES.sm, paddingVertical: 2,
    borderRadius: SIZES.radiusFull,
  },
  activePlanText: { color: COLORS.white, fontSize: SIZES.caption, fontWeight: '600' },
  planName: { fontSize: SIZES.subtitle, fontWeight: '700', marginBottom: SIZES.xs },
  planPrice: { color: COLORS.textPrimary, fontSize: SIZES.heading, fontWeight: '700' },
  planUnit: { color: COLORS.textSecondary, fontSize: SIZES.small, fontWeight: '400' },
  planFeatures: { marginTop: SIZES.md, gap: SIZES.xs },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: SIZES.xs },
  featureText: { color: COLORS.textSecondary, fontSize: SIZES.small },
  featureTextDisabled: { color: COLORS.textMuted, textDecorationLine: 'line-through' },
  subCard: { gap: SIZES.sm },
  subTitle: { color: COLORS.textPrimary, fontSize: SIZES.subtitle, fontWeight: '600', marginBottom: SIZES.xs },
  subRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subLabel: { color: COLORS.textSecondary, fontSize: SIZES.small },
  subValue: { color: COLORS.textPrimary, fontSize: SIZES.small, fontWeight: '600' },
  quotaItem: { flexDirection: 'row', justifyContent: 'space-between' },
  quotaLabel: { color: COLORS.textSecondary, fontSize: SIZES.small },
  quotaValue: { color: COLORS.textPrimary, fontSize: SIZES.small, fontWeight: '600' },
  signOutBtn: { marginTop: SIZES.lg },
});
