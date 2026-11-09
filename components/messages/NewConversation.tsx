import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal, View, Text, TextInput, FlatList, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { createChat } from '@/store/slices/chat';
import { fetchTeamMembers } from '@/store/slices/teams';
import { TeamMember } from '@/types';
import { BRAND_PURPLE } from '@/constants/authTheme';
import { initialOf } from '@/utils/format';
import { FilterPills, SearchField } from '@/components/shared/ListControls';
import { useSettingsTheme } from '@/components/settings/parts';

type Mode = 'direct' | 'group';

// Start a direct message with one teammate, or a group chat with several.
export const NewConversationModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const { theme, accent, light } = useSettingsTheme();
  const { members } = useAppSelector((s) => s.team);
  const { user } = useAppSelector((s) => s.account);
  const { pending: creating } = useAppSelector((s) => s.asyncActions.createChat);
  const { pending: loadingMembers } = useAppSelector((s) => s.asyncActions.fetchTeamMembers);

  const [mode, setMode] = useState<Mode>('direct');
  const [selected, setSelected] = useState<TeamMember[]>([]);
  const [groupName, setGroupName] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (visible) {
      dispatch(fetchTeamMembers() as any);
      setMode('direct');
      setSelected([]);
      setGroupName('');
      setSearch('');
    }
  }, [visible]);

  // /teams/members has one row per person per project, so the same person can appear several times
  const people = useMemo(() => {
    const seen = new Set<string>();
    const out: TeamMember[] = [];
    for (const m of members) {
      if (m.user_id === user?.id || seen.has(m.user_id)) continue;
      seen.add(m.user_id);
      out.push(m);
    }
    const q = search.trim().toLowerCase();
    return q
      ? out.filter((m) => m.user_name?.toLowerCase().includes(q) || m.user_email?.toLowerCase().includes(q))
      : out;
  }, [members, user?.id, search]);

  const palette = [theme.palette.lavender, theme.palette.mint, theme.palette.blue, theme.palette.pink];
  const tintFor = (id: string) => {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
    return palette[h % palette.length];
  };

  const isSelected = (m: TeamMember) => selected.some((x) => x.user_id === m.user_id);
  const toggle = (m: TeamMember) => {
    if (mode === 'direct') setSelected([m]);
    else setSelected((prev) => (isSelected(m) ? prev.filter((x) => x.user_id !== m.user_id) : [...prev, m]));
  };

  const canCreate =
    mode === 'direct' ? selected.length === 1 : selected.length >= 1 && groupName.trim().length > 0;

  const handleCreate = async () => {
    if (!user || !canCreate) return;

    let body: any;
    if (mode === 'direct') {
      // Direct message: participants must include current user + other user
      body = {
        participants: [
          { id: user.id, email: user.email, name: user.first_name ? `${user.first_name} ${user.last_name ?? ''}`.trim() : user.email },
          { id: selected[0].user_id, email: selected[0].user_email, name: selected[0].user_name },
        ],
      };
    } else {
      // Group chat: room object + participants (no need to include self)
      body = {
        participants: selected.map((m) => ({ id: m.user_id, email: m.user_email, name: m.user_name })),
        room: { name: groupName.trim() },
      };
    }

    const result = await dispatch(createChat(body) as any);
    if (result) onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={[styles.root, { backgroundColor: theme.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? 22 : insets.top + 14 }]}>
          <Text style={[styles.title, { color: theme.text }]}>New Conversation</Text>
          <TouchableOpacity
            onPress={onClose}
            style={[styles.closeBtn, { backgroundColor: theme.field }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Close"
          >
            <Ionicons name="close" size={20} color={theme.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.pad}>
          <FilterPills<Mode>
            options={[
              { label: 'Direct Message', value: 'direct' },
              { label: 'Group Chat', value: 'group' },
            ]}
            value={mode}
            onChange={(m: Mode) => {
              setMode(m);
              setSelected([]);
            }}
          />

          {mode === 'group' && (
            <View style={[styles.nameField, { backgroundColor: theme.field, borderColor: theme.fieldBorder }]}>
              <Ionicons name="chatbubbles-outline" size={20} color={theme.placeholder} />
              <TextInput
                value={groupName}
                onChangeText={(v: string) => setGroupName(v)}
                placeholder="Group name"
                placeholderTextColor={theme.placeholder}
                style={[styles.nameInput, { color: theme.text }]}
                maxLength={80}
              />
            </View>
          )}

          {selected.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips} contentContainerStyle={{ gap: 8 }}>
              {selected.map((m) => (
                <TouchableOpacity
                  key={m.user_id}
                  onPress={() => toggle(m)}
                  activeOpacity={0.7}
                  style={[styles.chip, { backgroundColor: theme.palette.lavender.bg }]}
                  accessibilityLabel={`Remove ${m.user_name}`}
                >
                  <Text style={[styles.chipText, { color: accent }]} numberOfLines={1}>{m.user_name}</Text>
                  <Ionicons name="close-circle" size={16} color={accent} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <View style={{ marginTop: 16 }}>
            <SearchField value={search} onChangeText={setSearch} placeholder="Search team members" />
          </View>
        </View>

        {/* People */}
        <FlatList
          data={people}
          keyExtractor={(m: TeamMember) => m.user_id}
          style={{ marginTop: 10 }}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            loadingMembers ? (
              <ActivityIndicator style={{ marginTop: 40 }} color={BRAND_PURPLE} />
            ) : (
              <Text style={[styles.empty, { color: theme.muted }]}>
                {members.length === 0 ? 'No team members yet. Invite people from the Teams tab.' : 'No one matches your search.'}
              </Text>
            )
          }
          renderItem={({ item }: { item: TeamMember }) => {
            const on = isSelected(item);
            const tint = tintFor(item.user_id);
            return (
              <TouchableOpacity
                onPress={() => toggle(item)}
                activeOpacity={0.7}
                style={[styles.row, { borderBottomColor: theme.divider }, on && { backgroundColor: theme.field }]}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
              >
                <View style={[styles.avatar, { backgroundColor: tint.bg }]}>
                  <Text style={{ color: tint.icon, fontSize: 15, fontWeight: '600' }}>{initialOf(item.user_name)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>{item.user_name}</Text>
                  <Text style={[styles.email, { color: theme.muted }]} numberOfLines={1}>{item.user_email}</Text>
                </View>
                <View
                  style={[
                    styles.check,
                    on
                      ? { backgroundColor: BRAND_PURPLE, borderColor: BRAND_PURPLE }
                      : { borderColor: light ? '#C9C6D3' : '#4A4A50' },
                  ]}
                >
                  {on && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                </View>
              </TouchableOpacity>
            );
          }}
        />

        {/* Create */}
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) + 4, backgroundColor: theme.background }]}>
          <TouchableOpacity
            onPress={handleCreate}
            disabled={!canCreate || creating}
            activeOpacity={0.85}
            style={[styles.cta, (!canCreate || creating) && { opacity: 0.5 }]}
            accessibilityRole="button"
          >
            {creating ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.ctaText}>{mode === 'direct' ? 'Start Chat' : 'Create Group'}</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 16,
  },
  title: { fontSize: 22, fontWeight: '700' },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  pad: { paddingHorizontal: 16 },
  nameField: {
    flexDirection: 'row', alignItems: 'center', gap: 10, height: 46, borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 14, marginTop: 14,
  },
  nameInput: { flex: 1, fontSize: 14 },
  chips: { marginTop: 14, flexGrow: 0 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 16, paddingLeft: 12, paddingRight: 8, paddingVertical: 6, maxWidth: 200 },
  chipText: { fontSize: 12, fontWeight: '600' },
  list: { paddingHorizontal: 16, paddingBottom: 16, flexGrow: 1 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth, borderRadius: 8,
  },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 14, fontWeight: '600' },
  email: { fontSize: 11, marginTop: 3 },
  check: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  empty: { textAlign: 'center', fontSize: 13, marginTop: 48, paddingHorizontal: 32, lineHeight: 19 },
  footer: { paddingHorizontal: 16, paddingTop: 8 },
  cta: { height: 46, borderRadius: 10, backgroundColor: BRAND_PURPLE, alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
