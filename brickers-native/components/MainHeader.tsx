import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, ActivityIndicator, Modal, TouchableWithoutFeedback } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/AuthContext';

export function MainHeader() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user, isLoggedIn, isLoading, logout } = useAuth();
    const [menuVisible, setMenuVisible] = useState(false);

    const handleAuthAction = () => {
        if (isLoggedIn) {
            setMenuVisible(true);
        } else {
            router.push('/login');
        }
    };

    const handleLogout = async () => {
        setMenuVisible(false);
        Alert.alert(
            '로그아웃',
            '정말 로그아웃 하시겠어요?',
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
    };

    const handleMyPage = () => {
        setMenuVisible(false);
        router.push('/my-page');
    };

    const handleGallery = () => {
        setMenuVisible(false);
        router.push('/(tabs)/explore');
    };

    const handleBrickBot = () => {
        setMenuVisible(false);
        router.push('/brick-bot');
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.content}>
                <View style={styles.sidePlaceholder} />

                <View style={styles.logoContainer}>
                    <Image
                        source={require('@/assets/images/logo.png')}
                        style={styles.logo}
                        contentFit="contain"
                    />
                </View>

                <View style={styles.rightActions}>
                    {isLoading ? (
                        <ActivityIndicator size="small" color="#000" />
                    ) : isLoggedIn ? (
                        <TouchableOpacity onPress={handleAuthAction} style={styles.profileButton}>
                            <Image
                                source={user?.profileImage ? { uri: user.profileImage } : require('@/assets/icons/kakao.png')}
                                style={styles.profileImage}
                            />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity onPress={handleAuthAction} style={styles.kakaoButton}>
                            <Image
                                source={require('@/assets/icons/kakao.png')}
                                style={styles.kakaoIcon}
                                contentFit="contain"
                            />
                            <Text style={styles.kakaoText}>로그인</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <Modal
                visible={menuVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setMenuVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <View style={[styles.menuContainer, { top: insets.top + 56 }]}>
                            <TouchableOpacity style={styles.menuItem} onPress={handleMyPage}>
                                <View style={styles.menuItemRow}>
                                    <Ionicons name="person-circle-outline" size={20} color="#333" />
                                    <Text style={styles.menuItemText}>마이페이지</Text>
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.menuItem} onPress={handleGallery}>
                                <View style={styles.menuItemRow}>
                                    <Ionicons name="images-outline" size={20} color="#333" />
                                    <Text style={styles.menuItemText}>갤러리</Text>
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.menuItem} onPress={handleBrickBot}>
                                <View style={styles.menuItemRow}>
                                    <Ionicons name="chatbubble-ellipses-outline" size={20} color="#333" />
                                    <Text style={styles.menuItemText}>브릭봇 문의</Text>
                                </View>
                            </TouchableOpacity>
                            <View style={styles.menuDivider} />
                            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                                <View style={styles.menuItemRow}>
                                    <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
                                    <Text style={[styles.menuItemText, { color: '#FF3B30' }]}>로그아웃</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        zIndex: 999,
    },
    content: {
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
    },
    sidePlaceholder: {
        width: 80,
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
    rightActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#000000',
        fontFamily: 'NotoSansKR_700Bold',
    },
    profileButton: {
        padding: 0,
        backgroundColor: 'transparent',
    },
    profileImage: {
        width: 38,
        height: 38,
        borderRadius: 19,
    },
    kakaoButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEE500',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
        gap: 6,
    },
    kakaoIcon: {
        width: 18,
        height: 18,
    },
    kakaoText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#000000',
        fontFamily: 'NotoSansKR_700Bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.08)',
    },
    menuContainer: {
        position: 'absolute',
        right: 16,
        backgroundColor: '#ffffff',
        borderRadius: 16,
        width: 170,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 12,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: '#ededed',
    },
    menuItem: {
        paddingVertical: 10,
        paddingHorizontal: 14,
    },
    menuItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    menuItemText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#333',
        fontFamily: 'NotoSansKR_500Medium',
    },
    menuDivider: {
        height: 1,
        backgroundColor: '#f2f2f2',
        marginHorizontal: 10,
    },
});
