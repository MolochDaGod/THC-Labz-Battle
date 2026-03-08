import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PSG1Settings } from './PSG1Emulator';

interface GameSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GameSettings: React.FC<GameSettingsProps> = ({ isOpen, onClose }) => {
  const [psg1Enabled, setPsg1Enabled] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [visualEffects, setVisualEffects] = useState(true);
  const [battleSpeed, setBattleSpeed] = useState(1);
  const [elixirSpeed, setElixirSpeed] = useState(1);

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('thc-clash-settings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        setPsg1Enabled(settings.psg1Enabled || false);
        setAudioEnabled(settings.audioEnabled !== false);
        setVisualEffects(settings.visualEffects !== false);
        setBattleSpeed(settings.battleSpeed || 1);
        setElixirSpeed(settings.elixirSpeed || 1);
      } catch (e) {
        console.error('Error loading settings:', e);
      }
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = (newSettings: any) => {
    const settings = {
      psg1Enabled,
      audioEnabled,
      visualEffects,
      battleSpeed,
      elixirSpeed,
      ...newSettings
    };
    localStorage.setItem('thc-clash-settings', JSON.stringify(settings));
  };

  const handlePsg1Toggle = (enabled: boolean) => {
    setPsg1Enabled(enabled);
    saveSettings({ psg1Enabled: enabled });
    
    // Trigger PSG1 emulator state change
    window.dispatchEvent(new CustomEvent('psg1-toggle', { detail: { enabled } }));
    console.log('🎮 PSG1 Console mode:', enabled ? 'ENABLED' : 'DISABLED');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-2xl p-6 max-w-md w-full mx-4 border border-gray-700 shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center">
              ⚙️ Game Settings
            </h2>
            <motion.button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-700"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              ✕
            </motion.button>
          </div>

          {/* Settings Content */}
          <div className="space-y-6">
            {/* PSG1 Console Emulator */}
            <PSG1Settings 
              isEnabled={psg1Enabled}
              onToggle={handlePsg1Toggle}
            />

            {/* Audio Settings */}
            <div className="bg-gray-800/90 rounded-lg p-4 border border-gray-700">
              <h3 className="text-white font-bold mb-3 flex items-center">
                🔊 Audio & Sound
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">
                    Enable Audio
                  </span>
                  <motion.button
                    onClick={() => {
                      setAudioEnabled(!audioEnabled);
                      saveSettings({ audioEnabled: !audioEnabled });
                    }}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      audioEnabled ? 'bg-green-500' : 'bg-gray-600'
                    }`}
                    whileTap={{ scale: 0.95 }}
                  >
                    <motion.div
                      className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md"
                      animate={{
                        x: audioEnabled ? 20 : 0
                      }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Visual Settings */}
            <div className="bg-gray-800/90 rounded-lg p-4 border border-gray-700">
              <h3 className="text-white font-bold mb-3 flex items-center">
                ✨ Visual Effects
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">
                    Particle Effects
                  </span>
                  <motion.button
                    onClick={() => {
                      setVisualEffects(!visualEffects);
                      saveSettings({ visualEffects: !visualEffects });
                    }}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      visualEffects ? 'bg-green-500' : 'bg-gray-600'
                    }`}
                    whileTap={{ scale: 0.95 }}
                  >
                    <motion.div
                      className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md"
                      animate={{
                        x: visualEffects ? 20 : 0
                      }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Gameplay Settings */}
            <div className="bg-gray-800/90 rounded-lg p-4 border border-gray-700">
              <h3 className="text-white font-bold mb-3 flex items-center">
                🎮 Gameplay
              </h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-300 text-sm">Battle Speed</span>
                    <span className="text-green-400 text-sm">{battleSpeed}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={battleSpeed}
                    onChange={(e) => {
                      const speed = parseFloat(e.target.value);
                      setBattleSpeed(speed);
                      saveSettings({ battleSpeed: speed });
                    }}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-300 text-sm">Elixir Speed</span>
                    <span className="text-purple-400 text-sm">{elixirSpeed}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={elixirSpeed}
                    onChange={(e) => {
                      const speed = parseFloat(e.target.value);
                      setElixirSpeed(speed);
                      saveSettings({ elixirSpeed: speed });
                    }}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
              </div>
            </div>

            {/* Reset Button */}
            <motion.button
              onClick={() => {
                const defaultSettings = {
                  psg1Enabled: false,
                  audioEnabled: true,
                  visualEffects: true,
                  battleSpeed: 1,
                  elixirSpeed: 1
                };
                localStorage.setItem('thc-clash-settings', JSON.stringify(defaultSettings));
                setPsg1Enabled(false);
                setAudioEnabled(true);
                setVisualEffects(true);
                setBattleSpeed(1);
                setElixirSpeed(1);
                window.dispatchEvent(new CustomEvent('psg1-toggle', { detail: { enabled: false } }));
              }}
              className="w-full bg-red-600/80 hover:bg-red-600 text-white py-3 rounded-lg font-bold transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              🔄 Reset to Defaults
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GameSettings;