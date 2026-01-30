import React from 'react';
import { StyleSheet, View, Pressable, Text } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from './ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export function MainHeader() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.content}>
                {/* Empty left side for balance */}
                <View style={styles.sidePlaceholder} />

                {/* Centered Logo */}
                <View style={styles.logoContainer}>
                    <Image
                        source={require('@/assets/images/logo.png')}
                        style={styles.logo}
                        contentFit="contain"
                    />
                </View>

                {/* Right Actions - Removed Gallery/Login as requested */}
                <View style={styles.rightActions} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#ffffff',
        borderBottomWidth: 1.5,
        borderBottomColor: '#000000',
        zIndex: 999,
    },
    content: {
        height: 64,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
    },
    sidePlaceholder: {
        width: 80, // Approximate width of right actions to keep logo centered
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
        width: 140,
        height: 48,
    },
    rightActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#000000',
        backgroundColor: '#ffffff',
    },
    actionButtonPressed: {
        backgroundColor: '#f0f0f0',
    },
    actionText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#000000',
    },
});
