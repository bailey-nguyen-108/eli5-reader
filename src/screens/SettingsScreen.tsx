import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../App';
import ImportSticker from '../components/ImportSticker';
import NavigationBar from '../components/NavigationBar';
import { useAppContext } from '../context/AppContext';
import { notify } from '../utils/dialogs';

type SettingsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Settings'
>;

interface SettingsScreenProps {
  navigation: SettingsScreenNavigationProp;
}

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const insets = useSafeAreaInsets();
  const { settings, updateSettings } = useAppContext();
  const [apiKeyInput, setApiKeyInput] = useState('');

  useEffect(() => {
    setApiKeyInput(settings.openaiApiKey || '');
  }, [settings.openaiApiKey]);

  const handleSaveApiKey = async () => {
    const trimmed = apiKeyInput.trim();
    await updateSettings({ openaiApiKey: trimmed || undefined });
    notify(
      'Saved',
      trimmed
        ? 'OpenAI API key saved on this device.'
        : 'OpenAI API key removed from this device.'
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.pageTitle}>
          <Text style={styles.pageTitleMain}>MY</Text>
          <Text style={styles.pageTitleSub}>Settings</Text>
        </View>
        <ImportSticker />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.cardTitle}>OpenAI API Key</Text>
          <Text style={styles.cardHint}>
            Needed for AI explanations on this iPhone build. Key is stored locally on this device.
          </Text>
          <TextInput
            style={styles.input}
            value={apiKeyInput}
            onChangeText={setApiKeyInput}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="sk-proj-..."
            placeholderTextColor="rgba(255,255,255,0.35)"
          />
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveApiKey} activeOpacity={0.8}>
            <Text style={styles.saveButtonText}>Save API Key</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <NavigationBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 24,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  pageTitle: {
    gap: 2,
  },
  pageTitleMain: {
    fontSize: 32,
    lineHeight: 30,
    fontWeight: '800',
    letterSpacing: -1.28,
    textTransform: 'uppercase',
    color: '#ffffff',
  },
  pageTitleSub: {
    fontFamily: 'Georgia',
    fontStyle: 'italic',
    fontSize: 29,
    fontWeight: '400',
    color: '#ffffff',
  },
  content: {
    flex: 1,
  },
  contentInner: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 120,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: '#101010',
    padding: 16,
    gap: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  cardHint: {
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(255,255,255,0.6)',
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: '#060606',
    color: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  saveButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#4DFF7E',
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 2,
  },
  saveButtonText: {
    color: '#050505',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});
