import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, Linking, Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchDocuments, fetchProjectDocuments, downloadDocument } from '@/store/slices/documents';
import { Document } from '@/types';
import { BRAND_PURPLE } from '@/constants/authTheme';
import { Tint, useDashboardTheme } from '@/constants/dashboardTheme';
import { formatShort } from '@/utils/format';
import { AppHeader } from '@/components/shared/AppHeader';
import { SearchField, Pagination, PageTitle } from '@/components/shared/ListControls';
import { BottomGlow } from '@/components/splash/BottomGlow';

const PAGE_SIZE = 10;

const MIME_LABELS: Record<string, string> = {
  'application/pdf': 'PDF',
  'application/msword': 'DOC',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'application/vnd.ms-excel': 'XLS',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
  'application/vnd.ms-powerpoint': 'PPT',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
  'text/plain': 'TXT',
  'text/csv': 'CSV',
  'application/zip': 'ZIP',
};

// Short label for the type pill: the file extension if there is one ("plan.dxf" -> "DXF"),
// otherwise a known mime type, otherwise a short mime subtype, otherwise "FILE".
// Long values such as "vnd.openxmlformats-officedocument..." must never reach the pill.
const extensionOf = (d: Document) => {
  const m = d.document_name?.match(/\.([A-Za-z0-9]{1,5})$/);
  if (m) return m[1].toUpperCase();
  const mime = (d.mime_type ?? '').toLowerCase();
  if (MIME_LABELS[mime]) return MIME_LABELS[mime];
  const sub = mime.split('/')[1]?.split(/[.+-]/).pop() ?? '';
  if (sub && sub.length <= 5) return sub.toUpperCase();
  const t = (d.type ?? '').toUpperCase();
  return t && t.length <= 5 ? t : 'FILE';
};

const iconFor = (ext: string): { icon: keyof typeof Ionicons.glyphMap; tone: 'pink' | 'lavender' | 'mint' | 'amber' | 'blue' } => {
  if (ext === 'PDF') return { icon: 'document-text-outline', tone: 'pink' };
  if (['DXF', 'DWG'].includes(ext)) return { icon: 'link-outline', tone: 'lavender' };
  if (['DOC', 'DOCX', 'TXT'].includes(ext)) return { icon: 'document-text-outline', tone: 'blue' };
  if (['XLS', 'XLSX', 'CSV'].includes(ext)) return { icon: 'grid-outline', tone: 'mint' };
  if (['PNG', 'JPG', 'JPEG', 'GIF', 'WEBP'].includes(ext)) return { icon: 'image-outline', tone: 'amber' };
  return { icon: 'document-outline', tone: 'lavender' };
};

interface DocumentsListProps {
  projectId?: string;
}

export const DocumentsList: React.FC<DocumentsListProps> = ({ projectId }) => {
  const dispatch = useAppDispatch();
  const theme = useDashboardTheme();
  const { documents } = useAppSelector((s) => s.document);
  const { pending: fetchingAll } = useAppSelector((s) => s.asyncActions.fetchDocuments);
  const { pending: fetchingProject } = useAppSelector((s) => s.asyncActions.fetchProjectDocuments);
  const pending = projectId ? fetchingProject : fetchingAll;

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [downloading, setDownloading] = useState<string | null>(null);

  const reload = () =>
    projectId ? dispatch(fetchProjectDocuments(projectId) as any) : dispatch(fetchDocuments() as any);

  useEffect(() => { reload(); }, [projectId]);
  useEffect(() => { setPage(1); }, [search]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return documents;
    return documents.filter(
      (d) =>
        d.document_name?.toLowerCase().includes(q) ||
        d.type?.toLowerCase().includes(q) ||
        d.project_name?.toLowerCase().includes(q) ||
        d.description?.toLowerCase().includes(q)
    );
  }, [documents, search]);

  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDownload = async (doc: Document) => {
    setDownloading(doc.id);
    try {
      const ok = await downloadDocument(doc.file_url, doc.document_name);
      if (!ok) Alert.alert('Error', 'Could not download file. Try opening it in your browser.');
    } finally {
      setDownloading(null);
    }
  };

  const handleView = (doc: Document) => {
    Linking.openURL(doc.file_url).catch(() => Alert.alert('Error', 'Unable to open this file.'));
  };

  const tintOf = (tone: string): Tint => (theme.palette as any)[tone];

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar style={theme.statusBar} />
      {theme.glow && <BottomGlow color={BRAND_PURPLE} opacity={0.22} />}
      <FlatList
        data={pageItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.screenList}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={pending} onRefresh={reload} tintColor={BRAND_PURPLE} />}
        ListHeaderComponent={
          <View>
            {!projectId && <AppHeader />}
            {!projectId && (
              <View style={{ marginTop: 20 }}>
                <PageTitle
                  title="Documents"
                  subtitle="Manage your document and files. View, edit or delete them anytime."
                />
              </View>
            )}
            <View style={{ marginTop: 16, marginBottom: 16 }}>
              <SearchField value={search} onChangeText={setSearch} placeholder="Search documents by name..." />
            </View>
          </View>
        }
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: theme.muted }]}>
            {pending
              ? 'Loading documents…'
              : search
                ? 'No documents match your search.'
                : 'No documents have been uploaded yet.'}
          </Text>
        }
        renderItem={({ item, index }) => {
          const ext = extensionOf(item);
          const { icon, tone } = iconFor(ext);
          const tint = tintOf(tone);
          const isDownloading = downloading === item.id;
          return (
            <View
              style={[
                styles.docRow,
                { backgroundColor: theme.card, borderColor: theme.cardBorder },
                index === 0 && styles.firstRow,
                index === pageItems.length - 1 && styles.lastRow,
                index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.divider },
              ]}
            >
              <View style={[styles.docTile, { backgroundColor: tint.bg }]}>
                <Ionicons name={icon} size={18} color={tint.icon} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.docName, { color: theme.text }]} numberOfLines={3}>{item.document_name}</Text>
                <Text style={[styles.docDate, { color: theme.muted }]}>
                  {formatShort(item.date_uploaded || item.created_at)}
                </Text>
              </View>
              <View style={styles.docRight}>
                <View style={styles.pillRow}>
                  <View style={[styles.typePill, { backgroundColor: theme.field }]}>
                    <Text style={[styles.typeText, { color: theme.accent }]} numberOfLines={1}>{ext}</Text>
                  </View>
                  <Text style={[styles.sizeText, { color: theme.muted }]}>{item.file_size_formatted || '-'}</Text>
                </View>
                <View style={styles.actions}>
                  <TouchableOpacity onPress={() => handleView(item)} style={styles.action}>
                    <Ionicons name="eye-outline" size={13} color={BRAND_PURPLE} />
                    <Text style={styles.actionText}>View</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDownload(item)} disabled={isDownloading} style={styles.action}>
                    <Ionicons name="download-outline" size={13} color={BRAND_PURPLE} />
                    <Text style={styles.actionText}>{isDownloading ? 'Saving…' : 'Download'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        }}
        ListFooterComponent={
          <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onChange={setPage} variant="prevnext" />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screenList: { paddingHorizontal: 16, paddingBottom: 28, flexGrow: 1 },
  emptyText: { textAlign: 'center', fontSize: 13, marginTop: 40, paddingHorizontal: 24 },
  docRow: {
    flexDirection: 'row', gap: 12, padding: 14, borderLeftWidth: 1, borderRightWidth: 1,
  },
  firstRow: { borderTopWidth: 1, borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  lastRow: { borderBottomWidth: 1, borderBottomLeftRadius: 12, borderBottomRightRadius: 12 },
  docTile: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  docName: { fontSize: 11.5, fontWeight: '600', lineHeight: 15 },
  docDate: { fontSize: 9.5, marginTop: 6 },
  docRight: { alignItems: 'flex-end', justifyContent: 'space-between', gap: 14, flexShrink: 0 },
  pillRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  typePill: { paddingHorizontal: 11, height: 24, maxWidth: 70, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  typeText: { fontSize: 10, fontWeight: '700' },
  sizeText: { fontSize: 11, minWidth: 14, textAlign: 'right', flexShrink: 0 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { color: BRAND_PURPLE, fontSize: 10, fontWeight: '500' },
});
