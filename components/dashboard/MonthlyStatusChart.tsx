import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CHART, DashboardTheme } from '@/constants/dashboardTheme';

export interface WeekData {
  week: string;
  completed_percentage: number;
  uncompleted_percentage: number;
}

interface Props {
  weeks: WeekData[];
  monthName: string;
  months: { label: string; value: number }[];
  onSelectMonth: (index: number) => void;
  theme: DashboardTheme;
  plotHeight: number;
}

const TICKS = [100, 75, 50, 25, 0];

export const MonthlyStatusChart = ({ weeks, monthName, months, onSelectMonth, theme, plotHeight }: Props) => {
  const [open, setOpen] = useState(false);
  const columns = weeks.length ? weeks : [1, 2, 3, 4].map((n) => ({
    week: `Week ${n}`, completed_percentage: 0, uncompleted_percentage: 0,
  }));

  return (
    <View>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={[styles.dropdown, { borderColor: theme.divider }]}
        activeOpacity={0.8}
      >
        <Text style={[styles.dropdownText, { color: theme.muted }]}>{monthName}</Text>
        <Ionicons name="chevron-down" size={14} color={theme.muted} />
      </TouchableOpacity>

      <View style={{ flexDirection: 'row', marginTop: 4 }}>
        {/* Y axis */}
        <View style={{ height: plotHeight, justifyContent: 'space-between', width: 34 }}>
          {TICKS.map((t) => (
            <Text key={t} style={[styles.tick, { color: theme.muted }]}>{t}%</Text>
          ))}
        </View>

        <View style={{ flex: 1 }}>
          {/* Plot */}
          <View style={{ height: plotHeight }}>
            {TICKS.map((t, i) => (
              <View
                key={t}
                style={[
                  styles.gridLine,
                  { top: (plotHeight * i) / (TICKS.length - 1), backgroundColor: theme.divider },
                ]}
              />
            ))}
            <View style={styles.barsRow}>
              {columns.map((w) => (
                <View key={w.week} style={styles.barGroup}>
                  <View
                    style={[styles.bar, {
                      height: (Math.min(100, w.completed_percentage) / 100) * plotHeight,
                      backgroundColor: CHART.complete,
                    }]}
                  />
                  <View
                    style={[styles.bar, {
                      height: (Math.min(100, w.uncompleted_percentage) / 100) * plotHeight,
                      backgroundColor: CHART.incomplete,
                    }]}
                  />
                </View>
              ))}
            </View>
          </View>
          {/* Week labels */}
          <View style={styles.labelsRow}>
            {columns.map((w) => (
              <Text key={w.week} style={[styles.weekLabel, { color: theme.muted }]}>{w.week}</Text>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: CHART.legendComplete }]} />
          <Text style={[styles.legendText, { color: theme.muted }]}>Complete</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: CHART.incomplete }]} />
          <Text style={[styles.legendText, { color: theme.muted }]}>Incomplete</Text>
        </View>
      </View>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={[styles.sheet, { backgroundColor: theme.sheet, borderColor: theme.cardBorder }]}>
            <FlatList
              data={months}
              keyExtractor={(m) => String(m.value)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => { onSelectMonth(item.value); setOpen(false); }}
                >
                  <Text style={{ color: item.label === monthName ? '#734BA9' : theme.text, fontWeight: item.label === monthName ? '700' : '400' }}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  dropdown: {
    position: 'absolute', right: 0, top: -34, zIndex: 2,
    flexDirection: 'row', alignItems: 'center', gap: 22,
    height: 26, paddingHorizontal: 10, borderRadius: 6, borderWidth: 1,
  },
  dropdownText: { fontSize: 10 },
  tick: { fontSize: 8, lineHeight: 8 },
  gridLine: { position: 'absolute', left: 0, right: 0, height: StyleSheet.hairlineWidth },
  barsRow: { flex: 1, flexDirection: 'row' },
  barGroup: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 8 },
  bar: { width: 14, borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  labelsRow: { flexDirection: 'row', marginTop: 6 },
  weekLabel: { flex: 1, textAlign: 'center', fontSize: 9 },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 28, marginTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendText: { fontSize: 9 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 40 },
  sheet: { maxHeight: 360, borderRadius: 12, borderWidth: 1, paddingVertical: 6 },
  option: { paddingVertical: 12, paddingHorizontal: 18 },
});
