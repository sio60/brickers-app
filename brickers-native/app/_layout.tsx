import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox, Platform } from 'react-native';
import { useEffect, useCallback } from 'react';
import 'react-native-reanimated';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, NotoSansKR_400Regular, NotoSansKR_500Medium, NotoSansKR_700Bold } from '@expo-google-fonts/noto-sans-kr';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

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
import { LanguageProvider } from '@/lib/LanguageContext';

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

// 모든 Text 컴포넌트에 기본 폰트 적용 (한글 지원)
import { Text, TextInput } from 'react-native';

// @ts-ignore - defaultProps 설정 (React 19/RN 0.81+에서는 deprecated되었으나, 하위 호환성을 위해 유지하거나 커스텀 컴포넌트 사용 권장)
if ((Text as any).defaultProps == null) {
  (Text as any).defaultProps = {};
}
(Text as any).defaultProps.style = { fontFamily: 'NotoSansKR_400Regular' };

// TextInput에도 기본 폰트 적용
// @ts-ignore
if ((TextInput as any).defaultProps == null) {
  (TextInput as any).defaultProps = {};
}
(TextInput as any).defaultProps.style = { fontFamily: 'NotoSansKR_400Regular' };

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [fontsLoaded] = useFonts({
    NotoSansKR_400Regular,
    NotoSansKR_500Medium,
    NotoSansKR_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      // Check for window.Kakao
      const interval = setInterval(() => {
        if (window.Kakao && !window.Kakao.isInitialized()) {
          window.Kakao.init('c0771e171209e202cad7e02caecb7204');
          console.log('[Layout] Kakao SDK Initialized');
          clearInterval(interval);
        }
      }, 500);

      return () => clearInterval(interval);
    }
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <LanguageProvider>
      <AuthProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="create-selection" options={{ headerShown: false }} />
            <Stack.Screen name="camera" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
            <Stack.Screen name="generation" options={{ headerShown: false, gestureEnabled: false }} />
            <Stack.Screen name="result" options={{ headerShown: false }} />
            <Stack.Screen
              name="my-page"
              options={{
                title: '마이페이지',
                headerTitleStyle: { fontFamily: 'NotoSansKR_700Bold', fontSize: 18 },
                headerTitleAlign: 'center',
                headerBackTitle: '',
                headerShadowVisible: false,
              }}
            />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            <Stack.Screen name="login" options={{ headerShown: false, presentation: 'modal' }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
