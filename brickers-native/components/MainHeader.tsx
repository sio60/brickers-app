import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/AuthContext';

export function MainHeader() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user, isLoggedIn, isLoading, login, logout } = useAuth();

    const handleAuthAction = async () => {
        if (isLoggedIn) {
            // 로그아웃 확인
            Alert.alert(
                '로그아웃',
                '정말 로그아웃 하시겠습니까?',
                [
                    { text: '취소', style: 'cancel' },
                    {
                        text: '로그아웃',
                        style: 'destructive',
                        onPress: async () => {
                            await logout();
                            Alert.alert('완료', '로그아웃되었습니다.');
                        }
                    }
                ]
            );
        } else {
            // 로그인 화면으로 이동
            router.push('/login');
        }
    };

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

                {/* Right Actions */}
                <View style={styles.rightActions}>
                    {isLoading ? (
                        <ActivityIndicator size="small" color="#000" />
                    ) : (
                        <TouchableOpacity onPress={handleAuthAction} style={styles.actionButton}>
                            {isLoggedIn ? (
                                <View style={styles.userInfo}>
                                    {user?.profileImage ? (
                                        <Image
                                            source={{ uri: user.profileImage }}
                                            style={styles.profileImage}
                                        />
                                    ) : (
                                        <Text style={styles.actionText}>👤</Text>
                                    )}
                                    <Text style={styles.nicknameText} numberOfLines={1}>
                                        {user?.nickname || '사용자'}
                                    </Text>
                                </View>
                            ) : (
                                <Text style={styles.actionText}>로그인</Text>
                            )}
                        </TouchableOpacity>
                    )}
                </View>
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
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    profileImage: {
        width: 24,
        height: 24,
        borderRadius: 12,
    },
    nicknameText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#000000',
        maxWidth: 60,
    },
});
