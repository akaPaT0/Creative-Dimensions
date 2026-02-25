"use client";

import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { Bounds, Environment, Html, OrbitControls } from "@react-three/drei";
import type { Object3D } from "three";

type Props = {
  source: Object3D | null;
  scaleVec: [number, number, number];
};

function LoadingFallback() {
  return (
    <Html center>
      <div className="rounded-md border border-white/15 bg-black/70 px-3 py-2 text-xs text-white/90">
        Loading preview...
      </div>
    </Html>
  );
}

function PreviewObject({
  source,
  scaleVec,
}: {
  source: Object3D;
  scaleVec: [number, number, number];
}) {
  const clone = useMemo(() => source.clone(true), [source]);
  clone.scale.set(scaleVec[0], scaleVec[1], scaleVec[2]);
  return <primitive object={clone} />;
}

export default function ModelPreview({ source, scaleVec }: Props) {
  return (
    <div className="h-[340px] sm:h-[460px] overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-[#0f131b] via-[#0b0f16] to-[#080b10]">
      <Canvas camera={{ position: [0, 1.2, 3.8], fov: 42 }} dpr={[1, 2]}>
        <color attach="background" args={["#0b0f16"]} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[4, 5, 4]} intensity={0.7} />
        <directionalLight position={[-4, 3, -3]} intensity={0.28} />
        <Environment preset="warehouse" />
        <Suspense fallback={<LoadingFallback />}>
          {source ? (
            <Bounds fit clip observe margin={1.25}>
              <PreviewObject source={source} scaleVec={scaleVec} />
            </Bounds>
          ) : (
            <Html center>
              <div className="text-sm text-white/65">Upload STL or 3MF to preview</div>
            </Html>
          )}
        </Suspense>
        <OrbitControls enableDamping />
      </Canvas>
    </div>
  );
}
