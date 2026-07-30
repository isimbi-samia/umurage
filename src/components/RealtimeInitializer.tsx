import React from 'react';
import { useRealtimeSyncAll } from '@/hooks/usePosts';

const RealtimeInitializer: React.FC = () => {
  useRealtimeSyncAll();
  return null;
};

export default RealtimeInitializer;
