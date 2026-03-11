import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { WifiOff } from 'lucide-react';

export const NetworkIndicator = () => {
  const isOnline = useNetworkStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-4 start-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 bg-destructive text-destructive-foreground px-4 py-2 rounded-full text-sm font-medium shadow-lg animate-fade-in">
      <WifiOff className="w-4 h-4" />
      <span>No Internet Connection</span>
    </div>
  );
};
