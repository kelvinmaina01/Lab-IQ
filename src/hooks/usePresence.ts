import { useEffect } from 'react';
import { teamService } from '@/services/teamService';

/**
 * Hook to track user presence (online/offline status)
 * Automatically sets user as online when mounted and offline when unmounted
 * Sends heartbeat every 30 seconds to update last_active timestamp
 */
export const usePresence = () => {
  useEffect(() => {
    // Set online when component mounts
    teamService.updateStatus('online');

    // Heartbeat every 30 seconds
    const interval = setInterval(() => {
      teamService.updatePresence();
    }, 30000);

    // Set offline when component unmounts or window closes
    const handleUnload = () => {
      teamService.updateStatus('offline');
    };

    // Handle browser/tab close
    window.addEventListener('beforeunload', handleUnload);

    // Handle visibility change (tab switch)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        teamService.updateStatus('away');
      } else {
        teamService.updateStatus('online');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      teamService.updateStatus('offline');
    };
  }, []);
};
