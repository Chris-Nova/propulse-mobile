import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, RefreshControl, Linking, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchDocuments, fetchProjectDocuments, downloadDocument } from '@/store/slices/documents';
import { Card, EmptyState, Loader, SectionHeader, Badge } from '@/components/shared';
import { COLORS, SIZES } from '@/constants/theme';
import { Document } from '@/types';

const TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  pdf: 'document-text',
  doc: 'document',
  docx: 'document',
  png: 'image',
  jpg: 'image',
  jpeg: 'image',
  xls: 'grid',
  xlsx: 'grid',
  csv: 'list',
  mp4: 'videocam',
  mov: 'videocam',
};

const getIcon = (mimeType: string): keyof typeof Ionicons.glyphMap => {
  const ext = mimeType?.split('/')?.[1]?.toLowerCase() ?? '';
  return TYPE_ICONS[ext] ?? 'document-outline';
};

const formatDate = (iso: string) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
};

interface DocumentsListProps {
  projectId?: string;
}

export const DocumentsList: React.FC<DocumentsListProps> = ({ projectId }) => {
  const dispatch = useAppDispatch();
  const { documents } = useAppSelector((s) => s.document);
  const { pending: fetchingAll } = useAppSelector((s) => s.asyncActions.fetchDocuments);
  const { pending: fetchingProject } = useAppSelector((s) => s.asyncActions.fetchProjectDocuments);
  const pending = projectId ? fetchingProject : fetchingAll;

  const [search, setSearch] = useState('');
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    if (projectId) {
      dispatch(fetchProjectDocuments(projectId) as any);
    } else {
      dispatch(fetchDocuments() as any);
    }
  }, [projectId]);

  const filtered = documents.filter((d) => {
    const q = search.toLowerCase();
    return (
      d.document_name?.toLowerCase().includes(q) ||
      d.type?.toLowerCase().includes(q) ||
      d.project_name?.toLowerCase().includes(q) ||
      d.description?.toLowerCase().includes(q)
    );
  });

  const handleDownload = async (doc: Document) => {
    setDownloading(doc.id);
    try {
      const ok = await downloadDocument(doc.file_url, doc.document_name);
      if (!ok) {
        Alert.alert('Error', 'Could not download file. Try opening it in your browser.');
      }
    } finally {
      setDownloading(null);
    }
  };

  const handleView = (doc: Document) => {
    Linking.openURL(doc.file_url).catch(() =>
      Alert.alert('Error', 'Unable to open this file.')
    );
  };

  if (pending && !documents.length) return <Loader pending fullScreen />;

  return (
    <View style={{ flex: 1 }}>
      {/* Search bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color={COLORS.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, type, project..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={pending}
            onRefresh={() =>
              projectId
                ? dispatch(fetchProjectDocuments(projectId) as any)
                : dispatch(fetchDocuments() as any)
            }
            tintColor={COLORS.primary}
          />
        }
        ListHeaderComponent={
          <SectionHeader title={`Documents (${filtered.length})`} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="folder-open-outline"
            title="No documents found"
            message={search ? 'Try a different search term.' : 'No documents have been uploaded yet.'}
          />
        }
        renderItem={({ item }) => {
          const isDownloading = downloading === item.id;
          const ext = item.mime_type?.split('/')?.[1]?.toUpperCase() ?? item.type?.toUpperCase() ?? '—';

          return (
            <Card style={styles.docCard}>
              {/* Icon */}
              <View style={styles.iconWrap}>
                <Ionicons name={getIcon(item.mime_type)} size={28} color={COLORS.primary} />
              </View>

              {/* Info */}
              <View style={styles.docInfo}>
                <Text style={styles.docName} numberOfLines={2}>{item.document_name}</Text>
                <View style={styles.docMeta}>
                  <Badge label={ext} color={COLORS.primary} bgColor={COLORS.infoLight + '33'} />
                  {item.file_size_formatted && (
                    <Text style={styles.metaText}>{item.file_size_formatted}</Text>
                  )}
                  {item.project_name && (
                    <Text style={styles.metaText} numberOfLines={1}>{item.project_name}</Text>
                  )}
                </View>
                <Text style={styles.metaDate}>{formatDate(item.date_uploaded || item.created_at)}</Text>
              </View>

              {/* Actions */}
              <View style={styles.docActions}>
                <TouchableOpacity onPress={() => handleView(item)} style={styles.actionBtn}>
                  <Ionicons name="eye-outline" size={20} color={COLORS.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDownload(item)}
                  disabled={isDownloading}
                  style={styles.actionBtn}
                >
                  <Ionicons
                    name={isDownloading ? 'cloud-download' : 'download-outline'}
                    size={20}
                    color={isDownloading ? COLORS.textMuted : COLORS.success}
                  />
                </TouchableOpacity>
              </View>
            </Card>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.sm,
    margin: SIZES.md,
    marginBottom: 0,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SIZES.md,
    height: 44,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: SIZES.body,
  },
  list: {
    padding: SIZES.md,
    gap: SIZES.sm,
    flexGrow: 1,
  },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.md,
  },
  iconWrap: {
    width: 48, height: 48,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.infoLight + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docInfo: { flex: 1, gap: 3 },
  docName: {
    color: COLORS.textPrimary,
    fontSize: SIZES.body,
    fontWeight: '600',
    lineHeight: 20,
  },
  docMeta: { flexDirection: 'row', alignItems: 'center', gap: SIZES.xs, flexWrap: 'wrap' },
  metaText: { color: COLORS.textMuted, fontSize: SIZES.caption },
  metaDate: { color: COLORS.textMuted, fontSize: SIZES.caption, marginTop: 2 },
  docActions: { gap: SIZES.xs },
  actionBtn: {
    width: 36, height: 36,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default DocumentsList;
