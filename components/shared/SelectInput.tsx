import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  FlatList, ViewStyle
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '@/constants/theme';

interface Option {
  label: string;
  value: string;
}

interface SelectInputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  options: Option[];
  onChange: (value: string) => void;
  error?: string;
  containerStyle?: ViewStyle;
}

const SelectInput: React.FC<SelectInputProps> = ({
  label,
  placeholder = 'Select an option',
  value,
  options,
  onChange,
  error,
  containerStyle,
}) => {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <TouchableOpacity
        style={[styles.trigger, !!error && styles.errorBorder]}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
      >
        <Text style={[styles.triggerText, !selected && styles.placeholder]}>
          {selected?.label ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={COLORS.textMuted} />
      </TouchableOpacity>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={styles.dropdown}>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.option, item.value === value && styles.optionActive]}
                  onPress={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                >
                  <Text style={[styles.optionText, item.value === value && styles.optionTextActive]}>
                    {item.label}
                  </Text>
                  {item.value === value && (
                    <Ionicons name="checkmark" size={18} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: SIZES.md },
  label: {
    color: COLORS.textSecondary,
    fontSize: SIZES.small,
    fontWeight: '500',
    marginBottom: SIZES.xs,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    height: SIZES.inputHeight,
    paddingHorizontal: SIZES.md,
  },
  errorBorder: { borderColor: COLORS.error },
  triggerText: { color: COLORS.textPrimary, fontSize: SIZES.body, flex: 1 },
  placeholder: { color: COLORS.textMuted },
  errorText: { color: COLORS.error, fontSize: SIZES.caption, marginTop: SIZES.xs },
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    padding: SIZES.lg,
  },
  dropdown: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxHeight: 320,
    overflow: 'hidden',
  },
  separator: { height: 1, backgroundColor: COLORS.border },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SIZES.md,
  },
  optionActive: { backgroundColor: COLORS.primaryLight + '11' },
  optionText: { color: COLORS.textPrimary, fontSize: SIZES.body },
  optionTextActive: { color: COLORS.primary, fontWeight: '600' },
});

export default SelectInput;
