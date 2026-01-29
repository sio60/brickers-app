import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from './ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export function MainHeader() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();
    const tint = Colors[colorScheme ?? 'light'].tint;

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.content}>
                {/* Empty view to help center the logo when there's an action on the right */}
                <View style={styles.sidePlaceholder} />

                {/* Centered Logo */}
                <View style={styles.logoContainer}>
                    <Image
                        source={require('@/assets/images/logo.png')}
                        style={styles.logo}
                        contentFit="contain"
                    />
                </View>

                {/* Gallery Action */}
                <Pressable
                    style={({ pressed }) => [
                        styles.actionButton,
                        pressed && styles.actionButtonPressed
                    ]}
                    onPress={() => router.push('/(tabs)/explore')}
                >
                    <IconSymbol name="safari.fill" size={24} color={tint} />
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        zIndex: 999,
    },
    content: {
        height: 64,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
    },
    sidePlaceholder: {
        width: 44,
    },
    logoContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: -1,
    },
    logo: {
        width: 120,
        height: 40,
    },
    actionButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
    },
    actionButtonPressed: {
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
});
