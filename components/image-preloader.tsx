"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const BATCH_SIZE = 3;
const BATCH_INTERVAL_MS = 200;
const INITIAL_DELAY_MS = 1000;

interface ImagePreloaderProps {
  images: { src: string }[];
}

export function ImagePreloader({ images }: ImagePreloaderProps) {
  const [batch, setBatch] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!images.length || startedRef.current) return;
    startedRef.current = true;

    const timer = setTimeout(() => setBatch(1), INITIAL_DELAY_MS);
    return () => clearTimeout(timer);
  }, [images.length]);

  useEffect(() => {
    if (batch === 0) return;

    const total = images.filter((i) => i.src).length;
    const loaded = batch * BATCH_SIZE;
    if (loaded >= total) return;

    const timer = setTimeout(() => setBatch((b) => b + 1), BATCH_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [batch, images]);

  if (batch === 0) return null;

  const visible = images
    .filter((i) => i.src)
    .slice(0, batch * BATCH_SIZE);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute top-[-9999px] left-[-9999px] opacity-0"
    >
      {visible.map((img) => (
        <Image
          key={img.src}
          src={img.src}
          alt=""
          width={860}
          height={484}
          priority
          sizes="860px"
        />
      ))}
    </div>
  );
}
