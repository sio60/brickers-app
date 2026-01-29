import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber/native';
import { OrbitControls, Stage, PerspectiveCamera } from '@react-three/drei/native';
import { View, StyleSheet, ActivityIndicator } from 'react-native';

interface ThreeDPreviewProps {
    url: string | null;
}

const Model = ({ url }: { url: string }) => {
    // Logic to load LDR or GLB would go here.
    // For now, let's use a placeholder box to demonstrate the 3D environment.
    return (
        <mesh>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#ffe135" />
        </mesh>
    );
};

export default function ThreeDPreview({ url }: ThreeDPreviewProps) {
    return (
        <View style={styles.container}>
            <Canvas>
                <Suspense fallback={null}>
                    <PerspectiveCamera makeDefault position={[3, 3, 3]} />
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} />
                    <Stage environment="city" intensity={0.6}>
                        {url ? <Model url={url} /> : (
                            <mesh>
                                <boxGeometry args={[0.5, 0.5, 0.5]} />
                                <meshStandardMaterial color="#ccc" />
                            </mesh>
                        )}
                    </Stage>
                    <OrbitControls enablePan={false} />
                </Suspense>
            </Canvas>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f8f8',
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#000',
    },
});
