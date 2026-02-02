import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import 'react-native-reanimated';

// Polyfills for Three.js / LDrawLoader on Native
import { decode, encode } from 'base-64';
if (!global.atob) global.atob = decode;
if (!global.btoa) global.btoa = encode;

const { TextEncoder, TextDecoder } = require('text-encoding');
if (!global.TextEncoder) global.TextEncoder = TextEncoder;
if (!global.TextDecoder) global.TextDecoder = TextDecoder;

import { Buffer } from 'buffer';
if (!global.Buffer) global.Buffer = Buffer;

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/lib/AuthContext';

// LDrawLoader 관련 에러는 부분적인 파츠 로딩 실패이므로 무시
// 모델 자체는 대부분 렌더링됨
LogBox.ignoreLogs([
  'LDrawLoader',
  'Subobject',
  '404',
  'failed to load',
  'wpin2.dat',
  'bump5000.dat',
]);

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="create-selection" options={{ headerShown: false }} />
          <Stack.Screen name="camera" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
          <Stack.Screen name="generation" options={{ headerShown: false, gestureEnabled: false }} />
          <Stack.Screen name="result" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          <Stack.Screen name="login" options={{ headerShown: false, presentation: 'modal' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}
