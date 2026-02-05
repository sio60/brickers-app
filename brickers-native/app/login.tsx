import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
    const router = useRouter();
    const { login, isLoading } = useAuth();

    const handleKakaoLogin = async () => {
        try {
            await login();
            // 로그인 완료 후 이전 화면으로 이동
            router.back();
        } catch (error: any) {
            console.error('Login error:', error);
            Alert.alert(
                '로그인 오류',
                error.message || '로그인에 문제가 발생했습니다.',
                [{ text: '확인' }]
            );
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* 헤더 영역 */}
                <View style={styles.header}>
                    <Image
                        source={require('@/assets/images/logo.png')}
                        style={styles.logoImage}
                        contentFit="contain"
                    />
                    <Text style={styles.subtitle}>간편 로그인으로 시작해요</Text>
                </View>

                {/* 로그인 버튼 영역 */}
                <View style={styles.loginSection}>
                    <TouchableOpacity
                        style={styles.kakaoButton}
                        onPress={handleKakaoLogin}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#000" />
                        ) : (
                            <>
                                <Image
                                    source={require('@/assets/icons/kakao.png')}
                                    style={styles.kakaoIconImage}
                                />
                                <Text style={styles.kakaoText}>카카오로 로그인</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* 안내 문구 */}
                <Text style={styles.notice}>로그인 시 이용약관 및 개인정보 처리방침에 동의한 것으로 간주됩니다</Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 60,
    },
    logoImage: {
        width: 180,
        height: 60,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginTop: 16,
        fontFamily: 'NotoSansKR_400Regular',
    },
    loginSection: {
        width: '100%',
        maxWidth: 320,
        gap: 12,
    },
    kakaoButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FEE500',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        gap: 8,
    },
    kakaoIconImage: {
        width: 20,
        height: 20,
    },
    kakaoText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#000',
        fontFamily: 'NotoSansKR_700Bold',
    },

    notice: {
        marginTop: 40,
        fontSize: 13,
        color: '#999',
        textAlign: 'center',
        lineHeight: 20,
        fontFamily: 'NotoSansKR_400Regular',
    },
});
