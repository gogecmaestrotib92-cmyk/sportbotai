/**
 * Video Background Component
 * 
 * Uses AI-generated cinematic stadium image (Flux via Replicate).
 * Benefits:
 * - Faster LCP (no video to load)
 * - Consistent look across all devices
 * - Reduced bandwidth usage
 * - Works on all browsers
 * 
 * PERFORMANCE: Uses Next.js Image with priority for fast LCP
 */

import Image from 'next/image';

interface VideoBackgroundProps {
  /** Video source (MP4) - DEPRECATED, turf texture is now used */
  videoSrc?: string;
  /** WebM source (optional) - DEPRECATED */
  webmSrc?: string;
  /** Mobile-optimized video source - DEPRECATED */
  mobileSrc?: string;
  /** Poster image shown while loading - DEPRECATED */
  posterSrc?: string;
  /** Overlay opacity (0-1) */
  overlayOpacity?: number;
  /** Disable video on mobile - DEPRECATED (turf is static) */
  disableOnMobile?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Is this the LCP element? If true, loads with priority */
  isLCP?: boolean;
}

export default function VideoBackground({
  overlayOpacity = 0.6,
  className = '',
  isLCP = true,
}: VideoBackgroundProps) {
  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      {/* Base: Real dark sports turf texture (Props.Cash style) */}
      <div className="absolute inset-0 bg-[#0a0a0b]">
        {/* Turf texture image - Using Next.js Image for LCP optimization */}
        <Image
          src="/images/generated/hero-alt-c.webp"
          alt=""
          fill
          priority={isLCP}
          fetchPriority={isLCP ? "high" : "auto"}
          quality={80}
          sizes="100vw"
          className="object-cover"
          placeholder="empty"
        />

        {/* Dark vignette overlay for depth - CSS only, no blur */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(0,0,0,0.7)_80%)]" />

        {/* Ambient glows - HIDDEN ON MOBILE (blur is expensive) */}
        <div className="hidden md:block absolute -top-20 -right-20 w-[350px] h-[350px] bg-accent/25 rounded-full blur-[80px]" aria-hidden="true" />
        <div className="hidden md:block absolute -bottom-20 -left-20 w-[280px] h-[280px] bg-accent/15 rounded-full blur-[60px]" aria-hidden="true" />
      </div>

      {/* Dark overlay for text readability */}
      <div
        className="absolute inset-0 bg-bg-primary opacity-40 md:opacity-50"
      />

      {/* Gradient fade at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-bg-primary to-transparent" />
    </div>
  );
}
