import { useState, useEffect, useCallback } from 'react';
import { useServices } from "@/core/ServiceProvider";

export const useTypingIndicator = (channelId: string | null) => {
  const { collaboration } = useServices();
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

  // Subscribe to typing events
  useEffect(() => {
    if (!channelId) return;

    const channel = collaboration.subscribeToTyping(
      channelId,
      (userName) => {
        setTypingUsers((prev) => [...new Set([...prev, userName])]);
        // Auto-remove helper in hook level too for safety, but mostly rely on stream
        setTimeout(() => {
          setTypingUsers((prev) => prev.filter((name) => name !== userName));
        }, 3000);
      },
      (userName) => {
        setTypingUsers((prev) => prev.filter((name) => name !== userName));
      }
    );

    return () => {
      channel.unsubscribe();
    };
  }, [channelId]);

  // Emit typing event
  const startTyping = useCallback(async () => {
    if (!channelId) return;

    // Clear previous timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    await collaboration.startTyping(channelId);

    // Auto-remove local "stop" call after 3 seconds to clean up DB
    const timeout = setTimeout(async () => {
      await collaboration.stopTyping(channelId);
    }, 3000);

    setTypingTimeout(timeout);
  }, [channelId, typingTimeout]);

  const stopTyping = useCallback(async () => {
    if (!channelId) return;

    if (typingTimeout) {
      clearTimeout(typingTimeout);
      setTypingTimeout(null);
    }

    await collaboration.stopTyping(channelId);
  }, [channelId, typingTimeout]);

  return { typingUsers, startTyping, stopTyping };
};
