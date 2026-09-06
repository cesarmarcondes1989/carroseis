"use client";
import { useEffect, useRef, useState } from "react";
import { SlideView, type SlideProps } from "@/lib/render/Slide";
import { SIZES } from "@/lib/types";

/** Renderiza o slide real (1080px) e escala pra caber no container. */
export function SlidePreview({ className, ...props }: SlideProps & { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.2);
  const { w, h } = SIZES[props.aspect];
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setScale(e.contentRect.width / w));
    ro.observe(el);
    return () => ro.disconnect();
  }, [w]);
  return (
    <div ref={ref} className={className} style={{ width: "100%", aspectRatio: `${w} / ${h}`, position: "relative", overflow: "hidden", borderRadius: 12 }}>
      <div style={{ position: "absolute", top: 0, left: 0, width: w, height: h, transform: `scale(${scale})`, transformOrigin: "top left" }}>
        <SlideView {...props} />
      </div>
    </div>
  );
}
