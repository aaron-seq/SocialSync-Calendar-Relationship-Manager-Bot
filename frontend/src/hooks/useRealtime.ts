import { useEffect } from 'react';
import { getSupabaseClient, isSupabaseConfigured } from '@/services/supabase.service';
import { logger } from '@/lib/logger';

type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

interface UseRealtimeOptions {
  table: string;
  channelName?: string;
  event?: RealtimeEvent;
  filter?: string;
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
  ontest?: (payload: any) => void; // Catch-all
}

/**
 * Hook to subscribe to Supabase Realtime changes.
 */
export function useRealtime({
  table,
  channelName,
  event = '*',
  filter,
  onInsert,
  onUpdate,
  onDelete,
}: UseRealtimeOptions) {
  useEffect(() => {
    // Without credentials getSupabaseClient() throws, and a throw in an
    // effect unmounts the entire app. Skip realtime instead.
    if (!isSupabaseConfigured()) return;

    const client = getSupabaseClient();
    const channelId = channelName || `public:${table}`;
    
    // Create channel
    const channel = client
      .channel(channelId)
      .on(
        'postgres_changes' as any,
        {
          event,
          schema: 'public',
          table,
          filter,
        },
        (payload: any) => {
          logger.debug(`Realtime event on ${table}:`, payload);
          
          switch (payload.eventType) {
            case 'INSERT':
              onInsert?.(payload.new);
              break;
            case 'UPDATE':
              onUpdate?.(payload.new);
              break;
            case 'DELETE':
              onDelete?.(payload.old);
              break;
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          logger.debug(`Subscribed to realtime channel: ${channelId}`);
        }
      });

    // Cleanup
    return () => {
      logger.debug(`Unsubscribing from channel: ${channelId}`);
      client.removeChannel(channel);
    };
  }, [table, channelName, event, filter, onInsert, onUpdate, onDelete]);
}
