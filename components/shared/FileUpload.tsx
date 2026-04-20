import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '@/constants/theme';

export interface PickedFile {
  uri: string;
  name: string;
  size: number;
  mimeType: string;
}

interface FileUploadProps {
  onFilesSelected: (files: PickedFile[]) => void;
  multiple?: boolean;
  accept?: 'images' | 'documents' | 'all';
  label?: string;
  uploading?: boolean;
  existingFiles?: Array<{ name: string; status: string; id: string }>;
  onRemoveFile?: (id: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFilesSelected,
  multiple = true,
  accept = 'all',
  label = 'Upload Files',
  uploading = false,
  existingFiles = [],
  onRemoveFile,
}) => {
  const [picking, setPicking] = useState(false);

  const pickDocuments = async () => {
    setPicking(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        multiple,
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets.length > 0) {
        const files: PickedFile[] = result.assets.map((a) => ({
          uri: a.uri,
          name: a.name,
          size: a.size ?? 0,
          mimeType: a.mimeType ?? 'application/octet-stream',
        }));
        onFilesSelected(files);
      }
    } finally {
      setPicking(false);
    }
  };

  const pickImages = async () => {
    setPicking(true);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') return;
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection: multiple,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
      });
      if (!result.canceled) {
        const files: PickedFile[] = result.assets.map((a) => ({
          uri: a.uri,
          name: a.fileName ?? `image_${Date.now()}.jpg`,
          size: a.fileSize ?? 0,
          mimeType: a.mimeType ?? 'image/jpeg',
        }));
        onFilesSelected(files);
      }
    } finally {
      setPicking(false);
    }
  };

  const handlePick = () => {
    if (accept === 'images') pickImages();
    else pickDocuments();
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={handlePick}
        disabled={picking || uploading}
        style={styles.dropZone}
        activeOpacity={0.75}
      >
        {picking || uploading ? (
          <ActivityIndicator size="small" color={COLORS.primary} />
        ) : (
          <Ionicons name="cloud-upload-outline" size={28} color={COLORS.primary} />
        )}
        <Text style={styles.dropLabel}>{label}</Text>
        <Text style={styles.dropHint}>
          {accept === 'images' ? 'PNG, JPG supported' : 'PDF, DOC, PNG, JPG and more'}
        </Text>
      </TouchableOpacity>

      {existingFiles.length > 0 && (
        <View style={styles.fileList}>
          {existingFiles.map((file) => (
            <View key={file.id} style={styles.fileRow}>
              <Ionicons
                name={
                  file.status === 'uploaded'
                    ? 'checkmark-circle'
                    : file.status === 'uploading'
                    ? 'cloud-upload-outline'
                    : file.status === 'failed'
                    ? 'close-circle'
                    : 'document-outline'
                }
                size={18}
                color={
                  file.status === 'uploaded' ? COLORS.success :
                  file.status === 'failed' ? COLORS.error : COLORS.primary
                }
              />
              <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
              <Text style={[
                styles.fileStatus,
                { color: file.status === 'failed' ? COLORS.error : COLORS.textMuted }
              ]}>
                {file.status}
              </Text>
              {onRemoveFile && (
                <TouchableOpacity onPress={() => onRemoveFile(file.id)} style={styles.removeBtn}>
                  <Ionicons name="close" size={16} color={COLORS.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: SIZES.sm },
  dropZone: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: SIZES.radiusMd,
    padding: SIZES.xl,
    alignItems: 'center',
    gap: SIZES.xs,
    backgroundColor: COLORS.surfaceElevated,
  },
  dropLabel: {
    color: COLORS.textPrimary,
    fontSize: SIZES.body,
    fontWeight: '600',
  },
  dropHint: {
    color: COLORS.textMuted,
    fontSize: SIZES.caption,
  },
  fileList: { gap: SIZES.xs },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.sm,
    backgroundColor: COLORS.surfaceElevated,
    padding: SIZES.sm,
    borderRadius: SIZES.radiusSm,
  },
  fileName: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: SIZES.small,
  },
  fileStatus: {
    fontSize: SIZES.caption,
    textTransform: 'capitalize',
  },
  removeBtn: { padding: 2 },
});

export default FileUpload;
