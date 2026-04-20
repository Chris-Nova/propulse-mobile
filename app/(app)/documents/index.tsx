import { View, StyleSheet } from 'react-native';
import { DocumentsList } from '@/components/documents/Documents';
import { Screen } from '@/components/shared';

export default function DocumentsScreen() {
  return (
    <Screen title="Documents" scrollable={false}>
      <DocumentsList />
    </Screen>
  );
}

const styles = StyleSheet.create({ container: { flex: 1 } });
