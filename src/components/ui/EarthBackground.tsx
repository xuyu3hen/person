'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface EarthBackgroundProps {
  imageUrl: string;
  altText?: string;
  children: React.ReactNode;
}

export function EarthBackground({ imageUrl, altText = "NASA Earth Observation", children }: EarthBackgroundProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-950 text-white">
      {/* 备用背景方案 / Fallback Background */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-[#0a0a0a] to-black" />

      {/* NASA 地球背景图片 / NASA Earth Image */}
      {!hasError && (
        <motion.div
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: isLoaded ? 1 : 0, scale: isLoaded ? 1 : 1.05 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0 z-0"
        >
          <Image
            src={imageUrl}
            alt={altText}
            fill
            priority // 优先加载，因为是首屏背景
            sizes="100vw"
            className="object-cover object-center"
            quality={85} // 适当压缩以优化加载性能
            onLoad={() => setIsLoaded(true)}
            onError={() => setHasError(true)}
          />
        </motion.div>
      )}

      {/* 渐变遮罩层 / Gradient Overlay */}
      {/* 多重遮罩组合，确保不同光照区域下的文字可读性 */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/30 via-black/40 to-black/80" />
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/50 via-transparent to-black/50" />
      
      {/* 内容区域 / Content Area */}
      <div className="relative z-20 flex min-h-screen flex-col">
        {children}
      </div>
    </div>
  );
}
