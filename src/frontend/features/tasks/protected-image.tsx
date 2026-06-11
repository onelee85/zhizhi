"use client";

import { useEffect, useState } from "react";
import { getProtectedImageBlob } from "@/features/api/client";
import { cn } from "@/lib/utils";

export function ProtectedImage({
  src,
  alt,
  className,
  link = false
}: {
  src: string;
  alt: string;
  className?: string;
  link?: boolean;
}) {
  const [objectUrl, setObjectUrl] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    let nextObjectUrl = "";
    setFailed(false);
    setObjectUrl("");

    void getProtectedImageBlob(src)
      .then((blob) => {
        if (!active) {
          return;
        }
        nextObjectUrl = URL.createObjectURL(blob);
        setObjectUrl(nextObjectUrl);
      })
      .catch(() => {
        if (active) {
          setFailed(true);
        }
      });

    return () => {
      active = false;
      if (nextObjectUrl) {
        URL.revokeObjectURL(nextObjectUrl);
      }
    };
  }, [src]);

  if (failed) {
    return (
      <div className={cn("grid place-items-center bg-surface-soft text-caption text-muted-soft", className)}>
        图片加载失败
      </div>
    );
  }

  if (!objectUrl) {
    return <div className={cn("animate-pulse bg-surface-soft", className)} aria-label="图片加载中" />;
  }

  const image = <img src={objectUrl} alt={alt} className={className} />;
  return link ? (
    <a href={objectUrl} target="_blank" rel="noreferrer">
      {image}
    </a>
  ) : image;
}
