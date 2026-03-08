import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Box, Plane } from '@react-three/drei';
import * as THREE from 'three';

interface Unit {
  id: string;
  name: string;
  position: [number, number, number];
  health: number;
  maxHealth: number;
  attack: number;
  team: 'player' | 'enemy';
  isMoving: boolean;
  target?: Unit;
}

interface Tower {
  id: string;
  position: [number, number, number];
  health: number;
  maxHealth: number;
  team: 'player' | 'enemy';
  type: 'tower' | 'castle';
}

interface BattlefieldProps {
  playerDeck: any[];
  captainCard?: any;
  onBattleEnd: (winner: string) => void;
}

const MovingUnit: React.FC<{ unit: Unit; onUpdateUnit: (unit: Unit) => void }> = ({ unit, onUpdateUnit }) => {
  const meshRef = useRef<THREE.Mesh>();
  
  useFrame((state, delta) => {
    if (unit.isMoving && meshRef.current) {
      // Simple forward movement for now
      const direction = unit.team === 'player' ? 1 : -1;
      meshRef.current.position.z += direction * delta * 2;
      
      // Update unit position
      onUpdateUnit({
        ...unit,
        position: [meshRef.current.position.x, meshRef.current.position.y, meshRef.current.position.z]
      });
    }
  });

  return (
    <group position={unit.position}>
      <Box ref={meshRef} args={[0.5, 1, 0.5]} >
        <meshStandardMaterial color={unit.team === 'player' ? '#4ade80' : '#ef4444'} />
      </Box>
      <Text
        position={[0, 1.5, 0]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {unit.name}
      </Text>
      {/* Health bar */}
      <group position={[0, 1.2, 0]}>
        <Plane args={[1, 0.1]} position={[0, 0, 0.01]}>
          <meshBasicMaterial color="#333333" />
        </Plane>
        <Plane args={[unit.health / unit.maxHealth, 0.08]} position={[0, 0, 0.02]}>
          <meshBasicMaterial color={unit.health > unit.maxHealth * 0.5 ? '#4ade80' : '#ef4444'} />
        </Plane>
      </group>
    </group>
  );
};

const TowerStructure: React.FC<{ tower: Tower }> = ({ tower }) => {
  const height = tower.type === 'castle' ? 3 : 2;
  const color = tower.team === 'player' ? '#3b82f6' : '#dc2626';
  
  return (
    <group position={tower.position}>
      <Box args={[1.5, height, 1.5]}>
        <meshStandardMaterial color={color} />
      </Box>
      <Text
        position={[0, height + 0.5, 0]}
        fontSize={0.4}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {tower.type.toUpperCase()}
      </Text>
      {/* Health bar */}
      <group position={[0, height + 0.2, 0]}>
        <Plane args={[2, 0.2]} position={[0, 0, 0.01]}>
          <meshBasicMaterial color="#333333" />
        </Plane>
        <Plane args={[2 * (tower.health / tower.maxHealth), 0.18]} position={[0, 0, 0.02]}>
          <meshBasicMaterial color={tower.health > tower.maxHealth * 0.5 ? '#4ade80' : '#ef4444'} />
        </Plane>
      </group>
    </group>
  );
};

const Battlefield: React.FC = () => {
  return (
    <>
      {/* Ground plane */}
      <Plane args={[20, 30]} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#2d5016" />
      </Plane>
      
      {/* Center line */}
      <Plane args={[20, 0.2]} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <meshStandardMaterial color="#ffffff" />
      </Plane>
      
      {/* River/bridge in center */}
      <Plane args={[20, 4]} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <meshStandardMaterial color="#1e40af" />
      </Plane>
    </>
  );
};

export const ClashRoyaleBattlefield: React.FC<BattlefieldProps> = ({ 
  playerDeck, 
  captainCard, 
  onBattleEnd 
}) => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [towers, setTowers] = useState<Tower[]>([
    // Player towers
    { id: 'p-tower-left', position: [-4, 0, -10], health: 1000, maxHealth: 1000, team: 'player', type: 'tower' },
    { id: 'p-tower-right', position: [4, 0, -10], health: 1000, maxHealth: 1000, team: 'player', type: 'tower' },
    { id: 'p-castle', position: [0, 0, -13], health: 2000, maxHealth: 2000, team: 'player', type: 'castle' },
    
    // Enemy towers
    { id: 'e-tower-left', position: [-4, 0, 10], health: 1000, maxHealth: 1000, team: 'enemy', type: 'tower' },
    { id: 'e-tower-right', position: [4, 0, 10], health: 1000, maxHealth: 1000, team: 'enemy', type: 'tower' },
    { id: 'e-castle', position: [0, 0, 13], health: 2000, maxHealth: 2000, team: 'enemy', type: 'castle' },
  ]);
  const [mana, setMana] = useState(10);
  const [maxMana] = useState(10);
  const [gameTime, setGameTime] = useState(300); // 5 minutes in seconds

  // Game timer
  useEffect(() => {
    const timer = setInterval(() => {
      setGameTime((prev) => {
        if (prev <= 0) {
          onBattleEnd('draw');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onBattleEnd]);

  // Mana regeneration
  useEffect(() => {
    const manaTimer = setInterval(() => {
      setMana((prev) => Math.min(prev + 1, maxMana));
    }, 2000);

    return () => clearInterval(manaTimer);
  }, [maxMana]);

  // Deploy captain card at start
  useEffect(() => {
    if (captainCard && units.length === 0) {
      const captain: Unit = {
        id: 'captain',
        name: captainCard.name || 'Captain',
        position: [0, 0, -8],
        health: captainCard.health || 200,
        maxHealth: captainCard.health || 200,
        attack: captainCard.attack || 100,
        team: 'player',
        isMoving: true
      };
      setUnits([captain]);
    }
  }, [captainCard]);

  const deployCard = (card: any, position: [number, number, number]) => {
    if (mana < card.cost) return;

    const newUnit: Unit = {
      id: `${card.id}-${Date.now()}`,
      name: card.name,
      position: position,
      health: card.health,
      maxHealth: card.health,
      attack: card.attack,
      team: 'player',
      isMoving: true
    };

    setUnits(prev => [...prev, newUnit]);
    setMana(prev => prev - card.cost);
  };

  const handleGroundClick = (event: any) => {
    const point = event.point;
    // Only allow deployment on player side (z < 0)
    if (point.z < 0 && playerDeck.length > 0) {
      deployCard(playerDeck[0], [point.x, 0, point.z]);
    }
  };

  const updateUnit = (updatedUnit: Unit) => {
    setUnits(prev => prev.map(unit => 
      unit.id === updatedUnit.id ? updatedUnit : unit
    ));
  };

  return (
    <div className="h-full relative bg-gradient-to-b from-sky-400 to-green-400">
      {/* Game UI Overlay */}
      <div className="absolute top-4 left-4 right-4 z-10 text-white">
        <div className="flex justify-between items-center">
          <div className="bg-black/70 px-4 py-2 rounded-lg">
            <div className="text-lg font-bold">⏱️ {Math.floor(gameTime / 60)}:{(gameTime % 60).toString().padStart(2, '0')}</div>
          </div>
          <div className="bg-black/70 px-4 py-2 rounded-lg">
            <div className="text-lg font-bold">💎 {mana}/{maxMana}</div>
          </div>
        </div>
      </div>

      {/* Card Hand at Bottom */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
        <div className="flex gap-2 bg-black/70 p-2 rounded-lg">
          {playerDeck.slice(0, 4).map((card, index) => (
            <button
              key={index}
              onClick={() => {
                // Show card info or prepare for deployment
                console.log('Selected card:', card.name);
              }}
              disabled={mana < card.cost}
              className={`w-16 h-20 bg-purple-600 rounded border-2 flex flex-col items-center justify-center text-xs text-white font-bold ${
                mana < card.cost ? 'opacity-50 cursor-not-allowed' : 'hover:bg-purple-700 cursor-pointer'
              }`}
            >
              <div className="truncate w-full text-center">{card.name}</div>
              <div className="text-yellow-300">💎{card.cost}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 3D Battlefield */}
      <Canvas
        camera={{ position: [0, 15, -5], fov: 60 }}
        onPointerMissed={handleGroundClick}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        
        <OrbitControls 
          enablePan={false}
          minDistance={10}
          maxDistance={25}
          maxPolarAngle={Math.PI / 2.2}
        />
        
        <Battlefield />
        
        {/* Render towers */}
        {towers.map(tower => (
          <TowerStructure key={tower.id} tower={tower} />
        ))}
        
        {/* Render units */}
        {units.map(unit => (
          <MovingUnit 
            key={unit.id} 
            unit={unit} 
            onUpdateUnit={updateUnit}
          />
        ))}
      </Canvas>
    </div>
  );
};

export default ClashRoyaleBattlefield;