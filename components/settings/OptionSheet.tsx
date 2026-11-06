import React from 'react';
import { Modal, Pressable, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettingsTheme } from '@/components/settings/parts';

export interface Option<T extends string | number> {
  value: T;
  label: string;
}

interface SheetProps<T extends string | number> {
  visible: boolean;
  title: string;
  options: Option<T>[];
  selected: T;
  onSelect: (value: T) => void;
  onClose: () => void;
  footnote?: string;
}

// Bottom sheet with a single-choice list (Appearance, Time Zone, Frequency...).
export function OptionSheet<T extends string | number>({
  visible, title, options, selected, onSelect, onClose, footnote,
}: SheetProps<T>) {
  const { theme, accent } = useSettingsTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close">
        {/* Inner Pressable swallows taps so touching the sheet doesn't close it */}
        <Pressable
          style={[styles.sheet, { backgroundColor: theme.card, paddingBottom: Math.max(insets.bottom, 12) + 12 }]}
          onPress={() => {}}
        >
          <View style={[styles.grab, { backgroundColor: theme.divider }]} />
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          {options.map((o, i) => {
            const on = o.value === selected;
            return (
              <TouchableOpacity
                key={String(o.value)}
                activeOpacity={0.6}
                onPress={() => {
                  onSelect(o.value);
                  onClose();
                }}
                style={[
                  styles.option,
                  i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.divider },
                ]}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
              >
                <Text style={[styles.optionText, { color: on ? accent : theme.text }, on && { fontWeight: '600' }]}>
                  {o.label}
                </Text>
                {on && <Ionicons name="checkmark" size={20} color={accent} />}
              </TouchableOpacity>
            );
          })}
          {!!footnote && <Text style={[styles.footnote, { color: theme.muted }]}>{footnote}</Text>}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 20, paddingTop: 10 },
  grab: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, marginBottom: 14 },
  title: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15 },
  optionText: { fontSize: 14 },
  footnote: { fontSize: 11.5, marginTop: 10 },
});
