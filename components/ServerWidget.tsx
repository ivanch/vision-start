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
      return 'bg-green-500';
    case 'offline':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
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
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-auto max-w-full">
      <div className="flex items-center gap-4 bg-black/25 backdrop-blur-md border border-white/20 px-4 py-2 shadow-lg"
        style={{ borderBottomLeftRadius: '0', borderBottomRightRadius: '0', borderTopLeftRadius: '16px', borderTopRightRadius: '15px', borderBottomWidth: '0' }}
      >
        {config.serverWidget.servers.map((server) => (
          <div key={server.id} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${getStatusColor(serverStatus[server.id])}`}></div>
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