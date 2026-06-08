import Image from "next/image";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  priority?: boolean;
};

export function BrandLogo({ className, priority = false }: BrandLogoProps) {
  return (
    <span
      className={cn(
        "relative block shrink-0 overflow-hidden rounded-[28%] bg-canvas shadow-[0_4px_0_rgba(114,93,66,0.14)] ring-1 ring-hairline/80",
        className
      )}
    >
      <Image
        src="/brand/zhizhi-mark.svg"
        alt="知知小助手"
        fill
        priority={priority}
        sizes="96px"
        className="object-contain p-[7%]"
      />
    </span>
  );
}
