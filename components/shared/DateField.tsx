import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BRAND_PURPLE } from '@/constants/authTheme';
import { useDashboardTheme } from '@/constants/dashboardTheme';
import { formatLong } from '@/utils/format';

const pad = (n: number) => String(n).padStart(2, '0');
const toIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

interface Props {
  value?: string; // YYYY-MM-DD
  onChange: (iso: string) => void;
  placeholder?: string;
  minDate?: string; // YYYY-MM-DD, earlier days are disabled
  invalid?: boolean;
}

// Bordered date field (calendar icon, formatted date, chevron) that opens a month calendar.
export const DateField = ({ value, onChange, placeholder = 'Select date', minDate, invalid }: Props) => {
  const theme = useDashboardTheme();
  const light = theme.scheme === 'light';
  const [open, setOpen] = useState(false);
  const start = value ? new Date(`${value}T00:00:00`) : new Date();
  const [cursor, setCursor] = useState(new Date(start.getFullYear(), start.getMonth(), 1));

  const first = cursor.getDay();
  const count = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(first).fill(null), ...Array.from({ length: count }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);

  const move = (delta: number) => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1));

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => { setCursor(new Date(start.getFullYear(), start.getMonth(), 1)); setOpen(true); }}
        style={[
          styles.field,
          { backgroundColor: light ? '#FFFFFF' : theme.field, borderColor: invalid ? '#EF4444' : light ? '#DFDFDF' : theme.fieldBorder },
        ]}
      >
        <Ionicons name="calendar-outline" size={17} color={theme.text} />
        <Text style={[styles.value, { color: value ? theme.text : theme.placeholder }]}>
          {value ? formatLong(value) : placeholder}
        </Text>
        <Ionicons name="chevron-forward" size={15} color={theme.text} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: theme.sheet, borderColor: theme.cardBorder }]}>
            <View style={styles.monthRow}>
              <TouchableOpacity onPress={() => move(-1)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="chevron-back" size={20} color={theme.text} />
              </TouchableOpacity>
              <Text style={{ color: theme.text, fontSize: 15, fontWeight: '700' }}>
                {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
              </Text>
              <TouchableOpacity onPress={() => move(1)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="chevron-forward" size={20} color={theme.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.weekRow}>
              {DAYS.map((d, i) => (
                <Text key={i} style={[styles.dayHead, { color: theme.muted }]}>{d}</Text>
              ))}
            </View>
            {Array.from({ length: cells.length / 7 }, (_, r) => (
              <View key={r} style={styles.weekRow}>
                {cells.slice(r * 7, r * 7 + 7).map((day, i) => {
                  if (!day) return <View key={i} style={styles.cell} />;
                  const iso = toIso(new Date(cursor.getFullYear(), cursor.getMonth(), day));
                  const disabled = !!minDate && iso < minDate;
                  const selected = iso === value;
                  return (
                    <TouchableOpacity
                      key={i}
                      disabled={disabled}
                      onPress={() => { onChange(iso); setOpen(false); }}
                      style={[styles.cell, selected && { backgroundColor: BRAND_PURPLE, borderRadius: 18 }]}
                    >
                      <Text style={{ color: selected ? '#FFFFFF' : theme.text, opacity: disabled ? 0.3 : 1, fontSize: 13 }}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
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
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
  sheet: { borderRadius: 14, borderWidth: 1, padding: 14 },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6, paddingBottom: 10 },
  weekRow: { flexDirection: 'row' },
  dayHead: { flex: 1, textAlign: 'center', fontSize: 11, paddingVertical: 6 },
  cell: { flex: 1, height: 36, alignItems: 'center', justifyContent: 'center' },
});
