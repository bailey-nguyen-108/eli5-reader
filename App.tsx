import React, { useEffect } from 'react';
import { StatusBar, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppProvider } from './src/context/AppContext';
import ImportScreen from './src/screens/ImportScreen';
import ELI5ReaderScreen from './src/screens/ELI5ReaderScreen';
import LibraryScreen from './src/screens/LibraryScreen';
import NotebookScreen from './src/screens/NotebookScreen';

export type RootStackParamList = {
  Import: undefined;
  Reader: undefined;
  Library: undefined;
  Notebook: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  useEffect(() => {
    if (Platform.OS === 'web') {
      // Load Google Fonts for web
      const link = document.createElement('link');
      link.href = 'https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Playfair+Display:ital@1&display=swap';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
  }, []);

  return (
    <AppProvider>
      <NavigationContainer>
        <StatusBar barStyle="light-content" />
        <Stack.Navigator
          initialRouteName="Library"
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#050505' },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="Import" component={ImportScreen} />
          <Stack.Screen name="Reader" component={ELI5ReaderScreen} />
          <Stack.Screen name="Library" component={LibraryScreen} />
          <Stack.Screen name="Notebook" component={NotebookScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </AppProvider>
  );
}
