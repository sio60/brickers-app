import { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, Alert, Share, KeyboardAvoidingView, ScrollView, Platform, Modal } from 'react-native';
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
    const [galleryTitle, setGalleryTitle] = useState('');
    const [showTitleInput, setShowTitleInput] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const [sourceImageUrl, setSourceImageUrl] = useState<string | null>(null);
    const [glbUrl, setGlbUrl] = useState<string | null>(null);
    const [tags, setTags] = useState<string[]>([]);

    // Steps state
    const [stepMode, setStepMode] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [totalSteps, setTotalSteps] = useState(1);
    const titleRef = useRef('');

    useEffect(() => {
        const asyncResolve = async () => {
            let ldr = Array.isArray(ldrUrl) ? ldrUrl[0] : ldrUrl;
            let job = Array.isArray(jobId) ? jobId[0] : jobId;
            let source: string | null = null;
            let glb: string | null = null;

            // ... (existing resolution logic) ...
            // If no data from params, try to get from latest job
            if (!ldr && isLoggedIn) {
                try {
                    const res = await api.getMyJobs(0, 1);
                    const jobs = res.data?.content || [];
                    if (jobs.length > 0) {
                        const latestJob = jobs[0];
                        ldr = latestJob.ldrUrl || latestJob.ldr_url;
                        job = latestJob.id || latestJob.jobId;
                        source = latestJob.sourceImageUrl || latestJob.source_image_url || null;
                        glb = latestJob.glbUrl || latestJob.glb_url || null;
                    }
                } catch (err) {
                    console.error('[ResultScreen] Failed to fetch latest job:', err);
                }
            }

            // If we have jobId but missing source/glb, fetch job details
            if (job && (!source || !glb)) {
                try {
                    const jobRes = await api.getJobStatus(job);
                    const jobData = jobRes.data;
                    if (jobData) {
                        source = source || jobData.sourceImageUrl || jobData.source_image_url || null;
                        glb = glb || jobData.glbUrl || jobData.glb_url || null;
                        if (!ldr) {
                            ldr = jobData.ldrUrl || jobData.ldr_url || null;
                        }
                    }
                } catch (err) {
                    console.error('[ResultScreen] Failed to fetch job details:', err);
                }
            }

            setResolvedLdrUrl(ldr || null);
            setResolvedJobId(job || null);
            setSourceImageUrl(source);
            setGlbUrl(glb);

            if (job) {
                try {
                    const jobRes = await api.getJobStatus(job);
                    if (jobRes.data?.suggestedTags) {
                        setTags(jobRes.data.suggestedTags);
                    }
                } catch (e) {
                    console.error('[ResultScreen] Failed to fetch tags:', e);
                }
            }

            console.log('[ResultScreen] Resolved URLs:', { ldr, source, glb, job });

            if (!ldr) {
                Alert.alert('오류', `결과 로드에 실패했습니다.`, [
                    { text: '확인', onPress: () => router.replace('/(tabs)') }
                ]);
            }
        };
        asyncResolve();
    }, [ldrUrl, jobId, isLoggedIn]);

    const handleShare = () => {
        Alert.alert('알림', '공유 기능은 현재 준비 중입니다.');
    };

    const toggleStepMode = () => {
        const nextMode = !stepMode;
        setStepMode(nextMode);
        if (nextMode) {
            setCurrentStep(1);
        }
    };

    const handleNextStep = () => {
        if (currentStep < totalSteps) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleRegisterBtnPress = () => {
        if (!isLoggedIn) {
            Alert.alert('로그인 필요', '갤러리 등록을 위해 로그인해 주세요.');
            return;
        }
        if (!resolvedJobId) {
            Alert.alert('등록 실패', '작업 정보가 없어 갤러리 등록을 할 수 없습니다.');
            return;
        }
        setShowTitleInput(true);
    };

    const performRegistration = async () => {
        // Use ref value for validation to ensure latest input is captured
        const currentTitle = titleRef.current;
        console.log('[ResultScreen] Check title - Ref:', currentTitle);

        const finalTitle = currentTitle.trim();
        if (!finalTitle) {
            Alert.alert('제목 필요', '갤러리 제목을 입력해 주세요.');
            return;
        }

        try {
            setIsRegistering(true);
            // Close modal immediately or after success? Let's close after success or error handling
            // But usually modal blocks interaction.

            console.log('[ResultScreen] Registering to gallery with:', {
                title: finalTitle,
                ldrUrl: resolvedLdrUrl,
                sourceImageUrl,
                glbUrl,
            });
            await api.registerToGallery({
                title: finalTitle,
                ldrUrl: resolvedLdrUrl || undefined,
                sourceImageUrl: sourceImageUrl || undefined,
                glbUrl: glbUrl || undefined,
                tags: tags.length > 0 ? tags : ['Kids', 'Brick'],
                visibility: 'PUBLIC'
            });

            setShowTitleInput(false); // Close modal on success
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

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior="padding"
                keyboardVerticalOffset={100}
            >
                <ScrollView
                    style={styles.content}
                    contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
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

                    </View>

                    <View style={styles.stepSection}>
                        <View style={styles.stepHeader}>
                            <Text style={styles.stepTitle}>조립 단계</Text>
                            <TouchableOpacity
                                style={[styles.stepToggle, stepMode && styles.stepToggleActive]}
                                onPress={toggleStepMode}
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
                                    onPress={handlePrevStep}
                                    disabled={currentStep === 1}
                                >
                                    <Ionicons name="arrow-back" size={16} color={currentStep === 1 ? '#ccc' : '#000'} />
                                    <Text style={[styles.navButtonText, currentStep === 1 && styles.disabledText]}>이전</Text>
                                </TouchableOpacity>

                                <Text style={styles.stepCounter}>
                                    {currentStep} / {totalSteps}
                                </Text>

                                <TouchableOpacity
                                    style={[styles.navButton, styles.nextButton, currentStep === totalSteps && styles.disabledButton]}
                                    onPress={handleNextStep}
                                    disabled={currentStep === totalSteps}
                                >
                                    <Text style={[styles.navButtonText, styles.nextButtonText, currentStep === totalSteps && styles.disabledText]}>다음</Text>
                                    <Ionicons name="arrow-forward" size={16} color={currentStep === totalSteps ? '#ccc' : '#fff'} />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={styles.galleryBtn}
                            onPress={handleRegisterBtnPress}
                            disabled={isRegistering}
                        >
                            <Text style={styles.galleryBtnText}>
                                {isRegistering ? '등록 중..' : '갤러리에 등록'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Registration Modal */}
            <Modal
                transparent={true}
                visible={showTitleInput}
                animationType="fade"
                onRequestClose={() => setShowTitleInput(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>갤러리 등록</Text>
                        <Text style={styles.modalSubtitle}>작품의 제목을 입력해 주세요</Text>

                        <TextInput
                            value={galleryTitle}
                            onChangeText={(text) => {
                                setGalleryTitle(text);
                                titleRef.current = text;
                            }}
                            placeholder="예: 멋진 코끼리"
                            placeholderTextColor="#999"
                            style={styles.modalInput}
                            autoFocus={true}
                            maxLength={40}
                            returnKeyType="done"
                            onSubmitEditing={performRegistration}
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.modalBtnCancel}
                                onPress={() => setShowTitleInput(false)}
                            >
                                <Text style={styles.modalBtnTextCancel}>취소</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalBtnConfirm}
                                onPress={performRegistration}
                                disabled={isRegistering}
                            >
                                <Text style={styles.modalBtnTextConfirm}>
                                    {isRegistering ? '등록 중' : '등록'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
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
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 340,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
    },
    modalInput: {
        width: '100%',
        height: 50,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#000',
        marginBottom: 24,
        backgroundColor: '#f9f9f9',
    },
    modalButtons: {
        flexDirection: 'row',
        width: '100%',
        gap: 12,
    },
    modalBtnCancel: {
        flex: 1,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
    },
    modalBtnConfirm: {
        flex: 1,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFE135',
        borderRadius: 8,
    },
    modalBtnTextCancel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
    modalBtnTextConfirm: {
        fontSize: 16,
        fontWeight: '700',
        color: '#000',
    },
});
