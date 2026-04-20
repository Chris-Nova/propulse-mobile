import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  ViewStyle, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '@/constants/theme';

interface DatePickerInputProps {
  label?: string;
  value?: string;
  onChange: (date: string) => void;
  placeholder?: string;
  minDate?: string;
  maxDate?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

// Simple calendar picker - generates a scrollable month view
const DatePickerInput: React.FC<DatePickerInputProps> = ({
  label,
  value,
  onChange,
  placeholder = 'Select date',
  minDate,
  maxDate,
  error,
  containerStyle,
}) => {
  const [open, setOpen] = useState(false);
  const today = new Date();
  const [viewDate, setViewDate] = useState(() => {
    if (value) return new Date(value);
    return today;
  });

  const selected = value ? new Date(value) : null;

  const daysInMonth = (year: number, month: number) =>
    new Date(year, month + 1, 0).getDate();

  const firstDayOfMonth = (year: number, month: number) =>
    new Date(year, month, 1).getDay();

  const formatDisplay = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatISO = (d: Date) => d.toISOString().split('T')[0];

  const isDisabled = (day: number) => {
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const iso = formatISO(d);
    if (minDate && iso < minDate) return true;
    if (maxDate && iso > maxDate) return true;
    return false;
  };

  const selectDay = (day: number) => {
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    if (!isDisabled(day)) {
      onChange(formatISO(d));
      setOpen(false);
    }
  };

  const prevMonth = () =>
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const nextMonth = () =>
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

  const DAYS = daysInMonth(viewDate.getFullYear(), viewDate.getMonth());
  const OFFSET = firstDayOfMonth(viewDate.getFullYear(), viewDate.getMonth());
  const cells = Array.from({ length: OFFSET + DAYS }, (_, i) =>
    i < OFFSET ? null : i - OFFSET + 1
  );

  const monthName = viewDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={[styles.trigger, !!error && styles.errorBorder]}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="calendar-outline" size={18} color={COLORS.textMuted} />
        <Text style={[styles.triggerText, !value && styles.placeholder]}>
          {value ? formatDisplay(value) : placeholder}
        </Text>
        {value && (
          <TouchableOpacity onPress={() => onChange('')}>
            <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={styles.calendar} onStartShouldSetResponder={() => true}>
            {/* Month nav */}
            <View style={styles.calHeader}>
              <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
                <Ionicons name="chevron-back" size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.monthLabel}>{monthName}</Text>
              <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
            {/* Day labels */}
            <View style={styles.dayLabels}>
              {DAY_LABELS.map((d) => (
                <Text key={d} style={styles.dayLabel}>{d}</Text>
              ))}
            </View>
            {/* Days grid */}
            <View style={styles.grid}>
              {cells.map((day, i) => {
                if (!day) return <View key={`e${i}`} style={styles.dayCell} />;
                const iso = formatISO(new Date(viewDate.getFullYear(), viewDate.getMonth(), day));
                const isSelected = selected && formatISO(selected) === iso;
                const disabled = isDisabled(day);
                return (
                  <TouchableOpacity
                    key={iso}
                    onPress={() => selectDay(day)}
                    style={[
                      styles.dayCell,
                      isSelected && styles.selectedDay,
                      disabled && styles.disabledDay,
                    ]}
                    disabled={disabled}
                  >
                    <Text style={[
                      styles.dayText,
                      isSelected && styles.selectedDayText,
                      disabled && styles.disabledDayText,
                    ]}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const CELL = 38;

const styles = StyleSheet.create({
  container: { marginBottom: SIZES.md },
  label: { color: COLORS.textSecondary, fontSize: SIZES.small, fontWeight: '500', marginBottom: SIZES.xs },
  trigger: {
    flexDirection: 'row', alignItems: 'center', gap: SIZES.sm,
    backgroundColor: COLORS.surfaceElevated, borderRadius: SIZES.radiusMd,
    borderWidth: 1.5, borderColor: COLORS.border,
    height: SIZES.inputHeight, paddingHorizontal: SIZES.md,
  },
  errorBorder: { borderColor: COLORS.error },
  triggerText: { flex: 1, color: COLORS.textPrimary, fontSize: SIZES.body },
  placeholder: { color: COLORS.textMuted },
  errorText: { color: COLORS.error, fontSize: SIZES.caption, marginTop: SIZES.xs },
  overlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'center', padding: SIZES.lg },
  calendar: {
    backgroundColor: COLORS.surface, borderRadius: SIZES.radiusLg,
    padding: SIZES.md, borderWidth: 1, borderColor: COLORS.border,
  },
  calHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SIZES.md },
  navBtn: { padding: SIZES.xs },
  monthLabel: { color: COLORS.textPrimary, fontSize: SIZES.subtitle, fontWeight: '700' },
  dayLabels: { flexDirection: 'row', marginBottom: SIZES.xs },
  dayLabel: { width: CELL, textAlign: 'center', color: COLORS.textMuted, fontSize: SIZES.caption, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: CELL, height: CELL, alignItems: 'center', justifyContent: 'center', borderRadius: CELL / 2 },
  selectedDay: { backgroundColor: COLORS.primary },
  disabledDay: { opacity: 0.3 },
  dayText: { color: COLORS.textPrimary, fontSize: SIZES.body },
  selectedDayText: { color: COLORS.white, fontWeight: '700' },
  disabledDayText: { color: COLORS.textMuted },
});

export default DatePickerInput;
