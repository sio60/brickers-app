import React, { Suspense, useMemo, useState, useEffect } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { Canvas } from '@react-three/fiber/native';
import { OrbitControls, useGLTF } from '@react-three/drei/native';
import * as THREE from 'three';

// URL normalization for native environments
function normalizeUrl(raw: string) {
  if (!raw) return '';
  const trimmed = raw.trim();
  if (/^https?:%2F%2F/i.test(trimmed) || /^https?%3A%2F%2F/i.test(trimmed)) {
    try {
      return decodeURIComponent(trimmed);
    } catch {
      return trimmed;
    }
  }
  return trimmed;
}

function CenteredModel({ url }: { url: string }) {
  const normalizedUrl = useMemo(() => normalizeUrl(url), [url]);

  // useGLTF can throw errors on native if the file is invalid or network fails
  const { scene: rawScene } = useGLTF(normalizedUrl);

  const scene = useMemo(() => {
    if (!rawScene) return new THREE.Group();

    // Use a clone to avoid modifying the original cached scene
    const root = rawScene.clone();

    // Add some default materials if missing (common in AI generated GLBs)
    root.traverse((obj: any) => {
      if (obj.isMesh && !obj.material) {
        obj.material = new THREE.MeshStandardMaterial({ color: 0xcccccc });
      }
    });

    const box = new THREE.Box3().setFromObject(root);
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(size);

    // Recenter
    root.position.sub(center);

    // Scale to fit viewing volume
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const scale = 2 / maxDim;
    root.scale.setScalar(scale);

    return root;
  }, [rawScene]);

  return <primitive object={scene} />;
}

// Simple internal error boundary for the Canvas
class ModelErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>모델을 불러오지 못했습니다.</Text>
          <Text style={styles.errorSubText}>{String(this.state.error?.message || '알 수 없는 오류')}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function GlbPreview({ url }: { url: string | null }) {
  const [key, setKey] = useState(0);

  // Re-mount on URL change to clear state
  useEffect(() => {
    setKey(prev => prev + 1);
  }, [url]);

  if (!url) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>GLB 모델이 없습니다</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ModelErrorBoundary key={key}>
        <Canvas
          style={styles.canvas}
          camera={{ position: [3, 3, 3], fov: 45, near: 0.1, far: 1000 }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
          }}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0);
          }}
        >
          <Suspense fallback={null}>
            <ambientLight intensity={1.0} />
            <directionalLight position={[5, 8, 5]} intensity={1.5} />
            <directionalLight position={[-5, -5, -5]} intensity={0.5} color="#ffffff" />

            <CenteredModel url={url} />

            <OrbitControls
              makeDefault
              enablePan={false}
              enableDamping={true}
              dampingFactor={0.1}
              // Zoom internally causes crashes in some three-stdlib versions on native touch
              // If it still crashes, we might need to disable internal zoom like in ThreeDPreview
              enableZoom={true}
            />
          </Suspense>
        </Canvas>

        {/* Suspense fallback outside Canvas for better UI if needed, but fiber handles it internally */}
      </ModelErrorBoundary>
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
    fontFamily: 'NotoSansKR_400Regular',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f8f8f8',
  },
  errorText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
    marginBottom: 8,
    fontFamily: 'NotoSansKR_700Bold',
  },
  errorSubText: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    fontFamily: 'NotoSansKR_400Regular',
  }
});

