import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Image
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateCompanyModel } from '@/store/reducers/misc';
import { createCompanyProfile } from '@/store/slices/company';
import { Input } from '@/components/shared/Input';
import Button from '@/components/shared/Button';
import SelectInput from '@/components/shared/SelectInput';
import FileUpload, { PickedFile } from '@/components/shared/FileUpload';
import { COLORS, SIZES } from '@/constants/theme';
import { INDUSTRIES } from '@/constants/industries';

const CompanySetup = () => {
  const dispatch = useAppDispatch();
  const { model } = useAppSelector((s) => s.company);
  const { pending, message } = useAppSelector((s) => s.asyncActions.createCompanyProfile);

  const update = (key: string, val: string) =>
    dispatch(updateCompanyModel({ [key]: val } as any));

  const disabled = !model.name || !model.username || !model.industry || pending;

  const handleLogoSelected = async (files: PickedFile[]) => {
    if (files[0]) update('logo', files[0].uri);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.heading}>Set up your Company</Text>
          <Text style={styles.subheading}>
            Tell us about your company to personalise your experience.
          </Text>
        </View>

        {/* Logo preview */}
        {model.logo ? (
          <Image source={{ uri: model.logo }} style={styles.logoPreview} resizeMode="cover" />
        ) : null}

        <Input
          label="Company Name *"
          placeholder="e.g. Jilcon Holdings"
          value={model.name}
          onChangeText={(v) => update('name', v)}
          autoCapitalize="words"
        />

        <Input
          label="Company Username *"
          placeholder="e.g. jilcon (no spaces)"
          value={model.username}
          onChangeText={(v) => update('username', v.toLowerCase().replace(/\s/g, ''))}
          autoCapitalize="none"
        />

        <SelectInput
          label="Industry *"
          placeholder="Select your industry"
          value={model.industry}
          options={INDUSTRIES}
          onChange={(v) => update('industry', v)}
        />

        <View style={styles.logoSection}>
          <Text style={styles.logoLabel}>Company Logo / Avatar</Text>
          <FileUpload
            label="Upload Logo"
            accept="images"
            multiple={false}
            onFilesSelected={handleLogoSelected}
          />
        </View>

        {message && !pending ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{message}</Text>
          </View>
        ) : null}

        <Button
          onPress={() => dispatch(createCompanyProfile() as any)}
          loading={pending}
          disabled={disabled}
          fullWidth
          size="large"
          style={styles.submitBtn}
        >
          Continue to Dashboard
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: SIZES.lg,
    gap: SIZES.xs,
    paddingBottom: SIZES.xxl,
  },
  header: { marginBottom: SIZES.lg },
  heading: {
    color: COLORS.textPrimary,
    fontSize: SIZES.heading,
    fontWeight: '700',
    marginBottom: SIZES.xs,
  },
  subheading: {
    color: COLORS.textSecondary,
    fontSize: SIZES.body,
    lineHeight: 22,
  },
  logoPreview: {
    width: 80, height: 80,
    borderRadius: SIZES.radiusMd,
    marginBottom: SIZES.sm,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  logoSection: { gap: SIZES.xs },
  logoLabel: { color: COLORS.textSecondary, fontSize: SIZES.small, fontWeight: '500' },
  errorBox: {
    backgroundColor: COLORS.errorLight,
    padding: SIZES.md,
    borderRadius: SIZES.radiusMd,
  },
  errorText: { color: COLORS.error, fontSize: SIZES.small },
  submitBtn: { marginTop: SIZES.lg },
});

export default CompanySetup;
