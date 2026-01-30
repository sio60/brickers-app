import { StyleSheet, View, Pressable, Text, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import { Background3D } from '@/components/Background3D';
import { IconSymbol } from '@/components/ui/icon-symbol';
import Animated, { useAnimatedStyle, withSpring, useSharedValue, withTiming } from 'react-native-reanimated';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = 200;

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isSheetOpen ? 0.3 : 0),
  }));

  return (
    <View style={styles.container}>
      <Background3D />

      {/* Main Content (Arrow at bottom) */}
      <View style={[styles.content, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.spacer} />

        <Pressable
          style={styles.arrowContainer}
          onPress={toggleSheet}
        >
          <IconSymbol name="chevron.up" size={40} color="#000" />
          <Text style={styles.hintText}>Click to Create</Text>
        </Pressable>
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
  },
});
