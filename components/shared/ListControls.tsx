import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BRAND_PURPLE } from '@/constants/authTheme';
import { useDashboardTheme } from '@/constants/dashboardTheme';

export const SearchField = ({
  value, onChangeText, placeholder,
}: { value: string; onChangeText: (v: string) => void; placeholder: string }) => {
  const theme = useDashboardTheme();
  return (
    <View style={[styles.search, { backgroundColor: theme.field, borderColor: theme.fieldBorder }]}>
      <Ionicons name="search-outline" size={20} color={theme.placeholder} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.placeholder}
        style={[styles.searchInput, { color: theme.text }]}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
      />
      {!!value && (
        <TouchableOpacity onPress={() => onChangeText('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close-circle" size={16} color={theme.placeholder} />
        </TouchableOpacity>
      )}
    </View>
  );
};

// Compact, fully rounded segmented filter: each pill is only as wide as its label.
export const FilterPills = <T extends string>({
  options, value, onChange,
}: { options: { label: string; value: T }[]; value: T; onChange: (v: T) => void }) => {
  const theme = useDashboardTheme();
  return (
    <View style={[styles.pillBar, { backgroundColor: theme.field, borderColor: theme.fieldBorder }]}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <TouchableOpacity
            key={o.value}
            onPress={() => onChange(o.value)}
            activeOpacity={0.8}
            style={[styles.pill, active && { backgroundColor: BRAND_PURPLE }]}
          >
            <Text style={[styles.pillText, { color: active ? '#FFFFFF' : theme.pillText }, active && { fontWeight: '600' }]}>
              {o.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

interface PaginationProps {
  page: number; // 1-based
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
  variant: 'numbers' | 'prevnext';
}

export const Pagination = ({ page, pageSize, total, onChange, variant }: PaginationProps) => {
  const theme = useDashboardTheme();
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  // Up to three page buttons, sliding with the current page
  const start = Math.max(1, Math.min(page - 1, pageCount - 2));
  const nums = Array.from({ length: Math.min(3, pageCount) }, (_, i) => start + i);

  const btn = (active = false, disabled = false) => [
    styles.pageBtn,
    { backgroundColor: active ? BRAND_PURPLE : theme.field, opacity: disabled ? 0.45 : 1 },
  ];

  return (
    <View style={styles.pagination}>
      <Text style={[styles.pageInfo, { color: theme.muted }]}>
        Showing {from} to {to} of {total} results
      </Text>
      {variant === 'numbers' ? (
        <View style={styles.pageRow}>
          <TouchableOpacity disabled={page <= 1} onPress={() => onChange(page - 1)} style={btn(false, page <= 1)}>
            <Ionicons name="chevron-back" size={14} color={theme.text} />
          </TouchableOpacity>
          {nums.map((n) => (
            <TouchableOpacity key={n} onPress={() => onChange(n)} style={btn(n === page)}>
              <Text style={{ color: n === page ? '#FFFFFF' : theme.text, fontSize: 12, fontWeight: '600' }}>{n}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity disabled={page >= pageCount} onPress={() => onChange(page + 1)} style={btn(false, page >= pageCount)}>
            <Ionicons name="chevron-forward" size={14} color={theme.text} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.pageRow}>
          <TouchableOpacity
            disabled={page <= 1}
            onPress={() => onChange(page - 1)}
            style={[btn(false, page <= 1), styles.wideBtn]}
          >
            <Text style={{ color: theme.accent, fontSize: 12, fontWeight: '600' }}>Previous</Text>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={page >= pageCount}
            onPress={() => onChange(page + 1)}
            style={[btn(true, page >= pageCount), styles.wideBtn, { flexDirection: 'row', gap: 4 }]}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600' }}>Next</Text>
            <Ionicons name="chevron-forward" size={13} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// Shared page title block: big title, optional subtitle
export const PageTitle = ({ title, subtitle }: { title: string; subtitle?: string }) => {
  const theme = useDashboardTheme();
  return (
    <View>
      <Text style={{ color: theme.text, fontSize: 24, fontWeight: '700' }}>{title}</Text>
      {!!subtitle && <Text style={{ color: theme.text, fontSize: 10.5, marginTop: 4 }}>{subtitle}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  search: {
    height: 42, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, gap: 10,
  },
  searchInput: { flex: 1, fontSize: 13, paddingVertical: 0, height: '100%' },
  pillBar: {
    alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center',
    borderRadius: 999, borderWidth: 1, padding: 3, gap: 2,
  },
  pill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999 },
  pillText: { fontSize: 12 },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 },
  pageInfo: { fontSize: 10 },
  pageRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pageBtn: { minWidth: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  wideBtn: { paddingHorizontal: 16, minWidth: 64 },
});
