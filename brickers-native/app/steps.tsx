import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ThreeDPreview from '@/components/preview/ThreeDPreview';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function StepsScreen() {
    const router = useRouter();
    const { ldrUrl } = useLocalSearchParams<{ ldrUrl?: string }>();
    const [currentStep, setCurrentStep] = useState(1);
    const [totalSteps, setTotalSteps] = useState(1);

    const resolvedLdrUrl = Array.isArray(ldrUrl) ? ldrUrl[0] : ldrUrl;

    useEffect(() => {
        console.log('[StepsScreen] Received ldrUrl param:', ldrUrl);
        console.log('[StepsScreen] Resolved ldrUrl:', resolvedLdrUrl);
    }, [ldrUrl, resolvedLdrUrl]);

    const handleNext = () => {
        if (currentStep < totalSteps) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrev = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>조립 단계</Text>
                <View style={{ width: 44 }} />
            </View>

            <View style={styles.content}>
                <View style={styles.previewContainer}>
                    <ThreeDPreview
                        url={resolvedLdrUrl || null}
                        stepMode={true}
                        currentStep={currentStep}
                        onStepCountChange={setTotalSteps}
                    />
                </View>

                <View style={styles.controls}>
                    <View style={styles.stepInfo}>
                        <Text style={styles.stepLabel}>STEP</Text>
                        <Text style={styles.stepNumber}>
                            {currentStep} <Text style={styles.totalSteps}>/ {totalSteps}</Text>
                        </Text>
                    </View>

                    <View style={styles.buttonRow}>
                        <TouchableOpacity
                            style={[styles.navButton, currentStep === 1 && styles.disabledButton]}
                            onPress={handlePrev}
                            disabled={currentStep === 1}
                        >
                            <Ionicons name="arrow-back" size={24} color={currentStep === 1 ? '#ccc' : '#000'} />
                            <Text style={[styles.navButtonText, currentStep === 1 && styles.disabledText]}>이전</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.navButton, styles.nextButton, currentStep === totalSteps && styles.disabledButton]}
                            onPress={handleNext}
                            disabled={currentStep === totalSteps}
                        >
                            <Text style={[styles.navButtonText, styles.nextButtonText, currentStep === totalSteps && styles.disabledText]}>다음</Text>
                            <Ionicons name="arrow-forward" size={24} color={currentStep === totalSteps ? '#ccc' : '#fff'} />
                        </TouchableOpacity>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.homeButton}
                    onPress={() => router.back()}
                >
                    <Text style={styles.homeButtonText}>돌아가기</Text>
                </TouchableOpacity>
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
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#000',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    previewContainer: {
        height: SCREEN_HEIGHT * 0.5,
        backgroundColor: '#f8f8f8',
        borderRadius: 30,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#000',
        marginTop: 10,
    },
    controls: {
        marginTop: 30,
        alignItems: 'center',
    },
    stepInfo: {
        alignItems: 'center',
        marginBottom: 24,
    },
    stepLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#888',
        letterSpacing: 2,
    },
    stepNumber: {
        fontSize: 32,
        fontWeight: '900',
        color: '#000',
    },
    totalSteps: {
        fontSize: 18,
        color: '#bbb',
        fontWeight: '600',
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 16,
        width: '100%',
    },
    navButton: {
        flex: 1,
        height: 60,
        borderRadius: 30,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f0f0f0',
        gap: 8,
    },
    nextButton: {
        backgroundColor: '#000',
    },
    navButtonText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#000',
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
    homeButton: {
        marginTop: 'auto',
        marginBottom: 20,
        alignItems: 'center',
        paddingVertical: 15,
    },
    homeButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#666',
        textDecorationLine: 'underline',
    },
});
