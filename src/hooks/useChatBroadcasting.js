import { useEffect, useRef } from 'react';
import broadcastingService from '../services/broadcasting';

export const useChatBroadcasting = (conversationId, eventHandlers) => {
  const channelRef = useRef(null);

  useEffect(() => {
    if (!conversationId) return;

    // Subscribe to conversation channel
    const channel = broadcastingService.subscribeToPrivateChannel(
      `conversation.${conversationId}`,
      null, // We'll handle multiple events manually
      null
    );

    // Listen to all events
    if (channel && eventHandlers) {
      Object.entries(eventHandlers).forEach(([eventName, handler]) => {
        channel.listen(eventName, handler);
      });
    }

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        broadcastingService.unsubscribeFromChannel(`conversation.${conversationId}`);
        channelRef.current = null;
      }
    };
  }, [conversationId, eventHandlers]);

  return { channel: channelRef.current };
};
