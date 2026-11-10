import React from 'react';
import { Modal, Pressable, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DANGER, IconName, useSettingsTheme } from '@/components/settings/parts';

export interface SheetAction {
  label: string;
  icon?: IconName;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

// Bottom sheet listing actions (View, Resend, Revoke...). Unlike Alert, it isn't limited to
// three buttons on Android.
export const ActionSheet = ({
  visible, title, subtitle, actions, onClose,
}: { visible: boolean; title: string; subtitle?: string; actions: SheetAction[]; onClose: () => void }) => {
  const { theme, iconColor, light } = useSettingsTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close">
        <Pressable
          style={[styles.sheet, { backgroundColor: theme.card, paddingBottom: Math.max(insets.bottom, 12) + 12 }]}
          onPress={() => {}}
        >
          <View style={[styles.grab, { backgroundColor: theme.divider }]} />
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>{title}</Text>
          {!!subtitle && <Text style={[styles.subtitle, { color: theme.muted }]} numberOfLines={1}>{subtitle}</Text>}

          <View style={{ marginTop: 8 }}>
            {actions.map((a, i) => {
              const tint = a.destructive ? (light ? DANGER : '#FF7A70') : iconColor;
              return (
                <TouchableOpacity
                  key={a.label}
                  disabled={a.disabled}
                  activeOpacity={0.6}
                  onPress={() => {
                    onClose();
                    a.onPress();
                  }}
                  style={[
                    styles.row,
                    i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.divider },
                    a.disabled && { opacity: 0.4 },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !!a.disabled }}
                >
                  {!!a.icon && <Ionicons name={a.icon} size={20} color={tint} />}
                  <Text style={[styles.label, { color: a.destructive ? tint : theme.text }]}>{a.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 20, paddingTop: 10 },
  grab: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, marginBottom: 14 },
  title: { fontSize: 16, fontWeight: '700' },
  subtitle: { fontSize: 12, marginTop: 3 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16 },
  label: { fontSize: 14.5, fontWeight: '500' },
});
