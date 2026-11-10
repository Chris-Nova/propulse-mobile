import React from 'react';
import { View, Text, Switch, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BRAND_PURPLE } from '@/constants/authTheme';
import { useDashboardTheme } from '@/constants/dashboardTheme';
import { useAppDispatch } from '@/store/hooks';
import { showFeedback } from '@/store/reducers/feedback';

export type IconName = keyof typeof Ionicons.glyphMap;

export const useSettingsTheme = () => {
  const theme = useDashboardTheme();
  const light = theme.scheme === 'light';
  return {
    theme,
    light,
    accent: light ? BRAND_PURPLE : theme.tabBar.active,
    iconColor: light ? BRAND_PURPLE : theme.palette.lavender.icon,
  };
};

// Small toast, e.g. for features that are not available yet.
export const useNotify = () => {
  const dispatch = useAppDispatch();
  return (message: string, type: 'info' | 'error' = 'info') =>
    dispatch(showFeedback({ feedbackType: 'notification', type, message }));
};

export const DANGER = '#E33629';

export const IconCircle = ({ icon, size = 40, danger }: { icon: IconName; size?: 40 | 60; danger?: boolean }) => {
  const { theme, iconColor, light } = useSettingsTheme();
  return (
    <View
      style={{
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: danger ? (light ? '#FCE7E4' : 'rgba(239,68,68,0.16)') : theme.palette.lavender.bg,
        alignItems: 'center', justifyContent: 'center',
      }}
    >
      <Ionicons name={icon} size={size === 60 ? 26 : 20} color={danger ? (light ? DANGER : '#FF7A70') : iconColor} />
    </View>
  );
};

export const Card = ({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) => {
  const { theme } = useSettingsTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.card, borderColor: theme.cardBorder },
        theme.shadow && styles.shadow,
        style,
      ]}
    >
      {children}
    </View>
  );
};

interface RowProps {
  icon: IconName;
  title: string;
  subtitle?: string;
  big?: boolean;
  value?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  divider?: boolean;
  dim?: boolean;
  danger?: boolean;
}

export const Row = ({ icon, title, subtitle, big, value, onPress, right, divider, dim, danger }: RowProps) => {
  const { theme } = useSettingsTheme();
  const body = (
    <View
      style={[
        styles.row,
        big && styles.rowBig,
        divider && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.divider },
        dim && { opacity: 0.45 },
      ]}
    >
      <IconCircle icon={icon} size={big ? 60 : 40} danger={danger} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, { color: danger ? DANGER : theme.text }]} numberOfLines={1}>{title}</Text>
        {!!subtitle && <Text style={[styles.rowSub, { color: theme.muted }]}>{subtitle}</Text>}
      </View>
      {!!value && <Text style={[styles.rowValue, { color: theme.muted }]} numberOfLines={1}>{value}</Text>}
      {right ?? (onPress ? <Ionicons name="chevron-forward" size={16} color={theme.muted} /> : null)}
    </View>
  );
  return onPress ? (
    <TouchableOpacity activeOpacity={0.6} onPress={onPress} accessibilityRole="button" accessibilityLabel={title}>
      {body}
    </TouchableOpacity>
  ) : (
    body
  );
};

export const SectionTitle = ({ children }: { children: string }) => {
  const { theme } = useSettingsTheme();
  return <Text style={[styles.sectionTitle, { color: theme.text }]}>{children}</Text>;
};

export const AppSwitch = ({
  value, onValueChange, disabled,
}: { value: boolean; onValueChange: (v: boolean) => void; disabled?: boolean }) => {
  const { light } = useSettingsTheme();
  const off = light ? '#DEDEE2' : '#3A3A3C';
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{ false: off, true: BRAND_PURPLE }}
      thumbColor="#FFFFFF"
      ios_backgroundColor={off}
    />
  );
};

export const Gap = ({ h = 12 }: { h?: number }) => <View style={{ height: h }} />;

const styles = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 14 },
  shadow: {
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 },
  rowBig: { gap: 16, paddingVertical: 16 },
  rowTitle: { fontSize: 13.5, fontWeight: '600' },
  rowSub: { fontSize: 11, marginTop: 3, lineHeight: 15 },
  rowValue: { fontSize: 11.5, maxWidth: 130 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 26, marginBottom: 12 },
});
