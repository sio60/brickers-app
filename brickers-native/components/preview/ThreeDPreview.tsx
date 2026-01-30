// components/preview/ThreeDPreview.tsx
import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { View, StyleSheet, Text } from "react-native";
import { Canvas } from "@react-three/fiber/native";
import { OrbitControls, Bounds } from "@react-three/drei/native";
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
        // LDrawLoader.parse( text, path, onLoad )
        // Some versions of LDrawLoader might have issues with empty path
        const syncResult = loader.parse(resolved.value, partsBase, (g: any) => {
          handleSuccess(g);
        });
        if (syncResult && !isSettled) {
          console.log("[LDraw] loader.parse returned sync result");
          handleSuccess(syncResult);
        }
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
}: {
  url: string;
  partsBase: string;
  stepMode?: boolean;
  currentStep?: number;
  onStepCountChange?: (count: number) => void;
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
        box.getCenter(center);

        if (center && typeof center.x === "number" && isFinite(center.x)) {
          g.position.sub(center);
        }

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
// Main Component
// ---------------------------
export default function ThreeDPreview({
  url,
  stepMode = false,
  currentStep = 1,
  onStepCountChange,
}: ThreeDPreviewProps) {
  const [partsBase, setPartsBase] = useState<string>("");
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    let alive = true;
    ensureLocalLdrawLibrary().then((base) => {
      if (alive) setPartsBase(base);
    });
    return () => { alive = false; };
  }, []);

  return (
    <View style={styles.container}>
      <Canvas camera={{ position: [250, 250, 250], fov: 45, near: 1, far: 100000 }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.9} />
          <directionalLight position={[200, 300, 200]} intensity={1.2} />

          <Bounds fit clip observe margin={1.2}>
            {url && partsBase ? (
              <LdrModel
                url={url}
                partsBase={partsBase}
                stepMode={stepMode}
                currentStep={currentStep}
                onStepCountChange={onStepCountChange}
              />
            ) : (
              <mesh>
                <boxGeometry args={[20, 20, 20]} />
                <meshBasicMaterial color="transparent" />
              </mesh>
            )}
          </Bounds>

          <OrbitControls
            ref={controlsRef}
            makeDefault
            enablePan={false}
            minDistance={20}
            maxDistance={2000}
          />
        </Suspense>
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" }
});
