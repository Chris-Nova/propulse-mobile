import React from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  ViewStyle,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '@/constants/theme';

// ─── Screen ────────────────────────────────────────────────
interface ScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
  scrollable?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  padding?: boolean;
  title?: string;
  headerLeft?: React.ReactNode;
}

export const Screen: React.FC<ScreenProps> = ({
  children,
  style,
  scrollable = false,
  refreshing = false,
  onRefresh,
  padding = true,
  title,
  headerLeft,
}) => {
  const content = (
    <View style={[styles.screenInner, padding && styles.screenPadding, style]}>
      {(title || headerLeft) && (
        <View style={styles.screenHeader}>
          {headerLeft && <View style={styles.screenHeaderLeft}>{headerLeft}</View>}
          {title && <Text style={styles.screenTitle}>{title}</Text>}
        </View>
      )}
      {children}
    </View>
  );

  if (scrollable) {
    return (
      <SafeAreaView style={styles.screen}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={COLORS.primary}
              />
            ) : undefined
          }
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return <SafeAreaView style={[styles.screen]}>{content}</SafeAreaView>;
};

// ─── Loader ────────────────────────────────────────────────
interface LoaderProps {
  pending: boolean;
  children?: React.ReactNode;
  fullScreen?: boolean;
}

export const Loader: React.FC<LoaderProps> = ({ pending, children, fullScreen }) => {
  if (!pending) return <>{children}</>;

  return (
    <View style={[styles.loaderContainer, fullScreen && styles.loaderFullScreen]}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );
};

// ─── EmptyState ────────────────────────────────────────────
interface EmptyStateProps {
  title?: string;
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  icon = 'file-tray-outline',
  action,
}) => (
  <View style={styles.emptyContainer}>
    <Ionicons name={icon} size={56} color={COLORS.textMuted} />
    {title && <Text style={styles.emptyTitle}>{title}</Text>}
    <Text style={styles.emptyMessage}>{message}</Text>
    {action}
  </View>
);

// ─── Card ──────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, style, padding = true }) => (
  <View style={[styles.card, padding && styles.cardPadding, style]}>{children}</View>
);

// ─── SectionHeader ─────────────────────────────────────────
interface SectionHeaderProps {
  title: string;
  action?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, action }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {action}
  </View>
);

// ─── Badge ─────────────────────────────────────────────────
interface BadgeProps {
  label: string;
  color?: string;
  bgColor?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  color = COLORS.textPrimary,
  bgColor = COLORS.surfaceElevated,
}) => (
  <View style={[styles.badge, { backgroundColor: bgColor }]}>
    <Text style={[styles.badgeText, { color }]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  screenInner: { flex: 1 },
  screenPadding: { padding: SIZES.md },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  loaderFullScreen: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 999,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.xl,
    gap: SIZES.md,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: SIZES.subtitle,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyMessage: {
    color: COLORS.textSecondary,
    fontSize: SIZES.body,
    textAlign: 'center',
    lineHeight: 22,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardPadding: { padding: SIZES.md },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: SIZES.subtitle,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: SIZES.sm,
    paddingVertical: 3,
    borderRadius: SIZES.radiusFull,
  },
  badgeText: {
    fontSize: SIZES.caption,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  screenHeaderLeft: { marginRight: 12 },
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: SIZES.md,
  },
  screenTitle: {
    color: COLORS.textPrimary,
    fontSize: SIZES.heading,
    fontWeight: '800',
  },
});

// ─── Re-exports for convenience ────────────────────────────
export { default as Avatar } from './Avatar';
export { default as Modal, ConfirmModal } from './Modal';
export { default as FileUpload } from './FileUpload';
export { default as SelectInput } from './SelectInput';
export { default as DatePickerInput } from './DatePickerInput';
export { FeedbackToast } from './FeedbackToast';
