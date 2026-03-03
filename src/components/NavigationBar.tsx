import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../App';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function NavigationBar() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const insets = useSafeAreaInsets();

  const isLibrary = route.name === 'Library';
  const isImport = route.name === 'Import';
  const isNotebook = route.name === 'Notebook';

  return (
    <View style={[styles.navIsland, { bottom: Math.max(insets.bottom, 18) + 14 }]}>
      {/* Home Icon - Library */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => navigation.navigate('Library')}
      >
        <Svg width="24" height="24" viewBox="0 0 24 24">
          <Path
            d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
            stroke={isLibrary ? '#4DFF7E' : '#888'}
            strokeWidth="2"
            fill="none"
          />
        </Svg>
      </TouchableOpacity>

      {/* Plus Icon - Upload/Import */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => navigation.navigate('Import')}
      >
        <Svg width="24" height="24" viewBox="0 0 24 24">
          <Path
            d="M12 5v14M5 12h14"
            stroke={isImport ? '#4DFF7E' : '#888'}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </Svg>
      </TouchableOpacity>

      {/* Notes Icon - Notebook */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => navigation.navigate('Notebook')}
      >
        <Svg width="24" height="24" viewBox="0 0 24 24">
          <Path
            d="M11 4H4v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"
            stroke={isNotebook ? '#4DFF7E' : '#888'}
            strokeWidth="2"
            fill="none"
          />
          <Path
            d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
            stroke={isNotebook ? '#4DFF7E' : '#888'}
            strokeWidth="2"
            fill="none"
          />
        </Svg>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  navIsland: {
    position: 'absolute',
    left: '50%',
    transform: [{ translateX: -92 }],
    backgroundColor: 'rgba(25, 25, 25, 0.95)',
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 40,
    flexDirection: 'row',
    gap: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 40,
    elevation: 10,
  },
  navItem: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
