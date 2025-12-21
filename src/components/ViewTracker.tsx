'use client';

import { useEffect, useRef } from 'react';

interface ViewTrackerProps {
  postId: string;
}

export default function ViewTracker({ postId }: ViewTrackerProps) {
  const tracked = useRef(false);

  useEffect(() => {
    // Only track once per page load
    if (tracked.current) return;
    tracked.current = true;

    // Use sendBeacon for reliable tracking even on page close
    const trackView = async () => {
      try {
        // Check if already tracked in this session
        const sessionKey = `viewed_${postId}`;
        if (sessionStorage.getItem(sessionKey)) {
          return; // Already viewed in this session
        }

        // Track the view
        await fetch(`/api/blog/track-view`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId }),
        });

        // Mark as viewed in session
        sessionStorage.setItem(sessionKey, 'true');
      } catch {
        // Silently fail - don't break the page for analytics
      }
    };

    // Small delay to ensure it's a real visit, not a bot
    const timer = setTimeout(trackView, 1000);
    return () => clearTimeout(timer);
  }, [postId]);

  // Render nothing - this is just for tracking
  return null;
}
