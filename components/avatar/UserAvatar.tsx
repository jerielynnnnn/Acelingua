"use client";

import Image from "next/image";
import { UserRound } from "lucide-react";
import { useState } from "react";

export type AvatarCategory = "base" | "face" | "hair" | "clothes";
export type AvatarLayer = { category: AvatarCategory; name: string; imagePath: string };
const layerOrder: AvatarCategory[] = ["base", "face", "clothes", "hair"];

type Props = {
  layers: AvatarLayer[];
  className?: string;
  onLayerError?: (category: AvatarCategory, imagePath: string) => void;
};

/** Artwork shares a canvas. White-backed starter layers use multiply blending. */
export default function UserAvatar({ layers, className = "", onLayerError }: Props) {
  const [failedPaths, setFailedPaths] = useState<string[]>([]);
  const ordered = layerOrder.flatMap((category) => layers.filter((layer) => layer.category === category));
  const validPath = (path: string) => (path.startsWith("/") && !path.startsWith("//")) || /^https?:\/\//i.test(path);
  const visible = ordered.filter((layer) => validPath(layer.imagePath) && !failedPaths.includes(layer.imagePath));
  const unavailable = ordered.filter((layer) => !validPath(layer.imagePath) || failedPaths.includes(layer.imagePath));

  return <div className={className}>
    <div role="img" aria-label="Your learner avatar" className="relative isolate aspect-square w-full overflow-hidden bg-white">
      {!visible.length && <div className="absolute inset-0 flex items-center justify-center text-[#3558AE]/40"><UserRound size={96} aria-hidden="true" /></div>}
      {visible.map((layer) => <Image
        key={`${layer.category}:${layer.imagePath}`}
        src={layer.imagePath}
        alt=""
        fill
        unoptimized
        sizes="(max-width: 768px) 80vw, 400px"
        className="pointer-events-none absolute inset-0 h-full w-full object-contain"
        // White is neutral with multiply, so opaque starter backgrounds no
        // longer hide lower layers. Isolation keeps blending inside the avatar.
        style={{ zIndex: layerOrder.indexOf(layer.category) + 1, mixBlendMode: "multiply" }}
        onError={() => {
          setFailedPaths((paths) => paths.includes(layer.imagePath) ? paths : [...paths, layer.imagePath]);
          onLayerError?.(layer.category, layer.imagePath);
        }}
      />)}
    </div>
    {!!unavailable.length && <p role="status" className="mt-3 text-center text-xs leading-5 text-[#B64074]">
      Image unavailable: {unavailable.map((layer) => layer.name).join(", ")}.
    </p>}
  </div>;
}
