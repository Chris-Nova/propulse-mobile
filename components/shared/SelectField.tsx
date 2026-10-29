import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BRAND_PURPLE } from '@/constants/authTheme';
import { useDashboardTheme } from '@/constants/dashboardTheme';

export interface SelectOption { label: string; value: string; sub?: string }

interface Props {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  placeholder: string;
  value?: string;
  options: SelectOption[];
  onSelect: (value: string) => void;
  title?: string;
  emptyText?: string;
  invalid?: boolean;
}

// A bordered field that opens a bottom sheet of options (used by Invite and Create Project).
export const SelectField = ({ icon, placeholder, value, options, onSelect, title, emptyText, invalid }: Props) => {
  const theme = useDashboardTheme();
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  const light = theme.scheme === 'light';

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
        style={[
          styles.field,
          { backgroundColor: light ? '#FFFFFF' : theme.field, borderColor: invalid ? '#EF4444' : light ? '#DFDFDF' : theme.fieldBorder },
        ]}
      >
        <Ionicons name={icon} size={17} color={theme.text} />
        <Text
          style={[styles.value, { color: selected ? theme.text : theme.placeholder }]}
          numberOfLines={1}
        >
          {selected?.label ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={theme.text} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: theme.sheet, borderColor: theme.cardBorder }]}>
            {!!title && <Text style={[styles.sheetTitle, { color: theme.text }]}>{title}</Text>}
            <FlatList
              data={options}
              keyExtractor={(o) => o.value}
              ListEmptyComponent={
                <Text style={[styles.empty, { color: theme.muted }]}>{emptyText ?? 'Nothing to choose from yet.'}</Text>
              }
              renderItem={({ item }) => {
                const active = item.value === value;
                return (
                  <TouchableOpacity
                    style={styles.option}
                    onPress={() => { onSelect(item.value); setOpen(false); }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: active ? BRAND_PURPLE : theme.text, fontWeight: active ? '700' : '500', fontSize: 14 }}>
                        {item.label}
                      </Text>
                      {!!item.sub && <Text style={{ color: theme.muted, fontSize: 11, marginTop: 2 }}>{item.sub}</Text>}
                    </View>
                    {active && <Ionicons name="checkmark" size={18} color={BRAND_PURPLE} />}
                  </TouchableOpacity>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  field: {
    height: 42, borderRadius: 10, borderWidth: 1, flexDirection: 'row', alignItems: 'center',
    gap: 14, paddingHorizontal: 16,
  },
  value: { flex: 1, fontSize: 12.5 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 28 },
  sheet: { maxHeight: 420, borderRadius: 14, borderWidth: 1, paddingVertical: 8 },
  sheetTitle: { fontSize: 14, fontWeight: '700', paddingHorizontal: 18, paddingVertical: 10 },
  option: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 18 },
  empty: { textAlign: 'center', fontSize: 12.5, paddingVertical: 22, paddingHorizontal: 18 },
});
