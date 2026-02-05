import { useState, useRef, useEffect } from 'react';
import { useCameraPermissions, CameraView } from 'expo-camera';
import { StyleSheet, Text, TouchableOpacity, View, Image, Dimensions, Alert, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';

const { width } = Dimensions.get('window');

const LEVEL_KEY = 'BRICKERS_USER_LEVEL';

const loadLevel = async (): Promise<'L1' | 'L2' | 'L3'> => {
    const stored = await SecureStore.getItemAsync(LEVEL_KEY);
    if (stored === 'L1' || stored === 'L2' || stored === 'L3') return stored;
    return 'L1';
};
const saveLevel = async (lv: 'L1' | 'L2' | 'L3') => {
    await SecureStore.setItemAsync(LEVEL_KEY, lv);
};

export default function CameraScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ level?: string }>();
    const cameraRef = useRef<CameraView>(null);
    const [permission, requestPermission] = useCameraPermissions();
    const [photo, setPhoto] = useState<string | null>(null);
    const [level, setLevel] = useState<'L1' | 'L2' | 'L3'>('L1');

    useEffect(() => {
        (async () => {
            const lv = await loadLevel();
            setLevel((params.level as 'L1' | 'L2' | 'L3') || lv);
        })();
    }, [params.level]);

    if (!permission) return <View style={styles.container} />;
    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <Text style={styles.message}>카메라 권한이 필요합니다</Text>
                <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
                    <Text style={styles.permissionBtnText}>권한 요청</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const takePicture = async () => {
        if (cameraRef.current) {
            const result = await cameraRef.current.takePictureAsync();
            if (result) setPhoto(result.uri);
        }
    };

    const pickImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                const canAsk = await ImagePicker.getMediaLibraryPermissionsAsync();
                if (!canAsk.canAskAgain) {
                    Alert.alert(
                        '권한 필요',
                        '사진 앱을 열려면 사진 접근 권한이 필요합니다.',
                        [
                            { text: '취소', style: 'cancel' },
                            { text: '설정 열기', onPress: () => Linking.openSettings() },
                        ]
                    );
                    return;
                }
            }
            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 1,
            });

            if (!result.canceled) {
                setPhoto(result.assets[0].uri);
            }
        } catch (e) {
            console.log('[Camera] Image picker not available:', e);
        }
    };

    const confirmPhoto = () => {
        if (photo) {
            const resolvedLevel = level;
            // Navigate to generation screen with photo uri
            router.push({
                pathname: '/generation',
                params: { uri: photo, level: resolvedLevel }
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
                        <Text style={[styles.controlText, { color: '#000' }]}>이 사진 사용</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView style={styles.camera} ref={cameraRef} />
            <SafeAreaView style={styles.overlay}>
                <View style={styles.topRow}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                        <Ionicons name="chevron-back" size={28} color="#fff" />
                    </TouchableOpacity>
                    <View style={{ width: 44 }} />
                </View>

                <View style={styles.guideContainer}>
                    <View style={styles.guideFrame} />
                    <Text style={styles.guideText}>피사체를 프레임에 맞춰주세요</Text>
                </View>

                <View style={styles.levelPanel}>
                    <Text style={styles.levelTitle}>레벨 선택</Text>
                    <View style={styles.levelRowPanel}>
                        {(['L1', 'L2', 'L3'] as const).map((lv) => (
                            <TouchableOpacity
                                key={lv}
                                style={[styles.levelCard, level === lv && styles.levelCardActive]}
                                onPress={() => {
                                    setLevel(lv);
                                    saveLevel(lv);
                                }}
                            >
                                <Text style={[styles.levelCardText, level === lv && styles.levelCardTextActive]}>{lv}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.bottomControls}>
                    <View style={{ width: 60 }} />
                    <TouchableOpacity style={styles.shutterBtn} onPress={takePicture}>
                        <View style={styles.shutterInner} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.galleryBtn} onPress={pickImage}>
                        <Ionicons name="images-outline" size={28} color="#fff" />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
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
        fontFamily: 'NotoSansKR_400Regular',
    },
    camera: {
        flex: 1,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        flex: 1,
        justifyContent: 'space-between',
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingTop: 8,
    },
    backBtn: {
        padding: 12,
    },
    levelPanel: {
        marginTop: 14,
        marginHorizontal: 20,
        padding: 12,
        borderRadius: 18,
        backgroundColor: 'rgba(0,0,0,0.55)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    levelTitle: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '800',
        marginBottom: 10,
        fontFamily: 'NotoSansKR_700Bold',
    },
    levelRowPanel: {
        flexDirection: 'row',
        gap: 8,
    },
    levelCard: {
        flex: 1,
        borderRadius: 14,
        paddingVertical: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    levelCardActive: {
        backgroundColor: '#ffe135',
        borderColor: '#111',
    },
    levelCardText: {
        fontSize: 12,
        fontWeight: '900',
        color: '#fff',
        fontFamily: 'NotoSansKR_700Bold',
    },
    levelCardTextActive: {
        color: '#111',
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
        fontFamily: 'NotoSansKR_500Medium',
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
        fontFamily: 'NotoSansKR_500Medium',
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
        fontFamily: 'NotoSansKR_500Medium',
    }
});
