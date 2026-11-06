import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCompanyDetails, saveProfileDetails } from '@/store/slices/teams';
import { BRAND_PURPLE } from '@/constants/authTheme';
import { initialOf } from '@/utils/format';
import { GradientAvatar } from '@/components/shared/GradientAvatar';
import { SettingsShell } from '@/components/settings/SettingsShell';
import { Card, useNotify, useSettingsTheme } from '@/components/settings/parts';

const Field = ({
  label, value, onChangeText, readOnly, placeholder, autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText?: (v: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  autoCapitalize?: 'none' | 'words' | 'sentences';
}) => {
  const { theme } = useSettingsTheme();
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        editable={!readOnly}
        placeholder={placeholder}
        placeholderTextColor={theme.muted}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        style={[
          styles.input,
          { color: readOnly ? theme.muted : theme.text, borderColor: theme.fieldBorder, backgroundColor: readOnly ? theme.field : theme.card },
        ]}
      />
    </View>
  );
};

export const EditProfile = () => {
  const dispatch = useAppDispatch();
  const notify = useNotify();
  const { theme, iconColor } = useSettingsTheme();
  const { user } = useAppSelector((s) => s.account);
  const { pending } = useAppSelector((s) => s.asyncActions.updateUserProfile);

  const originalName =
    user?.name || [user?.first_name, user?.last_name].filter(Boolean).join(' ') || '';

  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [industry, setIndustry] = useState('');
  const [hasCompany, setHasCompany] = useState(false);
  const touchedName = useRef(false);
  const original = useRef({ company: '', industry: '' });

  // Fill the name once the profile is in the store, unless the person already started typing
  useEffect(() => {
    if (!touchedName.current) setFullName(originalName);
  }, [originalName]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const c = await dispatch(fetchCompanyDetails() as any);
      if (!alive || !c) return;
      original.current = { company: c.company_name ?? '', industry: c.industry ?? '' };
      setCompany(c.company_name ?? '');
      setIndustry(c.industry ?? '');
      setHasCompany(true);
    })();
    return () => {
      alive = false;
    };
  }, [dispatch]);

  const onSave = async () => {
    const name = fullName.trim();
    if (!name) return notify('Please enter your full name.', 'error');

    const nameChanged = name !== originalName.trim();
    const companyChanged =
      hasCompany &&
      (company.trim() !== original.current.company || industry.trim() !== original.current.industry);
    if (companyChanged && (!company.trim() || !industry.trim())) {
      return notify("Company name and industry can't be empty.", 'error');
    }
    if (!nameChanged && !companyChanged) return router.back();

    const [first, ...rest] = name.split(/\s+/);
    const ok = await dispatch(
      saveProfileDetails({
        profile: nameChanged ? { first_name: first, last_name: rest.join(' ') } : undefined,
        company: companyChanged ? { company_name: company.trim(), industry: industry.trim() } : undefined,
      }) as any
    );
    if (ok) router.back();
  };

  return (
    <SettingsShell
      title="Edit Profile"
      large
      showLogo={false}
      footer={
        <TouchableOpacity
          onPress={onSave}
          disabled={pending}
          activeOpacity={0.85}
          style={[styles.save, pending && { opacity: 0.7 }]}
          accessibilityRole="button"
        >
          {pending ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveText}>Save Changes</Text>}
        </TouchableOpacity>
      }
    >
      {/* Avatar with ring and camera badge */}
      <View style={styles.avatarWrap}>
        <View style={[styles.ring, { borderColor: BRAND_PURPLE }]}>
          <GradientAvatar uri={user?.avatar} initial={initialOf(fullName || originalName)} size={80} fontSize={32} />
        </View>
        <TouchableOpacity
          onPress={() => notify('Changing your profile photo is coming soon.')}
          activeOpacity={0.8}
          style={[styles.camera, { backgroundColor: theme.palette.lavender.bg, borderColor: BRAND_PURPLE }]}
          accessibilityLabel="Change profile photo"
        >
          <Ionicons name="camera-outline" size={15} color={iconColor} />
        </TouchableOpacity>
      </View>

      <Card style={styles.formCard}>
        <Field label="Full Name" value={fullName} onChangeText={(v: string) => { touchedName.current = true; setFullName(v); }} autoCapitalize="words" />
        <Field label="Email Address" value={user?.email ?? ''} readOnly />
        {hasCompany && (
          <>
            <Field label="Company Name" value={company} onChangeText={(v: string) => setCompany(v)} autoCapitalize="words" />
            <Field label="Industry" value={industry} onChangeText={(v: string) => setIndustry(v)} autoCapitalize="words" />
          </>
        )}
      </Card>
    </SettingsShell>
  );
};

const styles = StyleSheet.create({
  avatarWrap: { alignSelf: 'center', marginBottom: 26 },
  ring: {
    width: 102, height: 102, borderRadius: 51, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  camera: {
    position: 'absolute', right: -4, bottom: 2, width: 28, height: 28, borderRadius: 8, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  formCard: { paddingVertical: 20, paddingHorizontal: 16 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  input: { height: 42, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, fontSize: 13 },
  save: {
    height: 46, borderRadius: 10, backgroundColor: BRAND_PURPLE,
    alignItems: 'center', justifyContent: 'center',
  },
  saveText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
