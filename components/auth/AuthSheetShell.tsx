import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AUTH_FONT, BRAND_PURPLE, useAuthTheme } from '@/constants/authTheme';
import { BottomGlow } from '@/components/splash/BottomGlow';

const SHEET_RADIUS = 30;

interface Props {
  title: string;
  // One or two lines of instruction shown at the top of the sheet.
  intro: string;
  children: React.ReactNode;
}

// Purple header with a back button + title, and a rounded sheet that holds the form.
export const AuthSheetShell = ({ title, intro, children }: Props) => {
  const theme = useAuthTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { backgroundColor: theme.sheetBackground }]}>
      <StatusBar style="light" />

      {/* Header: its bottom 30pt tucks under the sheet's rounded corners */}
      <View style={[styles.header, { paddingTop: insets.top + 54, height: insets.top + 191 }]}>
        <View style={styles.titleRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={[styles.title, { fontFamily: AUTH_FONT }]}>{title}</Text>
        </View>
      </View>

      <View style={[styles.sheet, { backgroundColor: theme.sheetBackground }]}>
        <BottomGlow color={BRAND_PURPLE} opacity={theme.sheetGlowOpacity} />
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.intro, { color: theme.sheetText, fontFamily: AUTH_FONT }]}>
              {intro}
            </Text>
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { backgroundColor: BRAND_PURPLE, paddingHorizontal: 28 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  title: { color: '#FFFFFF', fontSize: 22, fontWeight: '700' },
  sheet: {
    flex: 1,
    marginTop: -SHEET_RADIUS,
    borderTopLeftRadius: SHEET_RADIUS,
    borderTopRightRadius: SHEET_RADIUS,
    overflow: 'hidden',
  },
  content: { flexGrow: 1, paddingHorizontal: 22, paddingTop: 26, paddingBottom: 48 },
  intro: { fontSize: 15, lineHeight: 21, textAlign: 'center', marginBottom: 32, paddingHorizontal: 24 },
});
