import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Save, RotateCcw, Grid, Move, Target, Castle } from 'lucide-react';

interface GameZone {
  id: string;
  type: 'player_deploy' | 'ai_deploy' | 'bridge' | 'water' | 'tower' | 'castle';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  name: string;
}

interface AdminGameBoardProps {
  onBack: () => void;
  onSave: (zones: GameZone[]) => void;
  onSyncToGame?: (zones: GameZone[]) => void; // New prop to sync with real game
}

const AdminGameBoard: React.FC<AdminGameBoardProps> = ({ onBack, onSave, onSyncToGame }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [battlefieldImage, setBattlefieldImage] = useState<HTMLImageElement | null>(null);
  const [zones, setZones] = useState<GameZone[]>([]);
  const [selectedZone, setSelectedZone] = useState<GameZone | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState<GameZone['type']>('player_deploy');
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

  // Grid dimensions matching the game
  const GRID_WIDTH = 18;
  const GRID_HEIGHT = 28;
  const BASE_CELL_SIZE = 20;
  const CANVAS_WIDTH = GRID_WIDTH * BASE_CELL_SIZE;
  const CANVAS_HEIGHT = GRID_HEIGHT * BASE_CELL_SIZE;

  const zoneTypes = [
    { type: 'player_deploy' as const, name: 'Player Deploy', color: 'rgba(0, 255, 0, 0.3)', icon: Target },
    { type: 'ai_deploy' as const, name: 'AI Deploy', color: 'rgba(255, 0, 0, 0.3)', icon: Target },
    { type: 'bridge' as const, name: 'Bridge', color: 'rgba(139, 69, 19, 0.6)', icon: Grid },
    { type: 'water' as const, name: 'Water', color: 'rgba(0, 100, 255, 0.4)', icon: Grid },
    { type: 'tower' as const, name: 'Tower', color: 'rgba(255, 255, 0, 0.6)', icon: Castle },
    { type: 'castle' as const, name: 'Castle', color: 'rgba(255, 165, 0, 0.6)', icon: Castle }
  ];

  // Load battlefield image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setBattlefieldImage(img);
    img.src = 'blob:https://imgur.com/3f0f26bd-5c03-4425-9093-7510ee01cbd9';
  }, []);

  // Initialize with current zones from the game
  useEffect(() => {
    const initialZones: GameZone[] = [
      // Player deployment zone
      { id: 'player_deploy_1', type: 'player_deploy', x: 2, y: 18, width: 14, height: 10, color: 'rgba(0, 255, 0, 0.3)', name: 'Player Deploy Zone' },
      // AI deployment zone  
      { id: 'ai_deploy_1', type: 'ai_deploy', x: 2, y: 0, width: 14, height: 10, color: 'rgba(255, 0, 0, 0.3)', name: 'AI Deploy Zone' },
      // Water area
      { id: 'water_1', type: 'water', x: 0, y: 13, width: 18, height: 3, color: 'rgba(0, 100, 255, 0.4)', name: 'Water River' },
      // Left bridge
      { id: 'bridge_1', type: 'bridge', x: 5, y: 13, width: 3, height: 3, color: 'rgba(139, 69, 19, 0.6)', name: 'Left Bridge' },
      // Right bridge
      { id: 'bridge_2', type: 'bridge', x: 11, y: 13, width: 3, height: 3, color: 'rgba(139, 69, 19, 0.6)', name: 'Right Bridge' },
      // Towers and castles
      { id: 'player_left_tower', type: 'tower', x: 3, y: 25, width: 1, height: 1, color: 'rgba(255, 255, 0, 0.6)', name: 'Player Left Tower' },
      { id: 'player_right_tower', type: 'tower', x: 15, y: 25, width: 1, height: 1, color: 'rgba(255, 255, 0, 0.6)', name: 'Player Right Tower' },
      { id: 'player_castle', type: 'castle', x: 9, y: 27, width: 1, height: 1, color: 'rgba(255, 165, 0, 0.6)', name: 'Player Castle' },
      { id: 'ai_left_tower', type: 'tower', x: 3, y: 4, width: 1, height: 1, color: 'rgba(255, 255, 0, 0.6)', name: 'AI Left Tower' },
      { id: 'ai_right_tower', type: 'tower', x: 15, y: 4, width: 1, height: 1, color: 'rgba(255, 255, 0, 0.6)', name: 'AI Right Tower' },
      { id: 'ai_castle', type: 'castle', x: 9, y: 2, width: 1, height: 1, color: 'rgba(255, 165, 0, 0.6)', name: 'AI Castle' }
    ];
    setZones(initialZones);
  }, []);

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw battlefield background
      if (battlefieldImage) {
        ctx.drawImage(battlefieldImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      } else {
        ctx.fillStyle = '#228B22';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Draw grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x <= CANVAS_WIDTH; x += BASE_CELL_SIZE) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CANVAS_HEIGHT);
        ctx.stroke();
      }
      for (let y = 0; y <= CANVAS_HEIGHT; y += BASE_CELL_SIZE) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_WIDTH, y);
        ctx.stroke();
      }

      // Draw zones
      zones.forEach(zone => {
        const x = zone.x * BASE_CELL_SIZE;
        const y = zone.y * BASE_CELL_SIZE;
        const width = zone.width * BASE_CELL_SIZE;
        const height = zone.height * BASE_CELL_SIZE;

        // Fill zone
        ctx.fillStyle = zone.color;
        ctx.fillRect(x, y, width, height);

        // Draw border
        ctx.strokeStyle = selectedZone?.id === zone.id ? '#FFFFFF' : zone.color.replace('0.3', '0.8').replace('0.4', '0.8').replace('0.6', '1.0');
        ctx.lineWidth = selectedZone?.id === zone.id ? 3 : 2;
        ctx.strokeRect(x, y, width, height);

        // Draw zone label
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 10px Arial';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.textAlign = 'center';
        ctx.strokeText(zone.name, x + width/2, y + height/2);
        ctx.fillText(zone.name, x + width/2, y + height/2);
      });
    };

    render();
  }, [zones, selectedZone, battlefieldImage]);

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / BASE_CELL_SIZE);
    const y = Math.floor((e.clientY - rect.top) / BASE_CELL_SIZE);

    // Check if clicking on existing zone
    const clickedZone = zones.find(zone => 
      x >= zone.x && x < zone.x + zone.width &&
      y >= zone.y && y < zone.y + zone.height
    );

    if (clickedZone) {
      setSelectedZone(clickedZone);
    } else {
      // Start drawing new zone
      setIsDrawing(true);
      setDragStart({ x, y });
      setSelectedZone(null);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !dragStart) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / BASE_CELL_SIZE);
    const y = Math.floor((e.clientY - rect.top) / BASE_CELL_SIZE);

    // Show preview zone while dragging
    const width = Math.abs(x - dragStart.x) + 1;
    const height = Math.abs(y - dragStart.y) + 1;
    const startX = Math.min(x, dragStart.x);
    const startY = Math.min(y, dragStart.y);

    // This would require a preview state for real-time drawing
  };

  const handleCanvasMouseUp = (e: React.MouseEvent) => {
    if (!isDrawing || !dragStart) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / BASE_CELL_SIZE);
    const y = Math.floor((e.clientY - rect.top) / BASE_CELL_SIZE);

    const width = Math.abs(x - dragStart.x) + 1;
    const height = Math.abs(y - dragStart.y) + 1;
    const startX = Math.min(x, dragStart.x);
    const startY = Math.min(y, dragStart.y);

    // Create new zone
    const newZone: GameZone = {
      id: `${currentTool}_${Date.now()}`,
      type: currentTool,
      x: startX,
      y: startY,
      width,
      height,
      color: zoneTypes.find(t => t.type === currentTool)?.color || 'rgba(255, 255, 255, 0.3)',
      name: `${zoneTypes.find(t => t.type === currentTool)?.name || 'Zone'} ${zones.filter(z => z.type === currentTool).length + 1}`
    };

    setZones(prev => [...prev, newZone]);
    setIsDrawing(false);
    setDragStart(null);
  };

  const deleteSelectedZone = () => {
    if (selectedZone) {
      setZones(prev => prev.filter(z => z.id !== selectedZone.id));
      setSelectedZone(null);
    }
  };

  const updateSelectedZone = (updates: Partial<GameZone>) => {
    if (selectedZone) {
      setZones(prev => prev.map(z => 
        z.id === selectedZone.id ? { ...z, ...updates } : z
      ));
      setSelectedZone(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const resetToDefaults = () => {
    // Reset to current game zones
    setZones([
      { id: 'player_deploy_1', type: 'player_deploy', x: 2, y: 18, width: 14, height: 10, color: 'rgba(0, 255, 0, 0.3)', name: 'Player Deploy Zone' },
      { id: 'ai_deploy_1', type: 'ai_deploy', x: 2, y: 0, width: 14, height: 10, color: 'rgba(255, 0, 0, 0.3)', name: 'AI Deploy Zone' },
      { id: 'water_1', type: 'water', x: 0, y: 13, width: 18, height: 3, color: 'rgba(0, 100, 255, 0.4)', name: 'Water River' },
      { id: 'bridge_1', type: 'bridge', x: 5, y: 13, width: 3, height: 3, color: 'rgba(139, 69, 19, 0.6)', name: 'Left Bridge' },
      { id: 'bridge_2', type: 'bridge', x: 11, y: 13, width: 3, height: 3, color: 'rgba(139, 69, 19, 0.6)', name: 'Right Bridge' },
      { id: 'player_left_tower', type: 'tower', x: 3, y: 25, width: 1, height: 1, color: 'rgba(255, 255, 0, 0.6)', name: 'Player Left Tower' },
      { id: 'player_right_tower', type: 'tower', x: 15, y: 25, width: 1, height: 1, color: 'rgba(255, 255, 0, 0.6)', name: 'Player Right Tower' },
      { id: 'player_castle', type: 'castle', x: 9, y: 27, width: 1, height: 1, color: 'rgba(255, 165, 0, 0.6)', name: 'Player Castle' },
      { id: 'ai_left_tower', type: 'tower', x: 3, y: 4, width: 1, height: 1, color: 'rgba(255, 255, 0, 0.6)', name: 'AI Left Tower' },
      { id: 'ai_right_tower', type: 'tower', x: 15, y: 4, width: 1, height: 1, color: 'rgba(255, 255, 0, 0.6)', name: 'AI Right Tower' },
      { id: 'ai_castle', type: 'castle', x: 9, y: 2, width: 1, height: 1, color: 'rgba(255, 165, 0, 0.6)', name: 'AI Castle' }
    ]);
    setSelectedZone(null);
  };

  return (
    <div className="w-full max-w-6xl mx-auto bg-black text-white p-4">
      <div className="flex items-center justify-between mb-4">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
        >
          <ArrowLeft size={16} />
          Back to Game
        </button>
        
        <h1 className="text-2xl font-bold">Admin Game Board Editor</h1>
        
        <div className="flex gap-2">
          <button 
            onClick={resetToDefaults}
            className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded"
          >
            <RotateCcw size={16} />
            Reset
          </button>
          <button 
            onClick={() => {
              onSave(zones);
              onSyncToGame?.(zones);
              console.log('🎮 Admin game layout saved and synced to real game');
            }}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
          >
            <Save size={16} />
            Save & Sync to Game
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Canvas Area */}
        <div className="lg:col-span-3">
          <div className="bg-gray-900 p-4 rounded">
            <div className="relative">
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className="border border-gray-600 cursor-crosshair bg-green-800 max-w-full h-auto"
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                style={{
                  aspectRatio: `${CANVAS_WIDTH}/${CANVAS_HEIGHT}`,
                  imageRendering: 'pixelated'
                }}
              />
            </div>
          </div>
        </div>

        {/* Controls Panel */}
        <div className="space-y-4">
          {/* Tool Selection */}
          <div className="bg-gray-900 p-4 rounded">
            <h3 className="font-bold mb-3">Drawing Tools</h3>
            <div className="space-y-2">
              {zoneTypes.map(zoneType => (
                <button
                  key={zoneType.type}
                  onClick={() => setCurrentTool(zoneType.type)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded text-left transition-colors ${
                    currentTool === zoneType.type 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  <zoneType.icon size={16} />
                  {zoneType.name}
                </button>
              ))}
            </div>
          </div>

          {/* Selected Zone Properties */}
          {selectedZone && (
            <div className="bg-gray-900 p-4 rounded">
              <h3 className="font-bold mb-3">Zone Properties</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    value={selectedZone.name}
                    onChange={(e) => updateSelectedZone({ name: e.target.value })}
                    className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-sm"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">X</label>
                    <input
                      type="number"
                      value={selectedZone.x}
                      onChange={(e) => updateSelectedZone({ x: parseInt(e.target.value) || 0 })}
                      className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Y</label>
                    <input
                      type="number"
                      value={selectedZone.y}
                      onChange={(e) => updateSelectedZone({ y: parseInt(e.target.value) || 0 })}
                      className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-sm"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">Width</label>
                    <input
                      type="number"
                      value={selectedZone.width}
                      onChange={(e) => updateSelectedZone({ width: parseInt(e.target.value) || 1 })}
                      className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Height</label>
                    <input
                      type="number"
                      value={selectedZone.height}
                      onChange={(e) => updateSelectedZone({ height: parseInt(e.target.value) || 1 })}
                      className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-sm"
                    />
                  </div>
                </div>

                <button
                  onClick={deleteSelectedZone}
                  className="w-full bg-red-600 hover:bg-red-700 px-3 py-2 rounded text-sm"
                >
                  Delete Zone
                </button>
              </div>
            </div>
          )}

          {/* Zone List */}
          <div className="bg-gray-900 p-4 rounded">
            <h3 className="font-bold mb-3">All Zones ({zones.length})</h3>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {zones.map(zone => (
                <button
                  key={zone.id}
                  onClick={() => setSelectedZone(zone)}
                  className={`w-full text-left px-2 py-1 rounded text-sm transition-colors ${
                    selectedZone?.id === zone.id 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  {zone.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminGameBoard;