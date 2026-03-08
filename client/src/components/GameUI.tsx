import { useGameState } from "../lib/stores/useGameState";
import { useAudio } from "../lib/stores/useAudio";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Volume2, VolumeX, RotateCcw, Play } from "lucide-react";
import { useRef, useEffect } from "react";

export default function GameUI() {
  const {
    gamePhase,
    score,
    totalThrows,
    power,
    aimDirection,
    startGame,
    resetGame,
    throwNugget,
    setPower,
    setAimDirection
  } = useGameState();
  
  const { isMuted, toggleMute } = useAudio();

  const handlePointerDown = (event: React.PointerEvent) => {
    if (gamePhase !== "playing") return;
    
    event.preventDefault();
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    
    // Simple horizontal aiming - nuggets always go towards toilet with left/right adjustment
    // Toilet is at X=0, Z=-15 from player at X=0, Z=20
    const toiletDirection: [number, number, number] = [x * 0.3, 0, 1]; // Always aim towards toilet (positive Z)
    
    setAimDirection(toiletDirection);
    setPower(0);
    startCharging();
  };

  const handlePointerMove = (event: React.PointerEvent) => {
    if (gamePhase !== "playing") return;
    
    event.preventDefault();
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    
    // Update horizontal aiming while keeping direction towards toilet
    const toiletDirection: [number, number, number] = [x * 0.3, 0, 1];
    setAimDirection(toiletDirection);
  };

  const handlePointerUp = (event: React.PointerEvent) => {
    if (gamePhase !== "playing") return;
    
    event.preventDefault();
    stopCharging();
    throwNugget();
  };

  // Power charging system
  const startCharging = () => {
    const chargeInterval = setInterval(() => {
      const currentState = useGameState.getState();
      const newPower = currentState.power + 0.5;
      if (newPower >= 20) {
        clearInterval(chargeInterval);
        setPower(20);
      } else {
        setPower(newPower);
      }
    }, 50);
    
    // Store interval ID to clear it later
    (window as any).chargeInterval = chargeInterval;
  };

  const stopCharging = () => {
    if ((window as any).chargeInterval) {
      clearInterval((window as any).chargeInterval);
      (window as any).chargeInterval = null;
    }
  };

  const accuracy = totalThrows > 0 ? Math.round((score / totalThrows) * 100) : 0;

  return (
    <>
      {/* Game Controls Overlay */}
      <div
        className="absolute inset-0 cursor-crosshair"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ touchAction: 'none' }}
      />
      
      {/* Score UI */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
        <Card className="bg-black/80 text-white p-4 pointer-events-auto">
          <div className="text-2xl font-bold">Score: {score}</div>
          <div className="text-sm">Throws: {totalThrows}</div>
          <div className="text-sm">Accuracy: {accuracy}%</div>
        </Card>
        
        <div className="flex gap-2 pointer-events-auto">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleMute}
            className="bg-black/80 text-white border-white/20 hover:bg-white/20"
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={resetGame}
            className="bg-black/80 text-white border-white/20 hover:bg-white/20"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Power Meter */}
      {gamePhase === "playing" && (
        <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
          <Card className="bg-black/80 text-white p-4">
            <div className="text-sm mb-2">Power: {Math.round(power)}/20</div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${(power / 20) * 100}%` }}
              />
            </div>
            <div className="text-xs mt-2 text-center text-gray-300">
              Drag to aim and set power, release to throw!
            </div>
          </Card>
        </div>
      )}

      {/* Game Start/End Screens */}
      {gamePhase === "ready" && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center pointer-events-auto">
          <Card className="bg-white p-8 text-center max-w-sm mx-4">
            <h1 className="text-3xl font-bold mb-4">Nugget Toss</h1>
            <p className="text-gray-600 mb-6">
              Toss weed nuggets into the toilet for points!
            </p>
            <Button onClick={startGame} size="lg" className="w-full">
              <Play className="h-4 w-4 mr-2" />
              Start Game
            </Button>
          </Card>
        </div>
      )}
      
      {gamePhase === "ended" && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center pointer-events-auto">
          <Card className="bg-white p-8 text-center max-w-sm mx-4">
            <h2 className="text-2xl font-bold mb-4">Game Over!</h2>
            <div className="text-lg mb-2">Final Score: {score}</div>
            <div className="text-sm text-gray-600 mb-6">
              Total Throws: {totalThrows} | Accuracy: {accuracy}%
            </div>
            <div className="flex gap-2">
              <Button onClick={resetGame} variant="outline" className="flex-1">
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button onClick={startGame} className="flex-1">
                <Play className="h-4 w-4 mr-2" />
                Play Again
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
