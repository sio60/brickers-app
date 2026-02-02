import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
    const router = useRouter();
    const { login, isLoading } = useAuth();

    const handleKakaoLogin = async () => {
        try {
            await login();
            // 로그인 성공 시 이전 화면으로 돌아가기
            router.back();
        } catch (error: any) {
            console.error('Login error:', error);
            Alert.alert(
                '로그인 실패',
                error.message || '카카오 로그인 중 오류가 발생했습니다.',
                [{ text: '확인' }]
            );
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* 로고/타이틀 영역 */}
                <View style={styles.header}>
                    <Text style={styles.logo}>BRICKERS</Text>
                    <Text style={styles.subtitle}>나만의 브릭 도안을 만들어보세요</Text>
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
                                <Text style={styles.kakaoIcon}>💬</Text>
                                <Text style={styles.kakaoText}>카카오로 시작하기</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.skipButton}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.skipText}>둘러보기</Text>
                    </TouchableOpacity>
                </View>

                {/* 안내 문구 */}
                <Text style={styles.notice}>
                    로그인하면 작업 저장, 갤러리 등록 등{'\n'}
                    더 많은 기능을 이용할 수 있어요
                </Text>
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
    logo: {
        fontSize: 36,
        fontWeight: '900',
        letterSpacing: 2,
        color: '#000',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginTop: 12,
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
    kakaoIcon: {
        fontSize: 20,
    },
    kakaoText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#000',
    },
    skipButton: {
        alignItems: 'center',
        paddingVertical: 16,
    },
    skipText: {
        fontSize: 15,
        color: '#888',
        textDecorationLine: 'underline',
    },
    notice: {
        marginTop: 40,
        fontSize: 13,
        color: '#999',
        textAlign: 'center',
        lineHeight: 20,
    },
});
