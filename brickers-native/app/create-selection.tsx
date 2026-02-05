import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ThreeDPreview from '@/components/preview/ThreeDPreview';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function CreateSelectionScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Create New Brick</Text>
                <View style={{ width: 44 }} />
            </View>

            <View style={styles.content}>
                {/* 3D Preview Section - Top half */}
                <View style={styles.previewContainer}>
                    <ThreeDPreview url="assets/model/car.ldr" showZoomControls={false} />
                </View>

                {/* Buttons Section - Bottom half */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[styles.mainButton, styles.createButton]}
                        onPress={() => router.push('/steps')}
                    >
                        <Ionicons name="hammer-outline" size={24} color="#000" style={styles.buttonIcon} />
                        <View>
                            <Text style={styles.buttonText}>Create</Text>
                            <Text style={styles.buttonSubtext}>단계별로 조립하는 모델</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.mainButton, styles.uploadButton]}
                        onPress={() => router.push('/camera')}
                    >
                        <Ionicons name="camera-outline" size={24} color="#fff" style={styles.buttonIcon} />
                        <View>
                            <Text style={[styles.buttonText, { color: '#fff' }]}>Upload Image</Text>
                            <Text style={[styles.buttonSubtext, { color: '#eee' }]}>사진으로 자동 생성</Text>
                        </View>
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
        paddingTop: 20,
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
        fontFamily: 'NotoSansKR_700Bold',
    },
    content: {
        flex: 1,
    },
    previewContainer: {
        height: SCREEN_HEIGHT * 0.45,
        backgroundColor: '#f8f8f8',
        marginHorizontal: 16,
        marginTop: 8,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#eee',
    },
    buttonContainer: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 24,
        alignItems: 'center',
    },
    description: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
        fontWeight: '500',
        fontFamily: 'NotoSansKR_400Regular',
    },
    mainButton: {
        width: '100%',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    createButton: {
        backgroundColor: '#ffe135',
        borderWidth: 2,
        borderColor: '#000',
    },
    uploadButton: {
        backgroundColor: '#000',
    },
    buttonIcon: {
        marginRight: 16,
    },
    buttonText: {
        fontSize: 18,
        fontWeight: '900',
        color: '#000',
        textTransform: 'uppercase',
        fontFamily: 'NotoSansKR_700Bold',
    },
    buttonSubtext: {
        fontSize: 13,
        color: '#555',
        marginTop: 2,
        fontWeight: '600',
        fontFamily: 'NotoSansKR_400Regular',
    },
});
