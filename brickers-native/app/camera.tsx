import React, { useState, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

const { width, height } = Dimensions.get('window');

export default function CameraScreen() {
    const [permission, requestPermission] = useCameraPermissions();
    const [photo, setPhoto] = useState<string | null>(null);
    const cameraRef = useRef<any>(null);
    const router = useRouter();

    if (!permission) {
        // Camera permissions are still loading.
        return <View />;
    }

    if (!permission.granted) {
        // Camera permissions are not granted yet.
        return (
            <View style={styles.container}>
                <Text style={styles.message}>카메라 권한이 필요합니다.</Text>
                <TouchableOpacity onPress={requestPermission} style={styles.permissionBtn}>
                    <Text style={styles.permissionBtnText}>권한 요청하기</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const takePicture = async () => {
        if (cameraRef.current) {
            const result = await cameraRef.current.takePictureAsync();
            setPhoto(result.uri);
        }
    };

    const confirmPhoto = () => {
        if (photo) {
            // Navigate to generation screen with photo uri
            router.push({
                pathname: '/generation',
                params: { uri: photo }
            });
        }
    };

    if (photo) {
        return (
            <View style={styles.container}>
                <Image source={{ uri: photo }} style={styles.preview} />
                <View style={styles.previewControls}>
                    <TouchableOpacity style={styles.retakeBtn} onPress={() => setPhoto(null)}>
                        <Ionicons name="refresh" size={32} color="#fff" />
                        <Text style={styles.controlText}>다시 찍기</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.confirmBtn} onPress={confirmPhoto}>
                        <Ionicons name="checkmark" size={32} color="#000" />
                        <Text style={[styles.controlText, { color: '#000' }]}>사용하기</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView style={styles.camera} ref={cameraRef}>
                <SafeAreaView style={styles.overlay}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                        <Ionicons name="chevron-back" size={28} color="#fff" />
                    </TouchableOpacity>

                    <View style={styles.guideContainer}>
                        <View style={styles.guideFrame} />
                        <Text style={styles.guideText}>물건을 전면 가득 차게 찍어주세요</Text>
                    </View>

                    <View style={styles.bottomControls}>
                        <View style={{ width: 60 }} />
                        <TouchableOpacity style={styles.shutterBtn} onPress={takePicture}>
                            <View style={styles.shutterInner} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.galleryBtn} onPress={() => {/* Future: Open Gallery */ }}>
                            <Ionicons name="images-outline" size={28} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </CameraView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
    },
    message: {
        textAlign: 'center',
        paddingBottom: 10,
        color: '#fff',
    },
    camera: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        justifyContent: 'space-between',
    },
    backBtn: {
        padding: 20,
    },
    guideContainer: {
        alignItems: 'center',
    },
    guideFrame: {
        width: width * 0.7,
        height: width * 0.7,
        borderWidth: 2,
        borderColor: 'rgba(255, 225, 53, 0.5)',
        borderRadius: 20,
        marginBottom: 20,
    },
    guideText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    bottomControls: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingBottom: 40,
    },
    shutterBtn: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    shutterInner: {
        width: 66,
        height: 66,
        borderRadius: 33,
        backgroundColor: '#fff',
    },
    galleryBtn: {
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    preview: {
        flex: 1,
        width: '100%',
    },
    previewControls: {
        position: 'absolute',
        bottom: 50,
        left: 20,
        right: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    retakeBtn: {
        alignItems: 'center',
        gap: 8,
    },
    confirmBtn: {
        backgroundColor: '#ffe135',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 30,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    controlText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
    permissionBtn: {
        backgroundColor: '#ffe135',
        alignSelf: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 20,
    },
    permissionBtnText: {
        fontWeight: '700',
    }
});
