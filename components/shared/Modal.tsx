import React from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '@/constants/theme';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  scrollable?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  children,
  footer,
  scrollable = true,
}) => (
  <RNModal
    visible={visible}
    transparent
    animationType="slide"
    onRequestClose={onClose}
    statusBarTranslucent
  >
    <View style={styles.overlay}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.kav}
      >
        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            {title ? <Text style={styles.title}>{title}</Text> : <View />}
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          {scrollable ? (
            <ScrollView
              contentContainerStyle={styles.body}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {children}
            </ScrollView>
          ) : (
            <View style={styles.body}>{children}</View>
          )}

          {/* Footer */}
          {footer && <View style={styles.footer}>{footer}</View>}
        </View>
      </KeyboardAvoidingView>
    </View>
  </RNModal>
);

// ─── Confirm Dialog ────────────────────────────────────────
interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  danger = false,
}) => (
  <RNModal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
    <View style={styles.overlay}>
      <View style={styles.confirmBox}>
        <Text style={styles.confirmTitle}>{title}</Text>
        <Text style={styles.confirmMessage}>{message}</Text>
        <View style={styles.confirmActions}>
          <TouchableOpacity onPress={onCancel} style={[styles.confirmBtn, styles.confirmBtnCancel]}>
            <Text style={styles.confirmBtnCancelText}>{cancelText}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onConfirm}
            style={[styles.confirmBtn, danger ? styles.confirmBtnDanger : styles.confirmBtnPrimary]}
          >
            <Text style={styles.confirmBtnText}>{confirmText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </RNModal>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  kav: { width: '100%' },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: SIZES.radiusLg * 1.5,
    borderTopRightRadius: SIZES.radiusLg * 1.5,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : SIZES.lg,
  },
  handle: {
    width: 40, height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: SIZES.sm,
    marginBottom: SIZES.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: SIZES.subtitle,
    fontWeight: '700',
    flex: 1,
  },
  closeBtn: { padding: SIZES.xs },
  body: { padding: SIZES.lg, gap: SIZES.md },
  footer: {
    paddingHorizontal: SIZES.lg,
    paddingTop: SIZES.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  // Confirm
  confirmBox: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    margin: SIZES.lg,
    gap: SIZES.md,
    alignSelf: 'center',
    width: '90%',
  },
  confirmTitle: {
    color: COLORS.textPrimary,
    fontSize: SIZES.subtitle,
    fontWeight: '700',
  },
  confirmMessage: {
    color: COLORS.textSecondary,
    fontSize: SIZES.body,
    lineHeight: 22,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: SIZES.sm,
    justifyContent: 'flex-end',
    marginTop: SIZES.sm,
  },
  confirmBtn: {
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radiusMd,
    minWidth: 80,
    alignItems: 'center',
  },
  confirmBtnCancel: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  confirmBtnPrimary: { backgroundColor: COLORS.primary },
  confirmBtnDanger: { backgroundColor: COLORS.error },
  confirmBtnText: { color: COLORS.white, fontWeight: '600', fontSize: SIZES.body },
  confirmBtnCancelText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: SIZES.body },
});

export default Modal;
