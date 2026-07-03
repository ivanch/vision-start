import { useState, useEffect, useRef } from 'react';
import { Server } from '../types';
import ping from './utils/jsping.js';

interface ServerWidgetProps {
  config: {
    serverWidget: {
      enabled: boolean;
      pingFrequency: number;
      servers: Server[];
    };
  };
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'online':
      return 'bg-green-400 text-green-400';
    case 'offline':
      return 'bg-red-400 text-red-400';
    default:
      return 'bg-slate-400 text-slate-400';
  }
};

const ServerWidget: React.FC<ServerWidgetProps> = ({ config }) => {
  const [serverStatus, setServerStatus] = useState<Record<string, string>>({});
  const serversRef = useRef(config.serverWidget.servers);
  serversRef.current = config.serverWidget.servers;

  const serversSignature = config.serverWidget.servers
    .map(s => `${s.id}:${s.address}`)
    .join('|');
  const serverCount = config.serverWidget.servers.length;

  useEffect(() => {
    if (!config.serverWidget.enabled) return;

    const pingServers = () => {
      const pending: Record<string, string> = {};
      for (const s of serversRef.current) pending[s.id] = 'pending';
      setServerStatus(prev => ({ ...prev, ...pending }));

      serversRef.current.forEach((server) => {
        ping(server.address)
          .then(() => {
            setServerStatus(prev =>
              prev[server.id] === 'online' ? prev : { ...prev, [server.id]: 'online' }
            );
          })
          .catch(() => {
            setServerStatus(prev =>
              prev[server.id] === 'offline' ? prev : { ...prev, [server.id]: 'offline' }
            );
          });
      });
    };

    pingServers();
    const interval = setInterval(pingServers, config.serverWidget.pingFrequency * 1000);
    return () => clearInterval(interval);
  }, [
    config.serverWidget.enabled,
    config.serverWidget.pingFrequency,
    serversSignature,
    serverCount,
  ]);

  if (!config.serverWidget.enabled) {
    return null;
  }

  return (
    <div className="fixed bottom-3 left-1/2 z-20 w-auto max-w-[calc(100%-1.5rem)] -translate-x-1/2">
      <div className="liquid-surface flex items-center gap-4 rounded-full px-4 py-2">
        {config.serverWidget.servers.map((server) => (
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

export default ServerWidget;
