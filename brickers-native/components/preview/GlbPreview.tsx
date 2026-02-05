import React, { Suspense, useMemo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Canvas, useLoader } from '@react-three/fiber/native';
import { OrbitControls } from '@react-three/drei/native';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';

function CenteredModel({ url }: { url: string }) {
  const gltf = useLoader(GLTFLoader, url);

  const scene = useMemo(() => {
    const root = gltf.scene || gltf.scenes?.[0];
    if (!root) return new THREE.Group();
    const box = new THREE.Box3().setFromObject(root);
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(size);
    root.position.sub(center);

    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const scale = 2 / maxDim;
    root.scale.setScalar(scale);
    return root;
  }, [gltf]);

  return <primitive object={scene} />;
}

export default function GlbPreview({ url }: { url: string | null }) {
  if (!url) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>GLB 모델이 없습니다</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Canvas
        style={styles.canvas}
        camera={{ position: [3, 3, 3], fov: 45, near: 0.1, far: 1000 }}
        gl={{ antialias: true, alpha: true }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
        }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.9} />
          <directionalLight position={[5, 6, 5]} intensity={1.3} />
          <CenteredModel url={url} />
          <OrbitControls makeDefault enablePan={false} />
        </Suspense>
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f3f3',
  },
  canvas: {
    flex: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f3f3',
  },
  emptyText: {
    color: '#999',
    fontSize: 12,
    fontWeight: '600',
  },
});
