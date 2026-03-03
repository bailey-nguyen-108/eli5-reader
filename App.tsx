import React, { useEffect } from 'react';
import { StatusBar, Platform } from 'react-native';
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

const WEB_META = [
  { selector: 'meta[name="theme-color"]', tag: 'meta', attrs: { name: 'theme-color', content: '#050505' } },
  { selector: 'meta[name="apple-mobile-web-app-capable"]', tag: 'meta', attrs: { name: 'apple-mobile-web-app-capable', content: 'yes' } },
  { selector: 'meta[name="apple-mobile-web-app-status-bar-style"]', tag: 'meta', attrs: { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' } },
  { selector: 'meta[name="apple-mobile-web-app-title"]', tag: 'meta', attrs: { name: 'apple-mobile-web-app-title', content: 'ELI5 Reader' } },
  { selector: 'meta[name="mobile-web-app-capable"]', tag: 'meta', attrs: { name: 'mobile-web-app-capable', content: 'yes' } },
  { selector: 'meta[name="viewport"]', tag: 'meta', attrs: { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover' } },
  { selector: 'link[rel="manifest"]', tag: 'link', attrs: { rel: 'manifest', href: '/manifest.json' } },
  { selector: 'link[rel="apple-touch-icon"]', tag: 'link', attrs: { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' } },
];

export default function App() {
  useEffect(() => {
    if (Platform.OS === 'web') {
      // Load Google Fonts for web
      let link = document.head.querySelector('link[data-eli5-fonts="true"]') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.href = 'https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Playfair+Display:ital@1&display=swap';
        link.rel = 'stylesheet';
        link.setAttribute('data-eli5-fonts', 'true');
        document.head.appendChild(link);
      }

      document.title = 'ELI5 Reader';
      document.documentElement.style.backgroundColor = '#050505';
      document.body.style.backgroundColor = '#050505';
      document.body.style.overscrollBehavior = 'none';

      WEB_META.forEach(({ selector, tag, attrs }) => {
        let element = document.head.querySelector(selector) as HTMLElement | null;

        if (!element) {
          element = document.createElement(tag);
          document.head.appendChild(element);
        }

        Object.entries(attrs).forEach(([key, value]) => {
          element?.setAttribute(key, value);
        });
      });

      let styleTag = document.getElementById('eli5-pwa-style') as HTMLStyleElement | null;
      if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'eli5-pwa-style';
        document.head.appendChild(styleTag);
      }

      styleTag.textContent = `
        html, body, #root {
          min-height: 100%;
          background: #050505;
        }

        body {
          margin: 0;
          overscroll-behavior-y: none;
          -webkit-tap-highlight-color: transparent;
        }
      `;

      if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost')) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/sw.js').catch((error) => {
            console.error('Service worker registration failed:', error);
          });
        });
      }
    }
  }, []);

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
