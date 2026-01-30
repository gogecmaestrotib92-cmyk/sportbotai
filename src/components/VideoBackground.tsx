/**
 * Video Background Component
 * 
 * Now uses static turf texture for premium sports aesthetic (Props.Cash style).
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
          src="/images/turf-bg.webp"
          alt=""
          fill
          priority={isLCP}
          fetchPriority={isLCP ? "high" : "auto"}
          quality={75}
          sizes="100vw"
          className="object-cover"
          placeholder="empty"
        />

        {/* Dark vignette overlay for depth */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(0,0,0,0.7)_80%)]" />

        {/* Subtle brand accent glow (top-right) */}
        <div className="absolute -top-20 -right-20 w-[350px] h-[350px] bg-accent/25 rounded-full blur-[120px]" />

        {/* Secondary ambient glow (bottom-left) */}
        <div className="absolute -bottom-20 -left-20 w-[280px] h-[280px] bg-accent/15 rounded-full blur-[100px]" />
      </div>

      {/* Dark overlay for text readability */}
      <div
        className="absolute inset-0 bg-bg-primary"
        style={{ opacity: overlayOpacity }}
      />

      {/* Gradient fade at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-bg-primary to-transparent" />
    </div>
  );
}
