/**
 * Referral Sync Component
 * 
 * Runs after OAuth login to sync UTM params from localStorage to the database.
 * This captures referral sources for Google/GitHub signups.
 */

'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';

export default function ReferralSync() {
  const { data: session, status } = useSession();
  const syncedRef = useRef(false);
  
  useEffect(() => {
    // Only run once when session becomes authenticated
    if (status !== 'authenticated' || !session?.user?.id || syncedRef.current) {
      return;
    }
    
    // Prevent duplicate syncs
    syncedRef.current = true;
    
    // Check if we have UTM params in localStorage
    const storedParams = localStorage.getItem('utm_params');
    if (!storedParams) {
      return;
    }
    
    try {
      const utmParams = JSON.parse(storedParams);
      
      // Only sync if we have actual referral data
      if (!utmParams.source && !utmParams.medium && !utmParams.campaign) {
        return;
      }
      
      // Send to API to update user's referral source
      fetch('/api/user/update-referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: utmParams.source,
          medium: utmParams.medium,
          campaign: utmParams.campaign,
        }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            console.log('[ReferralSync] Synced referral source:', data);
            // Don't clear localStorage - keep for analytics
          }
        })
        .catch(err => {
          console.error('[ReferralSync] Failed to sync:', err);
          // Reset ref so it can retry on next render
          syncedRef.current = false;
        });
        
    } catch (e) {
      console.error('[ReferralSync] Parse error:', e);
    }
  }, [session, status]);
  
  // This component doesn't render anything
  return null;
}
