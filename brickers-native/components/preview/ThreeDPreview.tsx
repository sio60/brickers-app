// components/preview/ThreeDPreview.tsx
import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { View, StyleSheet, Text, LayoutChangeEvent } from "react-native";
import { Canvas, useThree } from "@react-three/fiber/native";
import { OrbitControls } from "@react-three/drei/native";
import { GestureDetector, Gesture, GestureHandlerRootView } from "react-native-gesture-handler";
import * as THREE from "three";

// @ts-ignore
import { LDrawLoader } from "three/examples/jsm/loaders/LDrawLoader.js";
// @ts-ignore
import { LDrawConditionalLineMaterial } from "three/examples/jsm/materials/LDrawConditionalLineMaterial.js";

import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";

// ---------------------------
// Constants
// ---------------------------
const CDN_BASE = "https://raw.githubusercontent.com/gkjohnson/ldraw-parts-library/master/complete/ldraw/";

const ASSET_MAP: Record<string, number> = {
  "assets/model/car.ldr": require("../../assets/model/car.ldr"),
};

interface ThreeDPreviewProps {
  url: string | null;
  stepMode?: boolean;
  currentStep?: number;
  onStepCountChange?: (count: number) => void;
}

// ---------------------------
// Utils
// ---------------------------
async function resolveAssetUrl(url: string): Promise<{ type: "url" | "text"; value: string }> {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return { type: "url", value: url };
  }

  if (url.startsWith("assets/")) {
    const mod = ASSET_MAP[url];
    if (!mod) throw new Error(`Unmapped asset url: "${url}"`);
    const asset = Asset.fromModule(mod);
    await asset.downloadAsync();
    const localUri = asset.localUri ?? asset.uri;
    if (!localUri) throw new Error("Could not download asset");
    const text = await FileSystem.readAsStringAsync(localUri);
    return { type: "text", value: text };
  }

  if (url.startsWith("file://") || url.startsWith("/")) {
    const text = await FileSystem.readAsStringAsync(url);
    return { type: "text", value: text };
  }

  throw new Error(`Unknown url protocol: ${url}`);
}

async function ensureLocalLdrawLibrary(): Promise<string> {
  // Android OOM 방지를 위해 CDN 강제 사용
  console.log("[LDraw] forcing CDN to avoid OOM");
  return CDN_BASE;
}

function disposeObject3D(root: THREE.Object3D) {
  if (!root) return;
  root.traverse((obj: any) => {
    if (obj.geometry) obj.geometry.dispose?.();
    if (obj.material) {
      const mat = obj.material;
      if (Array.isArray(mat)) mat.forEach((m) => m?.dispose?.());
      else mat?.dispose?.();
    }
  });
}

// (A) Robust Loader Promise with Diagnostics
async function loadLDrawGroup(
  loader: any,
  resolved: { type: "url" | "text"; value: string },
  partsBase: string
): Promise<THREE.Group> {
  return new Promise((resolve, reject) => {
    let isSettled = false;

    const handleSuccess = (g: any) => {
      if (isSettled) return;
      console.log(`[LDraw] handleSuccess: type=${typeof g}, constructor=${g?.constructor?.name}`);

      if (g instanceof Error) {
        console.error(`[LDraw] Received error in success callback: ${g.message}\n${g.stack}`);
        isSettled = true;
        return reject(g);
      }

      if (!g) {
        isSettled = true;
        return reject(new Error("Loader returned null or undefined result"));
      }

      // If it's a scene wrapper (like GLTF), extract the scene
      let finalGroup = g;
      if (!g.add && g.scene) {
        console.log("[LDraw] Result has .scene property, using it.");
        finalGroup = g.scene;
      }

      if (typeof finalGroup.add !== "function") {
        console.log("[LDraw] Result keys:", Object.keys(g));
        // If it looks like an error but not instanceof Error (due to multiple three.js instances)
        // or if it's a TypeError object returned by LDrawLoader internally
        if (g.message || g.stack || g.constructor?.name === 'TypeError') {
          const errMsg = g.message || "TypeError occurred inside LDrawLoader";
          console.error(`[LDraw] Result looks like an error: ${errMsg}`);
          isSettled = true;
          return reject(new Error(errMsg));
        }
        isSettled = true;
        return reject(new Error(`Invalid result type: ${g?.constructor?.name || typeof g}`));
      }

      isSettled = true;
      resolve(finalGroup as THREE.Group);
    };

    const handleError = (err: any) => {
      if (isSettled) return;
      isSettled = true;
      const msg = err?.message || String(err);
      console.error("[LDraw] loadLDrawGroup Error:", msg);
      reject(new Error(msg));
    };

    try {
      if (resolved.type === "url") {
        loader.load(resolved.value, handleSuccess, undefined, handleError);
      } else {
        if (!resolved.value) throw new Error("Content text is empty");
        console.log(`[LDraw] Parsing text (length: ${resolved.value.length})`);
        // three.js 0.182+ 에서는 parse(text, onLoad, onError) 시그니처
        // path는 이미 setPartsLibraryPath()로 설정됨
        loader.parse(resolved.value, handleSuccess, handleError);
      }
    } catch (e) {
      handleError(e);
    }
  });
}

// ---------------------------
// LdrModel Component
// ---------------------------
function LdrModel({
  url,
  partsBase,
  stepMode = false,
  currentStep = 1,
  onStepCountChange,
  onModelSize,
}: {
  url: string;
  partsBase: string;
  stepMode?: boolean;
  currentStep?: number;
  onStepCountChange?: (count: number) => void;
  onModelSize?: (size: number) => void;
}) {
  const [group, setGroup] = useState<THREE.Group | null>(null);
  const isActiveRef = useRef(true);

  const loader = useMemo(() => {
    THREE.Cache.enabled = true;
    const manager = new THREE.LoadingManager();

    // (C) Enhanced Loading Logs & URL Mapping
    manager.setURLModifier((u: string) => {
      if (!partsBase.startsWith("http")) return u;
      const cleanUrl = u.split(/[?#]/)[0];
      const parts = cleanUrl.split(/[/\\]/);
      const filename = parts[parts.length - 1].toLowerCase();
      if (!filename) return u;

      if (filename === "ldconfig.ldr") return `${partsBase}LDConfig.ldr`;
      if (/^\d+s\d+[a-z]?\.dat$/.test(filename)) return `${partsBase}parts/s/${filename}`;
      const isPrimitive = /^\d+-\d+/.test(filename) || /^(stud|stug|rect|box|cyli|disc|edge|ring|ndis|con|rin|tri)/.test(filename);
      if (isPrimitive) return `${partsBase}p/${filename}`;
      return `${partsBase}parts/${filename}`;
    });

    manager.onProgress = (u, loaded, total) => {
      const percent = Math.floor((loaded / total) * 100);
      if (percent % 25 === 0) console.log(`[LDraw] Loading: ${percent}% (${u.split('/').pop()})`);
    };

    manager.onError = (u) => {
      console.warn(`[LDraw] 404/Error: [${u.split('/').pop()}] at [${u}]`);
    };

    const l = new LDrawLoader(manager);
    l.setPartsLibraryPath(partsBase);
    (l as any).smoothNormals = true;
    try {
      (l as any).setConditionalLineMaterial(LDrawConditionalLineMaterial);
    } catch (e) { }
    return l;
  }, [partsBase]);

  useEffect(() => {
    isActiveRef.current = true;
    let loadedObj: THREE.Group | null = null;

    const run = async () => {
      try {
        setGroup(null);
        if (!url || !partsBase) return;

        console.log(`[LdrModel] Start: ${url}`);
        await loader.preloadMaterials("LDConfig.ldr");

        const resolved = await resolveAssetUrl(url);
        if (!isActiveRef.current) return;

        // (A) Safe Load
        const g = await loadLDrawGroup(loader, resolved, partsBase);

        // (B) Defensive run() guards
        if (!isActiveRef.current) {
          disposeObject3D(g);
          return;
        }

        if (!g || !g.position || !g.rotation) {
          throw new Error("Loaded group is invalid/missing properties");
        }

        // Apply safely
        g.rotation.x = Math.PI;
        g.updateMatrixWorld(true);

        const box = new THREE.Box3().setFromObject(g);
        const center = new THREE.Vector3();
        const boxSize = new THREE.Vector3();
        box.getCenter(center);
        box.getSize(boxSize);

        if (center && typeof center.x === "number" && isFinite(center.x)) {
          g.position.sub(center);
        }

        // 모델 크기 계산 (대각선 길이)
        const modelSize = boxSize.length();
        console.log(`[LdrModel] Model size: ${modelSize}`);
        onModelSize?.(modelSize);

        if (!isActiveRef.current) {
          disposeObject3D(g);
          return;
        }

        console.log(`[LdrModel] Success: ${g.children.length} nodes`);
        onStepCountChange?.(g.children.length);
        loadedObj = g;
        setGroup(g);

      } catch (e) {
        const msg = (e as any)?.message || String(e);
        console.error(`[LdrModel] Error [${url}]:`, msg);
        if (isActiveRef.current) setGroup(null);
      }
    };

    run();

    return () => {
      isActiveRef.current = false;
      if (loadedObj) disposeObject3D(loadedObj);
    };
  }, [url, loader, partsBase]);

  // Step Mode
  useEffect(() => {
    if (!group || !stepMode) return;
    group.children.forEach((child, index) => {
      child.visible = index < currentStep;
    });
  }, [group, currentStep, stepMode]);

  if (!group) {
    return (
      <mesh>
        <boxGeometry args={[10, 10, 10]} />
        <meshStandardMaterial color="#ddd" wireframe />
      </mesh>
    );
  }

  return <primitive object={group} />;
}

// ---------------------------
// Camera Controller (모델 크기에 맞게 카메라 설정)
// ---------------------------
function CameraController({ modelSize, zoomLevel }: { modelSize: number; zoomLevel: number }) {
  const { camera } = useThree();

  useEffect(() => {
    if (camera && modelSize > 0) {
      // 모델이 화면에 잘 보이도록 카메라 거리 계산
      // fov 45도 기준, 모델 크기의 2배 거리면 적당함
      const baseDistance = modelSize * 2;
      const distance = baseDistance / zoomLevel;

      // 카메라를 대각선 방향에 배치
      const dir = new THREE.Vector3(1, 1, 1).normalize();
      camera.position.copy(dir.multiplyScalar(distance));
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();

      console.log(`[Camera] modelSize=${modelSize}, zoom=${zoomLevel}, distance=${distance}`);
    }
  }, [modelSize, zoomLevel, camera]);

  return null;
}

// ---------------------------
// Main Component
// ---------------------------
export default function ThreeDPreview({
  url,
  stepMode = false,
  currentStep = 1,
  onStepCountChange,
}: ThreeDPreviewProps) {
  const [partsBase, setPartsBase] = useState<string>("");
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [modelSize, setModelSize] = useState(0);
  const baseZoomRef = useRef(1);
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    let alive = true;
    ensureLocalLdrawLibrary().then((base) => {
      if (alive) setPartsBase(base);
    });
    return () => { alive = false; };
  }, []);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize({ width, height });
  };

  // 핀치 줌 제스처
  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      baseZoomRef.current = zoomLevel;
    })
    .onUpdate((e) => {
      const newZoom = Math.max(0.3, Math.min(5, baseZoomRef.current * e.scale));
      setZoomLevel(newZoom);
    });

  // 모바일에서 크기가 0이면 Canvas가 렌더링되지 않음
  const canRender = size.width > 0 && size.height > 0;

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {canRender ? (
        <GestureHandlerRootView style={{ width: size.width, height: size.height }}>
          <GestureDetector gesture={pinchGesture}>
            <View style={{ flex: 1 }}>
            <Canvas
              style={{ flex: 1 }}
              camera={{ position: [250, 250, 250], fov: 45, near: 1, far: 100000 }}
              gl={{
                antialias: true,
                alpha: true,
                preserveDrawingBuffer: true,
                powerPreference: "high-performance",
              }}
              onCreated={({ gl }) => {
                // 모바일 GL 컨텍스트 초기화
                gl.setClearColor(0x000000, 0);
              }}
            >
              <Suspense fallback={null}>
                <ambientLight intensity={0.9} />
                <directionalLight position={[200, 300, 200]} intensity={1.2} />

                <CameraController modelSize={modelSize} zoomLevel={zoomLevel} />

                {url && partsBase ? (
                  <LdrModel
                    url={url}
                    partsBase={partsBase}
                    stepMode={stepMode}
                    currentStep={currentStep}
                    onStepCountChange={onStepCountChange}
                    onModelSize={setModelSize}
                  />
                ) : (
                  <mesh>
                    <boxGeometry args={[20, 20, 20]} />
                    <meshBasicMaterial color="transparent" />
                  </mesh>
                )}

                <OrbitControls
                  ref={controlsRef}
                  makeDefault
                  enablePan={false}
                  enableZoom={false}
                  enableDamping={false}
                  minDistance={20}
                  maxDistance={2000}
                />
              </Suspense>
            </Canvas>
            </View>
          </GestureDetector>
        </GestureHandlerRootView>
      ) : (
        <View style={styles.loading}>
          <Text style={{ color: "#999" }}>로딩 중...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
});
