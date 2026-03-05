import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
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
  return (
    <SafeAreaProvider>
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
    </SafeAreaProvider>
  );
}
