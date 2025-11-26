'use client';

import { Warp } from "@paper-design/shaders-react";

export default function BackgroundShaders() {
  return (
    <div className="fixed inset-0 -z-10 opacity-100">
      <Warp
        style={{ width: "100%", height: "100%" }}
        proportion={0.45}
        softness={1.2}
        distortion={0.15}
        swirl={0.6}
        swirlIterations={8}
        shape="checks"
        shapeScale={0.08}
        scale={1}
        rotation={0}
        speed={0.7}
        colors={["hsl(203, 100%, 62%)", "hsl(255, 100%, 72%)", "hsl(158, 99%, 59%)", "hsl(264, 100%, 61%)"]}
      />
    </div>
  );
}
