import { StyleSheet, View, Pressable, Text, Dimensions, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import { Background3D } from '@/components/Background3D';
import { IconSymbol } from '@/components/ui/icon-symbol';
import Animated, { interpolate, useAnimatedStyle, withSpring, useSharedValue, withTiming } from 'react-native-reanimated';
import { useAuth } from '@/lib/AuthContext';
import { Image } from 'expo-image';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = 200;

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isLoggedIn, isLoading, login } = useAuth();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const translateY = useSharedValue(SHEET_HEIGHT);

  const toggleSheet = () => {
    const nextState = !isSheetOpen;
    setIsSheetOpen(nextState);
    translateY.value = withSpring(nextState ? 0 : SHEET_HEIGHT, {
      damping: 20,
      stiffness: 90,
    });
  };

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  const arrowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.value, [0, SHEET_HEIGHT], [0, 1]),
    transform: [{ translateY: interpolate(translateY.value, [0, SHEET_HEIGHT], [20, 0]) }],
  }));

  // 로그인하지 않은 상태의 화면
  if (!isLoading && !isLoggedIn) {
    return (
      <View style={[styles.loginContainer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.loginContent}>
          {/* 로고 영역 */}
          <View style={styles.loginHeader}>
            <Image
              source={require('@/assets/images/logo.png')}
              style={styles.loginLogo}
              contentFit="contain"
            />
            <Text style={styles.loginSubtitle}>나만의 브릭 도안을 만들어보세요</Text>
          </View>

          {/* 로그인 버튼 영역 */}
          <View style={styles.loginSection}>
            <TouchableOpacity
              style={styles.kakaoMainButton}
              onPress={() => login()}
            >
              <Image
                source={require('@/assets/icons/kakao.png')}
                style={styles.kakaoIconMain}
              />
              <Text style={styles.kakaoTextMain}>카카오로 시작하기</Text>
            </TouchableOpacity>
          </View>

          {/* 안내 문구 */}
          <Text style={styles.loginNotice}>
            로그인하면 작업 저장, 갤러리 등록 등{'\n'}
            더 많은 기능을 이용할 수 있어요
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Background3D />

      {/* Main Content (Arrow at bottom) */}
      <View style={[styles.content, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.spacer} />

        <Animated.View style={arrowStyle} pointerEvents={isSheetOpen ? 'none' : 'auto'}>
          <Pressable
            style={styles.arrowContainer}
            onPress={toggleSheet}
          >
            <IconSymbol name="chevron.up" size={40} color="#000" />
            <Text style={styles.hintText}>Click to Create</Text>
          </Pressable>
        </Animated.View>
      </View>

      {/* Slide-up Button Wrapper */}
      <Animated.View style={[styles.sheet, sheetStyle, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.sheetContent}>
          <Pressable
            style={styles.createButton}
            onPress={() => {
              setIsSheetOpen(false);
              translateY.value = SHEET_HEIGHT;
              router.push('/create-selection');
            }}
          >
            <Text style={styles.createButtonText}>Go to create</Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loginContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loginContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loginHeader: {
    alignItems: 'center',
    marginBottom: 60,
  },
  loginLogo: {
    width: 200,
    height: 70,
  },
  loginSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    fontWeight: '500',
    fontFamily: 'NotoSansKR_500Medium',
  },
  loginSection: {
    width: '100%',
    maxWidth: 320,
    marginBottom: 40,
  },
  kakaoMainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE500',
    paddingVertical: 18,
    borderRadius: 14,
    gap: 10,
    // 그림자 효과 (iOS)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // 그림자 효과 (Android)
    elevation: 3,
  },
  kakaoIconMain: {
    width: 24,
    height: 24,
  },
  kakaoTextMain: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000',
    fontFamily: 'NotoSansKR_700Bold',
  },
  loginNotice: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'NotoSansKR_400Regular',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    zIndex: 1,
  },
  spacer: {
    flex: 1,
  },
  arrowContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  hintText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    marginTop: 4,
    fontFamily: 'NotoSansKR_400Regular',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: SHEET_HEIGHT,
    zIndex: 20,
    paddingHorizontal: 24,
  },
  sheetContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButton: {
    backgroundColor: '#000000',
    width: '100%',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    textTransform: 'uppercase',
    fontFamily: 'NotoSansKR_700Bold',
  },
});
