"use client";

import React, { Suspense, useEffect, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import {
  Bounds,
  ContactShadows,
  Environment,
  Html,
  OrbitControls,
  useGLTF,
} from "@react-three/drei";
import { ACESFilmicToneMapping } from "three";
import { Box3, Vector3 } from "three";
import type { Material, Object3D } from "three";
import type { MaterialSlot } from "@/types/customize";

type Props = {
  modelUrl: string;
  selectedColors: string[];
  defaultHexes?: string[];
  onSlotsDetected?: (slots: MaterialSlot[]) => void;
  heightClassName?: string;
};

type ErrorBoundaryProps = {
  children: React.ReactNode;
  fallback: React.ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

class ViewerErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (prevProps.children !== this.props.children && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

function ModelMesh({ modelUrl, selectedColors, defaultHexes = [], onSlotsDetected }: Props) {
  const gltf = useGLTF(modelUrl);
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  const fitTransform = useMemo(() => {
    const box = new Box3().setFromObject(scene);
    const center = new Vector3();
    const size = new Vector3();
    box.getCenter(center);
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z, 1);
    const scale = 1.8 / maxDim;
    return {
      scale,
      position: [-center.x * scale, -center.y * scale, -center.z * scale] as [
        number,
        number,
        number,
      ],
    };
  }, [scene]);

  const buckets = useMemo(() => {
    const map = new Map<string, { slot: MaterialSlot; materials: Material[] }>();
    let unnamedCount = 0;

    scene.traverse((obj) => {
      const mesh = obj as {
        isMesh?: boolean;
        material?: Material | Material[];
      };
      if (!mesh.isMesh || !mesh.material) return;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const material of materials) {
        if (!material) continue;
        const rawName = material.name?.trim();
        const key = rawName || material.uuid;
        if (!map.has(key)) {
          unnamedCount += rawName ? 0 : 1;
          map.set(key, {
            slot: {
              key,
              label: rawName || `Material ${unnamedCount}`,
            },
            materials: [],
          });
        }
        map.get(key)?.materials.push(material);
      }
    });

    return Array.from(map.values());
  }, [scene]);

  useEffect(() => {
    onSlotsDetected?.(buckets.map((x) => x.slot));
  }, [buckets, onSlotsDetected]);

  useEffect(() => {
    buckets.forEach((bucket, index) => {
      const rawColor = selectedColors[index] || defaultHexes[index] || "";
      if (!rawColor) return;

      bucket.materials.forEach((material) => {
        const maybe = material as Material & {
          color?: { set: (value: string) => void };
          roughness?: number;
          metalness?: number;
          envMapIntensity?: number;
        };
        if (!maybe.color?.set) return;
        maybe.color.set(rawColor);
        if (typeof maybe.roughness === "number") {
          maybe.roughness = Math.max(0.55, maybe.roughness);
        }
        if (typeof maybe.metalness === "number") {
          maybe.metalness = Math.min(0.08, maybe.metalness);
        }
        if (typeof maybe.envMapIntensity === "number") {
          maybe.envMapIntensity = Math.min(0.35, maybe.envMapIntensity || 0.35);
        }
        material.needsUpdate = true;
      });
    });
  }, [buckets, defaultHexes, selectedColors]);

  return (
    <group scale={fitTransform.scale} position={fitTransform.position}>
      <primitive object={scene as Object3D} />
    </group>
  );
}

function LoadingFallback() {
  return (
    <Html center>
      <div className="rounded-md border border-white/15 bg-black/70 px-3 py-2 text-xs text-white/90">
        Loading model...
      </div>
    </Html>
  );
}

export default function ModelViewer3D({
  modelUrl,
  selectedColors,
  defaultHexes = [],
  onSlotsDetected,
  heightClassName = "h-[520px]",
}: Props) {
  return (
    <ViewerErrorBoundary
      fallback={
        <div
          className={`${heightClassName} flex items-center justify-center rounded-xl border border-red-300/30 bg-red-400/10 px-4 text-sm text-red-100`}
        >
          Failed to load 3D model. Check model URL or file format.
        </div>
      }
    >
      <div
        className={`${heightClassName} overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-[#0f131b] via-[#0b0f16] to-[#080b10]`}
      >
        <Canvas
          shadows
          dpr={[1, 2]}
          camera={{ position: [0, 1.25, 3.8], fov: 42 }}
          gl={{ antialias: true, powerPreference: "high-performance" }}
          onCreated={({ gl }) => {
            gl.toneMapping = ACESFilmicToneMapping;
            gl.toneMappingExposure = 0.72;
          }}
        >
          <color attach="background" args={["#0b0f16"]} />
          <hemisphereLight intensity={0.14} color="#dbe6ff" groundColor="#0f0d0b" />
          <directionalLight position={[-4, 2.5, -4]} intensity={0.08} color="#8ea3ff" />
          <directionalLight position={[5, 2.8, -1]} intensity={0.1} color="#ffc5a3" />
          <spotLight
            position={[4, 6, 6]}
            angle={0.4}
            penumbra={0.6}
            intensity={0.9}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          <Environment preset="warehouse" />
          <ContactShadows
            position={[0, -1.3, 0]}
            opacity={0.2}
            scale={12}
            blur={2}
            far={5}
            resolution={512}
          />

          <Suspense fallback={<LoadingFallback />}>
            <Bounds fit clip observe margin={1.25}>
              <ModelMesh
                modelUrl={modelUrl}
                selectedColors={selectedColors}
                defaultHexes={defaultHexes}
                onSlotsDetected={onSlotsDetected}
              />
            </Bounds>
          </Suspense>

          <OrbitControls
            enableDamping
            enablePan={false}
            target={[0, 0, 0]}
            minDistance={1.2}
            maxDistance={12}
            maxPolarAngle={Math.PI * 0.8}
          />
        </Canvas>
      </div>
    </ViewerErrorBoundary>
  );
}
