import Image, { type ImageProps } from "next/image";
import logo from "@/public/logoace.png";

type LogoProps = Omit<ImageProps, "src" | "width" | "height" | "fill">;

export default function Logo({ alt = "ACELingua", ...props }: LogoProps) {
  return <Image {...props} src={logo} alt={alt} unoptimized />;
}
