import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import ToggleSwitch from '../ToggleSwitch';
import { Config, Server } from '../../types';
import RangeSlider from './RangeSlider';
import { TrashIcon } from '../icons';

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
          <RangeSlider
            label="Ping Frequency"
            value={config.serverWidget.pingFrequency}
            min={5}
            max={60}
            valueSuffix="s"
            onChange={(value) => updateServerWidget({ pingFrequency: value })}
          />
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
                              <TrashIcon size={16} />
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