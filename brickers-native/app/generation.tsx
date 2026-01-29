import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, SafeAreaView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import * as FileSystem from 'expo-file-system';

export default function GenerationScreen() {
    const { uri } = useLocalSearchParams<{ uri: string }>();
    const [status, setStatus] = useState<'uploading' | 'processing' | 'finishing' | 'error'>('uploading');
    const [progress, setProgress] = useState(0);
    const [jobId, setJobId] = useState<string | null>(null);
    const [ldrUrl, setLdrUrl] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        if (uri) {
            handleGeneration(uri);
        }
    }, [uri]);

    const handleGeneration = async (fileUri: string) => {
        try {
            // 1. Upload Image (Multipart)
            setStatus('uploading');
            const filename = `mobile_${Date.now()}.jpg`;

            const formData = new FormData();
            // @ts-ignore
            formData.append('file', {
                uri: fileUri,
                name: filename,
                type: 'image/jpeg',
            });

            const uploadRes = await api.uploadImage(formData);
            const { url: publicUrl } = uploadRes.data;

            // 2. Start Generation
            setStatus('processing');
            const genRes = await api.startGeneration({
                sourceImageUrl: publicUrl,
                age: '8-10', // Default for mobile
                budget: 150,
                title: filename
            });

            const newJobId = genRes.data.jobId;
            setJobId(newJobId);

            // 4. Polling
            startPolling(newJobId);

        } catch (error) {
            console.error('Generation Flow Error:', error);
            setStatus('error');
        }
    };

    const startPolling = async (id: string) => {
        const timer = setInterval(async () => {
            try {
                const res = await api.getJobStatus(id);
                const data = res.data;

                if (data.status === 'COMPLETED') {
                    clearInterval(timer);
                    setLdrUrl(data.ldrUrl);
                    setStatus('finishing');

                    // Navigate to result screen
                    router.replace({
                        pathname: '/result',
                        params: { ldrUrl: data.ldrUrl, jobId: id }
                    });
                } else if (data.status === 'FAILED') {
                    clearInterval(timer);
                    setStatus('error');
                } else {
                    // Update progress based on stages if possible
                    // For now, just keep processing
                }
            } catch (err) {
                console.error('Polling error:', err);
            }
        }, 3000);

        return () => clearInterval(timer);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="close" size={28} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>AI 레고 제작 중</Text>
                <View style={{ width: 28 }} />
            </View>

            <View style={styles.content}>
                {status === 'error' ? (
                    <View style={styles.centered}>
                        <Ionicons name="alert-circle" size={64} color="#ff4444" />
                        <Text style={styles.errorText}>문제가 발생했습니다. 다시 시도해주세요.</Text>
                        <TouchableOpacity style={styles.retryBtn} onPress={() => router.replace('/camera')}>
                            <Text style={styles.retryText}>카메라로 돌아가기</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.centered}>
                        <ActivityIndicator size="large" color="#ffe135" />
                        <Text style={styles.statusText}>
                            {status === 'uploading' && '이미지를 서버로 전송 중...'}
                            {status === 'processing' && 'AI가 브릭을 조립하고 있어요...'}
                            {status === 'finishing' && '거의 다 됐어요!'}
                        </Text>
                        <View style={styles.progressContainer}>
                            <View style={[styles.progressBar, { width: status === 'uploading' ? '30%' : status === 'processing' ? '70%' : '100%' }]} />
                        </View>
                    </View>
                )}
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
    },
    content: {
        flex: 1,
        justifyContent: 'center',
    },
    centered: {
        alignItems: 'center',
        padding: 40,
    },
    statusText: {
        marginTop: 24,
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    errorText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    retryBtn: {
        marginTop: 32,
        backgroundColor: '#000',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 25,
    },
    retryText: {
        color: '#fff',
        fontWeight: '700',
    },
    progressContainer: {
        width: '100%',
        height: 8,
        backgroundColor: '#eee',
        borderRadius: 4,
        marginTop: 32,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#ffe135',
    }
});
