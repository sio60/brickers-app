import { useEffect, useRef, useState, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api, API_BASE } from '@/lib/api';
import { getSavedLevel, resolveLevel } from '@/lib/level';
import * as FileSystem from 'expo-file-system/legacy';
import MemoryGame from '@/components/MemoryGame';
import EventSource from 'react-native-sse';

export default function GenerationScreen() {
    const { uri, level } = useLocalSearchParams<{ uri: string; level?: string | string[] }>();
    const [status, setStatus] = useState<'uploading' | 'processing' | 'finishing' | 'error'>('uploading');
    const [progress, setProgress] = useState(0);
    const [jobId, setJobId] = useState<string | null>(null);
    const [ldrUrl, setLdrUrl] = useState<string | null>(null);
    const [agentLogs, setAgentLogs] = useState<string[]>([]);
    const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const sseRef = useRef<EventSource | null>(null);
    const logScrollRef = useRef<ScrollView>(null);
    const lastUriRef = useRef<string | null>(null);
    const hasCompletedRef = useRef(false);
    const router = useRouter();

    useEffect(() => {
        if (!uri || lastUriRef.current === uri) return;
        lastUriRef.current = uri;
        hasCompletedRef.current = false;
        handleGeneration(uri);
    }, [uri]);

    useEffect(() => {
        return () => {
            if (pollTimerRef.current) {
                clearInterval(pollTimerRef.current);
                pollTimerRef.current = null;
            }
            if (sseRef.current) {
                sseRef.current.close();
                sseRef.current = null;
            }
        };
    }, []);

    const stopPolling = useCallback(() => {
        if (pollTimerRef.current) {
            clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
        }
    }, []);

    const connectAgentLogs = useCallback((id: string) => {
        if (sseRef.current) {
            sseRef.current.close();
        }
        const url = `${API_BASE}/api/kids/jobs/${id}/logs/stream`;
        const es = new EventSource(url);
        sseRef.current = es;

        (es as any).addEventListener('agent-log', (event: any) => {
            if (event.data) {
                setAgentLogs(prev => [...prev.slice(-49), event.data]);
                setTimeout(() => logScrollRef.current?.scrollToEnd({ animated: true }), 50);
            }
        });

        es.addEventListener('error', () => {
            // SSE 끊기면 무시 (폴링이 메인 로직)
        });
    }, []);

    const handleGeneration = async (fileUri: string) => {
        try {
            stopPolling();
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
            const savedLevel = await getSavedLevel();
            const hasLevelParam = Array.isArray(level) ? level.length > 0 : !!level;
            const resolvedLevel = hasLevelParam ? resolveLevel(level) : savedLevel;
            const levelKey = (resolvedLevel || 'L2').toUpperCase();
            const levelMap: Record<string, { age: string; budget: number }> = {
                L1: { age: '4-5', budget: 300 },
                L2: { age: '6-7', budget: 350 },
                L3: { age: '8-10', budget: 400 },
            };
            const levelConfig = levelMap[levelKey] || levelMap.L2;
            const genRes = await api.startGeneration({
                sourceImageUrl: publicUrl,
                age: levelConfig.age,
                budget: levelConfig.budget,
                title: filename
            });

            const newJobId = genRes.data.jobId;
            setJobId(newJobId);

            // 3. SSE 로그 스트리밍
            connectAgentLogs(newJobId);

            // 4. Polling
            startPolling(newJobId);

        } catch (error) {
            console.error('Generation Flow Error:', error);
            setStatus('error');
        }
    };

    const startPolling = useCallback((id: string) => {
        stopPolling();
        pollTimerRef.current = setInterval(async () => {
            try {
                const res = await api.getJobStatus(id);
                const data = res.data;

                const resolvedLdrUrl = data.ldrUrl || data.ldr_url;
                const isDone = data.status === 'DONE' || data.status === 'COMPLETED' || data.stage === 'DONE';
                const isReady = !!resolvedLdrUrl;

                if ((isDone || isReady) && !hasCompletedRef.current) {
                    hasCompletedRef.current = true;
                    stopPolling();
                    if (sseRef.current) { sseRef.current.close(); sseRef.current = null; }
                    if (resolvedLdrUrl) setLdrUrl(resolvedLdrUrl);
                    setStatus('finishing');

                    // Navigate to result screen when LDR is ready
                    if (resolvedLdrUrl) {
                        router.replace({
                            pathname: '/result',
                            params: { ldrUrl: resolvedLdrUrl, jobId: id }
                        });
                    }
                } else if (data.status === 'FAILED' || data.status === 'ERROR') {
                    stopPolling();
                    setStatus('error');
                } else {
                    // Update progress based on stages if possible
                    // For now, just keep processing
                }
            } catch (err) {
                console.error('Polling error:', err);
            }
        }, 3000);
    }, [router, stopPolling]);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="close" size={28} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>AI 생성 중</Text>
                <View style={{ width: 28 }} />
            </View>

            <View style={styles.content}>
                {status === 'error' ? (
                    <View style={styles.centered}>
                        <Ionicons name="alert-circle" size={64} color="#ff4444" />
                        <Text style={styles.errorText}>오류가 발생했습니다. 다시 시도해주세요.</Text>
                        <TouchableOpacity style={styles.retryBtn} onPress={() => router.replace('/camera')}>
                            <Text style={styles.retryText}>다시 시도</Text>
                        </TouchableOpacity>
                    </View>
                ) : status === 'processing' ? (
                    <View style={{ flex: 1 }}>
                        <View style={{ flex: 1 }}>
                            <MemoryGame />
                        </View>
                        {agentLogs.length > 0 && (
                            <View style={styles.logPanel}>
                                <View style={styles.logHeader}>
                                    <Text style={styles.logHeaderText}>AI 진행 상황</Text>
                                </View>
                                <ScrollView
                                    ref={logScrollRef}
                                    style={styles.logScroll}
                                    showsVerticalScrollIndicator={false}
                                >
                                    {agentLogs.map((log, i) => (
                                        <Text key={i} style={[
                                            styles.logText,
                                            i === agentLogs.length - 1 && styles.logTextLatest,
                                        ]}>{log}</Text>
                                    ))}
                                </ScrollView>
                            </View>
                        )}
                    </View>
                ) : (
                    <View style={styles.centered}>
                        <ActivityIndicator size="large" color="#ffe135" />
                        <Text style={styles.statusText}>
                            {status === 'uploading' && '이미지 업로드 중..'}
                            {status === 'finishing' && '마무리 중...'}
                        </Text>
                        <View style={styles.progressContainer}>
                            <View style={[styles.progressBar, { width: status === 'uploading' ? '30%' : '100%' }]} />
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
        fontFamily: 'NotoSansKR_700Bold',
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
        fontFamily: 'NotoSansKR_500Medium',
    },
    errorText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        fontFamily: 'NotoSansKR_400Regular',
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
        fontFamily: 'NotoSansKR_500Medium',
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
    },
    logPanel: {
        backgroundColor: '#1a1a2e',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        maxHeight: 160,
        paddingBottom: 8,
    },
    logHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    logHeaderText: {
        color: '#ffe135',
        fontSize: 13,
        fontWeight: '700',
        fontFamily: 'NotoSansKR_700Bold',
    },
    logScroll: {
        paddingHorizontal: 16,
        paddingTop: 6,
    },
    logText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 12,
        lineHeight: 20,
        fontFamily: 'NotoSansKR_400Regular',
    },
    logTextLatest: {
        color: '#fff',
        fontWeight: '600',
    },
});
