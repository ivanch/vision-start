import { memo, useState, useEffect, useRef } from 'react';
import { Server } from '../types';
import ping from './utils/jsping';

interface ServerWidgetProps {
  serverWidget: {
    enabled: boolean;
    pingFrequency: number;
    servers: Server[];
  };
}

const STATUS_COLORS: Record<string, string> = {
  online: 'bg-green-400 text-green-400',
  offline: 'bg-red-400 text-red-400',
};

const getStatusColor = (status: string): string =>
  STATUS_COLORS[status] ?? 'bg-slate-400 text-slate-400';

const ServerWidget: React.FC<ServerWidgetProps> = ({ serverWidget }) => {
  const [serverStatus, setServerStatus] = useState<Record<string, string>>({});
  const serversRef = useRef(serverWidget.servers);
  serversRef.current = serverWidget.servers;

  const serversSignature = JSON.stringify(serverWidget.servers.map(s => [s.id, s.address]));

  useEffect(() => {
    if (!serverWidget.enabled || serversRef.current.length === 0) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    let controller: AbortController | undefined;
    let cancelled = false;
    const frequency = Math.min(60, Math.max(5, serverWidget.pingFrequency || 15)) * 1000;
    setServerStatus(Object.fromEntries(serversRef.current.map(server => [server.id, 'pending'])));

    const pingServers = async () => {
      if (cancelled || document.visibilityState !== 'visible') return;
      const cycle = new AbortController();
      controller = cycle;
      const servers = serversRef.current;
      const statuses: Record<string, string> = {};
      let next = 0;
      await Promise.all(Array.from({ length: Math.min(4, servers.length) }, async () => {
        while (next < servers.length && !cycle.signal.aborted) {
          const server = servers[next++];
          try {
            await ping(server.address, 1, cycle.signal);
            statuses[server.id] = 'online';
          } catch {
            statuses[server.id] = 'offline';
          }
        }
      }));
      if (cancelled || cycle.signal.aborted) return;
      setServerStatus(previous => servers.every(server => previous[server.id] === statuses[server.id])
        ? previous : statuses);
      timer = setTimeout(() => void pingServers(), frequency);
    };
    const onVisibilityChange = () => {
      clearTimeout(timer);
      controller?.abort();
      if (document.visibilityState === 'visible') void pingServers();
    };

    void pingServers();
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      controller?.abort();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [
    serverWidget.enabled,
    serverWidget.pingFrequency,
    serversSignature,
  ]);

  if (!serverWidget.enabled) {
    return null;
  }

  return (
    <div className="fixed bottom-3 left-1/2 z-20 w-auto max-w-[calc(100%-1.5rem)] -translate-x-1/2">
      <div className="liquid-surface flex items-center gap-4 rounded-full px-4 py-2">
        {serverWidget.servers.map((server) => (
          <div key={server.id} className="flex items-center gap-2">
            <div className={`liquid-status-dot w-2.5 h-2.5 rounded-full ${getStatusColor(serverStatus[server.id])}`}></div>
            <span className="text-slate-100 text-sm font-medium">
              {server.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default memo(ServerWidget);
