
import Image from "next/image";

export default function WorldLandmarks() {
  return (
    <div
      className="ace-world-v6-landmarks"
      aria-hidden="true"
    >
      <div className="ace-world-v6-landmark-arc">
        <Image
          src="/world/landmarks.png"
          alt=""
          fill
          sizes="(max-width: 640px) 62vw, 334px"
          className="object-contain"
        />
      </div>
    </div>
  );
}
