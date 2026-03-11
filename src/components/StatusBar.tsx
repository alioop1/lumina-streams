import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Clock } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useWatchlist } from '@/hooks/useWatchlist';

export const StatusBar = () => {
  const isOnline = useNetworkStatus();
  const { count } = useWatchlist();
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="fixed top-0 end-0 z-40 flex items-center gap-3 3xl:gap-4 px-4 3xl:px-6 h-10 3xl:h-12 text-xs 3xl:text-sm text-muted-foreground bg-background/60 backdrop-blur-sm rounded-bl-xl">
      {count > 0 && (
        <span className="text-primary font-medium">♥ {count}</span>
      )}
      {isOnline ? (
        <Wifi className="w-3.5 h-3.5 3xl:w-4 3xl:h-4 text-green-400" />
      ) : (
        <WifiOff className="w-3.5 h-3.5 3xl:w-4 3xl:h-4 text-destructive" />
      )}
      <span className="flex items-center gap-1">
        <Clock className="w-3 h-3 3xl:w-3.5 3xl:h-3.5" />
        {timeStr}
      </span>
    </div>
  );
};
