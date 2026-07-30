import { supabase } from '@/lib/supabase';

type Callback = (payload: any) => void;

export function subscribeToTable(table: string, callback: Callback) {
  // Subscribe to all INSERT/UPDATE/DELETE events for the table
  const channel = supabase.channel(`realtime-${table}`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
      try { callback(payload); } catch (e) { console.error('realtime callback error', e); }
    })
    .subscribe();

  return () => {
    try {
      // unsubscribe
      // channel.unsubscribe() returns a Promise in supabase-js
      (channel as any).unsubscribe();
    } catch (e) {
      console.warn('Failed to unsubscribe realtime channel', e);
    }
  };
}
