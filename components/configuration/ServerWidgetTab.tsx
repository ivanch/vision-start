import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import ToggleSwitch from '../ToggleSwitch';
import { Config, Server } from '../../types';

interface ServerWidgetTabProps {
  config: Config;
  onChange: (updates: Partial<Config>) => void;
}

const ServerWidgetTab: React.FC<ServerWidgetTabProps> = ({ config, onChange }) => {
  const [newServerName, setNewServerName] = useState('');
  const [newServerAddress, setNewServerAddress] = useState('');

  const updateServerWidget = (updates: Partial<Config['serverWidget']>) => {
    onChange({ serverWidget: { ...config.serverWidget, ...updates } });
  };

  const handleAddServer = () => {
    if (newServerName.trim() === '' || newServerAddress.trim() === '') return;
    const newServer: Server = {
      id: Date.now().toString(),
      name: newServerName,
      address: newServerAddress,
    };
    updateServerWidget({ servers: [...config.serverWidget.servers, newServer] });
    setNewServerName('');
    setNewServerAddress('');
  };

  const handleRemoveServer = (id: string) => {
    updateServerWidget({
      servers: config.serverWidget.servers.filter((s) => s.id !== id),
    });
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;
    const items = Array.from(config.serverWidget.servers);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    updateServerWidget({ servers: items });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <label className="text-slate-300 text-sm font-semibold">Enable Server Widget</label>
        <ToggleSwitch
          checked={config.serverWidget.enabled}
          onChange={(checked) => updateServerWidget({ enabled: checked })}
        />
      </div>
      {config.serverWidget.enabled && (
        <>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <label className="text-slate-300 text-sm font-semibold">Ping Frequency</label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="5"
                max="60"
                value={config.serverWidget.pingFrequency}
                onChange={(e) => updateServerWidget({ pingFrequency: Number(e.target.value) })}
                className="liquid-range"
              />
              <span className="w-12 text-right text-sm text-slate-200">{config.serverWidget.pingFrequency}s</span>
            </div>
          </div>
          <div>
            <h3 className="text-slate-300 text-sm font-semibold mb-2">Servers</h3>
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="servers">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="flex flex-col gap-2"
                  >
                    {config.serverWidget.servers.map((server: Server, index: number) => (
                      <Draggable key={server.id} draggableId={server.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="liquid-surface flex items-center justify-between rounded-xl p-3"
                          >
                            <div>
                              <p className="font-semibold">{server.name}</p>
                              <p className="text-sm text-slate-400">{server.address}</p>
                            </div>
                            <button
                              onClick={() => handleRemoveServer(server.id)}
                              className="liquid-edit-action liquid-focus text-red-300 hover:text-red-100"
                              aria-label={`Remove ${server.name}`}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                fill="currentColor"
                                className="bi bi-trash"
                                viewBox="0 0 16 16"
                              >
                                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
                                <path
                                  fillRule="evenodd"
                                  d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"
                                />
                              </svg>
                            </button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
            <div className="flex flex-col gap-2 mt-3 sm:flex-row">
              <input
                type="text"
                placeholder="Server Name"
                value={newServerName}
                onChange={(e) => setNewServerName(e.target.value)}
                className="liquid-input p-2.5"
              />
              <input
                type="text"
                placeholder="HTTP Address"
                value={newServerAddress}
                onChange={(e) => setNewServerAddress(e.target.value)}
                className="liquid-input p-2.5"
              />
              <button
                onClick={handleAddServer}
                className="liquid-button liquid-button-primary liquid-focus py-2.5 px-4"
              >
                Add
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ServerWidgetTab;
