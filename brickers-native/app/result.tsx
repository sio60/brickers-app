import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import ThreeDPreview from '@/components/preview/ThreeDPreview';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';

export default function ResultScreen() {
    const { ldrUrl, jobId } = useLocalSearchParams<{ ldrUrl?: string; jobId?: string }>();
    const router = useRouter();
    const { isLoggedIn } = useAuth();

    const [resolvedLdrUrl, setResolvedLdrUrl] = useState<string | null>(null);
    const [resolvedJobId, setResolvedJobId] = useState<string | null>(null);
    const [stepMode, setStepMode] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [totalSteps, setTotalSteps] = useState(1);
    const [galleryTitle, setGalleryTitle] = useState('');
    const [showTitleInput, setShowTitleInput] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);

    useEffect(() => {
        const asyncResolve = async () => {
            let ldr = Array.isArray(ldrUrl) ? ldrUrl[0] : ldrUrl;
            let job = Array.isArray(jobId) ? jobId[0] : jobId;

            // If no data from params, try to get from latest job
            if (!ldr && isLoggedIn) {
                try {
                    const res = await api.getMyJobs(0, 1);
                    const jobs = res.data?.content || [];
                    if (jobs.length > 0) {
                        const latestJob = jobs[0];
                        ldr = latestJob.ldrUrl || latestJob.ldr_url;
                        job = latestJob.id || latestJob.jobId;
                    }
                } catch (err) {
                    console.error('[ResultScreen] Failed to fetch latest job:', err);
                }
            }
            setResolvedLdrUrl(ldr || null);
            setResolvedJobId(job || null);

            if (!ldr) {
                Alert.alert('오류', `결과 로드에 실패했습니다. LDR: ${resolvedLdrUrl ?? ''}`, [
                    { text: '확인', onPress: () => router.replace('/(tabs)') }
                ]);
            }
        };
        asyncResolve();
    }, [ldrUrl, jobId, isLoggedIn]);

    const handleShare = async () => {
        if (await Sharing.isAvailableAsync() && resolvedLdrUrl) {
            try {
                await Sharing.shareAsync(resolvedLdrUrl);
            } catch {
                Alert.alert('공유 실패', '일시적인 오류가 발생했습니다.');
            }
        }
    };

    const handleNext = () => {
        if (currentStep < totalSteps) setCurrentStep(prev => prev + 1);
    };
    const handlePrev = () => {
        if (currentStep > 1) setCurrentStep(prev => prev - 1);
    };

    const handleRegisterGallery = async () => {
        if (!showTitleInput) {
            setShowTitleInput(true);
            return;
        }
        if (!isLoggedIn) {
            Alert.alert('로그인 필요', '갤러리 등록을 위해 로그인해 주세요.');
            return;
        }
        if (!resolvedJobId) {
            Alert.alert('등록 실패', '작업 정보가 없어 갤러리 등록을 할 수 없습니다.');
            return;
        }
        try {
            setIsRegistering(true);
            await api.registerToGallery({
                title: galleryTitle || '나의 브릭 작품',
                ldrUrl: resolvedLdrUrl || undefined,
                visibility: 'PUBLIC'
            });
            Alert.alert('등록 완료', '갤러리에 등록되었습니다');
        } catch (err) {
            console.error('[ResultScreen] Gallery registration failed:', err);
            Alert.alert('등록 실패', '갤러리 등록에 실패했습니다. 다시 시도해 주세요.');
        } finally {
            setIsRegistering(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.replace('/(tabs)')}>
                    <Ionicons name="home-outline" size={28} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>결과 보기</Text>
                <TouchableOpacity onPress={handleShare}>
                    <Ionicons name="share-outline" size={28} color="#000" />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <View style={styles.previewContainer}>
                    <ThreeDPreview
                        url={resolvedLdrUrl ?? null}
                        stepMode={stepMode}
                        currentStep={currentStep}
                        onStepCountChange={setTotalSteps}
                    />
                </View>

                <View style={styles.infoSection}>
                    <Text style={styles.title}>모델 생성 완료!</Text>
                    <Text style={styles.subtitle}>아래 3D 모델을 확인하고 공유해 보세요</Text>
                    {showTitleInput && (
                        <View style={styles.titleInputWrap}>
                            <TextInput
                                value={galleryTitle}
                                onChangeText={setGalleryTitle}
                                placeholder="갤러리 제목을 입력해 주세요"
                                placeholderTextColor="#9a9a9a"
                                style={styles.titleInput}
                                maxLength={40}
                                returnKeyType="done"
                            />
                        </View>
                    )}
                </View>

                <View style={styles.stepSection}>
                    <View style={styles.stepHeader}>
                        <Text style={styles.stepTitle}>조립 단계</Text>
                        <TouchableOpacity
                            style={[styles.stepToggle, stepMode && styles.stepToggleActive]}
                            onPress={() => {
                                setStepMode(!stepMode);
                                setCurrentStep(1);
                            }}
                        >
                            <Text style={[styles.stepToggleText, stepMode && styles.stepToggleTextActive]}>
                                {stepMode ? '단계 끄기' : '단계 켜기'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {stepMode && (
                        <View style={styles.stepControls}>
                            <TouchableOpacity
                                style={[styles.navButton, currentStep === 1 && styles.disabledButton]}
                                onPress={handlePrev}
                                disabled={currentStep === 1}
                            >
                                <Ionicons name="arrow-back" size={20} color={currentStep === 1 ? '#ccc' : '#000'} />
                                <Text style={[styles.navButtonText, currentStep === 1 && styles.disabledText]}>이전</Text>
                            </TouchableOpacity>

                            <Text style={styles.stepCounter}>
                                {currentStep} / {totalSteps}
                            </Text>

                            <TouchableOpacity
                                style={[styles.navButton, styles.nextButton, currentStep === totalSteps && styles.disabledButton]}
                                onPress={handleNext}
                                disabled={currentStep === totalSteps}
                            >
                                <Text style={[styles.navButtonText, styles.nextButtonText, currentStep === totalSteps && styles.disabledText]}>다음</Text>
                                <Ionicons name="arrow-forward" size={20} color={currentStep === totalSteps ? '#ccc' : '#fff'} />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.galleryBtn}
                        onPress={handleRegisterGallery}
                        disabled={isRegistering}
                    >
                        <Text style={styles.galleryBtnText}>
                            {isRegistering ? '등록 중..' : '갤러리에 등록'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        fontFamily: 'NotoSansKR_700Bold',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    previewContainer: {
        height: '45%',
        marginBottom: 24,
    },
    infoSection: {
        alignItems: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 8,
        color: '#000',
        fontFamily: 'NotoSansKR_700Bold',
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 24,
        fontFamily: 'NotoSansKR_400Regular',
    },
    titleInputWrap: {
        width: '100%',
        marginBottom: 32,
    },
    titleInput: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 14,
        color: '#000',
        backgroundColor: '#fafafa',
        fontFamily: 'NotoSansKR_400Regular',
    },
    stepSection: {
        marginTop: 8,
        marginBottom: 20,
        gap: 12,
    },
    stepHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    stepTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#000',
        fontFamily: 'NotoSansKR_700Bold',
    },
    stepToggle: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#000',
        backgroundColor: '#fff',
    },
    stepToggleActive: {
        backgroundColor: '#000',
    },
    stepToggleText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#000',
        fontFamily: 'NotoSansKR_500Medium',
    },
    stepToggleTextActive: {
        color: '#fff',
    },
    stepControls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },
    stepCounter: {
        fontSize: 14,
        fontWeight: '800',
        color: '#333',
        minWidth: 80,
        textAlign: 'center',
        fontFamily: 'NotoSansKR_500Medium',
    },
    navButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 999,
        backgroundColor: '#f0f0f0',
    },
    nextButton: {
        backgroundColor: '#000',
    },
    navButtonText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#000',
        fontFamily: 'NotoSansKR_500Medium',
    },
    nextButtonText: {
        color: '#fff',
    },
    disabledButton: {
        backgroundColor: '#f5f5f5',
    },
    disabledText: {
        color: '#ccc',
    },
    footer: {
        marginTop: 'auto',
        gap: 12,
    },
    galleryBtn: {
        backgroundColor: '#ffe135',
        paddingVertical: 18,
        borderRadius: 30,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#000',
    },
    galleryBtnText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#000',
        fontFamily: 'NotoSansKR_700Bold',
    },
});
