import React from 'react';
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity, Share } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ThreeDPreview from '@/components/preview/ThreeDPreview';

export default function ResultScreen() {
    const { ldrUrl, jobId } = useLocalSearchParams<{ ldrUrl: string; jobId: string }>();
    const router = useRouter();

    const handleShare = async () => {
        try {
            await Share.share({
                message: `나만의 레고 작품이 만들어졌어요! 확인해보세요: ${ldrUrl}`,
            });
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.replace('/(tabs)')}>
                    <Ionicons name="home-outline" size={28} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>완성된 작품</Text>
                <TouchableOpacity onPress={handleShare}>
                    <Ionicons name="share-outline" size={28} color="#000" />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <View style={styles.previewContainer}>
                    <ThreeDPreview url={ldrUrl} />
                </View>

                <View style={styles.infoSection}>
                    <Text style={styles.title}>멋진 작품이 탄생했습니다!</Text>
                    <Text style={styles.subtitle}>브릭들을 3D로 자유롭게 돌려가며 확인해보세요.</Text>

                    <View style={styles.stats}>
                        <View style={styles.statBox}>
                            <Text style={styles.statVal}>128</Text>
                            <Text style={styles.statLabel}>조립 브릭</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statVal}>8+</Text>
                            <Text style={styles.statLabel}>권장 연령</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.galleryBtn}
                        onPress={() => router.push('/(tabs)/explore')}
                    >
                        <Text style={styles.galleryBtnText}>갤러리에 공유하기</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.retryBtn}
                        onPress={() => router.push('/camera')}
                    >
                        <Text style={styles.retryBtnText}>새로 만들기</Text>
                        <Ionicons name="camera" size={20} color="#666" />
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
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 24,
    },
    stats: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 32,
    },
    statBox: {
        backgroundColor: '#f5f5f5',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 16,
        alignItems: 'center',
        minWidth: 100,
    },
    statVal: {
        fontSize: 18,
        fontWeight: '800',
        color: '#000',
    },
    statLabel: {
        fontSize: 12,
        color: '#888',
        marginTop: 2,
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
    },
    retryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        gap: 8,
    },
    retryBtnText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#666',
    }
});
