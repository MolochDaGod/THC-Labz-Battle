import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Volume2, VolumeX, Zap, Music, Gamepad2, Eye, EyeOff, RotateCcw, Trash2 } from 'lucide-react';

interface SettingsPageProps {
  onBack: () => void;
}

interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  musicVolume: number;
  sfxVolume: number;
  brightness: number;
  performanceMode: 'low' | 'medium' | 'high';
  showAnimations: boolean;
  particleEffects: boolean;
  autoSave: boolean;
  notifications: boolean;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onBack }) => {
  const [settings, setSettings] = useState<GameSettings>({
    soundEnabled: true,
    musicEnabled: true,
    musicVolume: 60,
    sfxVolume: 75,
    brightness: 100,
    performanceMode: 'high',
    showAnimations: true,
    particleEffects: true,
    autoSave: true,
    notifications: true,
  });

  const [hasChanges, setHasChanges] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const savedSettings = localStorage.getItem('gameSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
      } catch (error) {
        console.error('Failed to parse saved settings:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (audioRef.current && settings.musicEnabled) {
      audioRef.current.volume = settings.musicVolume / 100;
      audioRef.current.play().catch(() => {});
    } else if (audioRef.current) {
      audioRef.current.pause();
    }
  }, [settings.musicEnabled, settings.musicVolume]);

  const saveSettings = () => {
    localStorage.setItem('gameSettings', JSON.stringify(settings));
    setHasChanges(false);
    
    if (typeof window !== 'undefined') {
      document.body.style.filter = `brightness(${settings.brightness}%)`;
      if (!settings.showAnimations) {
        document.body.classList.add('reduced-motion');
      } else {
        document.body.classList.remove('reduced-motion');
      }
    }
  };

  const updateSetting = (key: keyof GameSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const resetToDefaults = () => {
    const defaultSettings: GameSettings = {
      soundEnabled: true,
      musicEnabled: true,
      musicVolume: 60,
      sfxVolume: 75,
      brightness: 100,
      performanceMode: 'high',
      showAnimations: true,
      particleEffects: true,
      autoSave: true,
      notifications: true,
    };
    setSettings(defaultSettings);
    setHasChanges(true);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(30,10,40,0.85) 50%, rgba(0,0,0,0.9) 100%)',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Animated background elements */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '5%',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(57,255,20,0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(40px)',
        pointerEvents: 'none',
        animation: 'pulse 4s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '5%',
        width: '250px',
        height: '250px',
        background: 'radial-gradient(circle, rgba(251,191,36,0.1) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(40px)',
        pointerEvents: 'none',
        animation: 'pulse 5s ease-in-out infinite 0.5s',
      }} />

      {/* Content */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
          <div>
            <h1 style={{
              fontSize: '48px',
              fontWeight: '900',
              color: '#39ff14',
              margin: '0 0 8px 0',
              fontFamily: "'LEMON MILK', sans-serif",
              letterSpacing: '2px',
              textShadow: '0 0 20px rgba(57,255,20,0.5)',
            }}>SETTINGS</h1>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>Customize your THC CLASH experience</p>
          </div>
          <button
            onClick={onBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              background: 'rgba(57,255,20,0.1)',
              border: '1px solid rgba(57,255,20,0.3)',
              borderRadius: '10px',
              color: '#39ff14',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(57,255,20,0.2)';
              e.currentTarget.style.borderColor = 'rgba(57,255,20,0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(57,255,20,0.1)';
              e.currentTarget.style.borderColor = 'rgba(57,255,20,0.3)';
            }}
          >
            <ChevronLeft size={18} />
            Back
          </button>
        </div>

        {/* Settings Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
          marginBottom: '40px',
        }}>
          {/* Audio Settings */}
          <div style={{
            background: 'rgba(0,0,0,0.5)',
            border: '1px solid rgba(57,255,20,0.2)',
            borderRadius: '16px',
            padding: '24px',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <Volume2 size={24} style={{ color: '#39ff14' }} />
              <h2 style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#fff',
                margin: 0,
                fontFamily: "'LEMON MILK', sans-serif",
              }}>AUDIO</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Music Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ color: '#fff', margin: '0 0 4px 0', fontSize: '14px', fontWeight: '600' }}>Music</p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0, fontSize: '12px' }}>Background music</p>
                </div>
                <button
                  onClick={() => updateSetting('musicEnabled', !settings.musicEnabled)}
                  style={{
                    padding: '8px 12px',
                    background: settings.musicEnabled ? 'rgba(57,255,20,0.3)' : 'rgba(100,100,100,0.2)',
                    border: `1px solid ${settings.musicEnabled ? 'rgba(57,255,20,0.5)' : 'rgba(100,100,100,0.3)'}`,
                    borderRadius: '8px',
                    color: settings.musicEnabled ? '#39ff14' : '#999',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    transition: 'all 0.3s',
                  }}
                >
                  {settings.musicEnabled ? <Music size={16} /> : <VolumeX size={16} />}
                </button>
              </div>

              {/* Music Volume */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ color: '#fff', fontSize: '14px', fontWeight: '600', margin: 0 }}>Music Volume</label>
                  <span style={{ color: '#39ff14', fontSize: '14px', fontWeight: '700' }}>{settings.musicVolume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.musicVolume}
                  onChange={(e) => updateSetting('musicVolume', parseInt(e.target.value))}
                  disabled={!settings.musicEnabled}
                  style={{
                    width: '100%',
                    height: '6px',
                    borderRadius: '3px',
                    background: 'rgba(100,100,100,0.3)',
                    outline: 'none',
                    cursor: settings.musicEnabled ? 'pointer' : 'not-allowed',
                    opacity: settings.musicEnabled ? 1 : 0.5,
                  }}
                />
              </div>

              {/* SFX Volume */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ color: '#fff', fontSize: '14px', fontWeight: '600', margin: 0 }}>Sound Effects</label>
                  <span style={{ color: '#39ff14', fontSize: '14px', fontWeight: '700' }}>{settings.sfxVolume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.sfxVolume}
                  onChange={(e) => updateSetting('sfxVolume', parseInt(e.target.value))}
                  style={{
                    width: '100%',
                    height: '6px',
                    borderRadius: '3px',
                    background: 'rgba(100,100,100,0.3)',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Display Settings */}
          <div style={{
            background: 'rgba(0,0,0,0.5)',
            border: '1px solid rgba(57,255,20,0.2)',
            borderRadius: '16px',
            padding: '24px',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <Eye size={24} style={{ color: '#39ff14' }} />
              <h2 style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#fff',
                margin: 0,
                fontFamily: "'LEMON MILK', sans-serif",
              }}>DISPLAY</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Brightness */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ color: '#fff', fontSize: '14px', fontWeight: '600', margin: 0 }}>Brightness</label>
                  <span style={{ color: '#39ff14', fontSize: '14px', fontWeight: '700' }}>{settings.brightness}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={settings.brightness}
                  onChange={(e) => updateSetting('brightness', parseInt(e.target.value))}
                  style={{
                    width: '100%',
                    height: '6px',
                    borderRadius: '3px',
                    background: 'rgba(100,100,100,0.3)',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                />
              </div>

              {/* Animations */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ color: '#fff', margin: '0 0 4px 0', fontSize: '14px', fontWeight: '600' }}>Animations</p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0, fontSize: '12px' }}>Visual effects</p>
                </div>
                <button
                  onClick={() => updateSetting('showAnimations', !settings.showAnimations)}
                  style={{
                    padding: '8px 12px',
                    background: settings.showAnimations ? 'rgba(57,255,20,0.3)' : 'rgba(100,100,100,0.2)',
                    border: `1px solid ${settings.showAnimations ? 'rgba(57,255,20,0.5)' : 'rgba(100,100,100,0.3)'}`,
                    borderRadius: '8px',
                    color: settings.showAnimations ? '#39ff14' : '#999',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600',
                    transition: 'all 0.3s',
                  }}
                >
                  {settings.showAnimations ? 'ON' : 'OFF'}
                </button>
              </div>

              {/* Particle Effects */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ color: '#fff', margin: '0 0 4px 0', fontSize: '14px', fontWeight: '600' }}>Particles</p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0, fontSize: '12px' }}>Battle effects</p>
                </div>
                <button
                  onClick={() => updateSetting('particleEffects', !settings.particleEffects)}
                  style={{
                    padding: '8px 12px',
                    background: settings.particleEffects ? 'rgba(57,255,20,0.3)' : 'rgba(100,100,100,0.2)',
                    border: `1px solid ${settings.particleEffects ? 'rgba(57,255,20,0.5)' : 'rgba(100,100,100,0.3)'}`,
                    borderRadius: '8px',
                    color: settings.particleEffects ? '#39ff14' : '#999',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600',
                    transition: 'all 0.3s',
                  }}
                >
                  {settings.particleEffects ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
          </div>

          {/* Performance Settings */}
          <div style={{
            background: 'rgba(0,0,0,0.5)',
            border: '1px solid rgba(57,255,20,0.2)',
            borderRadius: '16px',
            padding: '24px',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <Zap size={24} style={{ color: '#39ff14' }} />
              <h2 style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#fff',
                margin: 0,
                fontFamily: "'LEMON MILK', sans-serif",
              }}>PERFORMANCE</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { value: 'low', label: 'Low', desc: 'Max battery life' },
                { value: 'medium', label: 'Medium', desc: 'Balanced' },
                { value: 'high', label: 'High', desc: 'Best graphics' },
              ].map(({ value, label, desc }) => (
                <button
                  key={value}
                  onClick={() => updateSetting('performanceMode', value as any)}
                  style={{
                    padding: '12px',
                    background: settings.performanceMode === value ? 'rgba(57,255,20,0.2)' : 'rgba(100,100,100,0.1)',
                    border: `1px solid ${settings.performanceMode === value ? 'rgba(57,255,20,0.5)' : 'rgba(100,100,100,0.3)'}`,
                    borderRadius: '8px',
                    color: settings.performanceMode === value ? '#39ff14' : '#aaa',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.3s',
                  }}
                >
                  <p style={{ margin: '0 0 2px 0', fontSize: '13px', fontWeight: '700' }}>{label}</p>
                  <p style={{ margin: 0, fontSize: '11px', color: settings.performanceMode === value ? 'rgba(57,255,20,0.7)' : 'rgba(255,255,255,0.4)' }}>{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Game Settings */}
          <div style={{
            background: 'rgba(0,0,0,0.5)',
            border: '1px solid rgba(57,255,20,0.2)',
            borderRadius: '16px',
            padding: '24px',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <Gamepad2 size={24} style={{ color: '#39ff14' }} />
              <h2 style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#fff',
                margin: 0,
                fontFamily: "'LEMON MILK', sans-serif",
              }}>GAMEPLAY</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ color: '#fff', margin: '0 0 4px 0', fontSize: '14px', fontWeight: '600' }}>Auto-Save</p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0, fontSize: '12px' }}>Save progress</p>
                </div>
                <button
                  onClick={() => updateSetting('autoSave', !settings.autoSave)}
                  style={{
                    padding: '8px 12px',
                    background: settings.autoSave ? 'rgba(57,255,20,0.3)' : 'rgba(100,100,100,0.2)',
                    border: `1px solid ${settings.autoSave ? 'rgba(57,255,20,0.5)' : 'rgba(100,100,100,0.3)'}`,
                    borderRadius: '8px',
                    color: settings.autoSave ? '#39ff14' : '#999',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600',
                    transition: 'all 0.3s',
                  }}
                >
                  {settings.autoSave ? 'ON' : 'OFF'}
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ color: '#fff', margin: '0 0 4px 0', fontSize: '14px', fontWeight: '600' }}>Notifications</p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0, fontSize: '12px' }}>Battle alerts</p>
                </div>
                <button
                  onClick={() => updateSetting('notifications', !settings.notifications)}
                  style={{
                    padding: '8px 12px',
                    background: settings.notifications ? 'rgba(57,255,20,0.3)' : 'rgba(100,100,100,0.2)',
                    border: `1px solid ${settings.notifications ? 'rgba(57,255,20,0.5)' : 'rgba(100,100,100,0.3)'}`,
                    borderRadius: '8px',
                    color: settings.notifications ? '#39ff14' : '#999',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600',
                    transition: 'all 0.3s',
                  }}
                >
                  {settings.notifications ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
          </div>

          {/* Data Settings */}
          <div style={{
            background: 'rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,100,100,0.2)',
            borderRadius: '16px',
            padding: '24px',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <Trash2 size={24} style={{ color: '#ff6464' }} />
              <h2 style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#fff',
                margin: 0,
                fontFamily: "'LEMON MILK', sans-serif",
              }}>DATA</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={resetToDefaults}
                style={{
                  padding: '12px',
                  background: 'rgba(251,191,36,0.15)',
                  border: '1px solid rgba(251,191,36,0.4)',
                  borderRadius: '8px',
                  color: '#fbbf24',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '700',
                  transition: 'all 0.3s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <RotateCcw size={16} />
                Reset to Defaults
              </button>

              <button
                onClick={() => {
                  if (confirm('Clear all game data? This cannot be undone.')) {
                    localStorage.clear();
                    window.location.reload();
                  }
                }}
                style={{
                  padding: '12px',
                  background: 'rgba(255,100,100,0.15)',
                  border: '1px solid rgba(255,100,100,0.4)',
                  borderRadius: '8px',
                  color: '#ff6464',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '700',
                  transition: 'all 0.3s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <Trash2 size={16} />
                Clear All Data
              </button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        {hasChanges && (
          <div style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: 'linear-gradient(135deg, rgba(57,255,20,0.9) 0%, rgba(57,255,20,0.8) 100%)',
            border: '2px solid rgba(57,255,20,0.6)',
            borderRadius: '12px',
            padding: '16px 24px',
            boxShadow: '0 8px 32px rgba(57,255,20,0.3)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            zIndex: 100,
          }}>
            <span style={{ color: '#000', fontWeight: '700', fontSize: '14px' }}>Unsaved changes</span>
            <button
              onClick={saveSettings}
              style={{
                padding: '8px 16px',
                background: 'rgba(0,0,0,0.2)',
                border: 'none',
                borderRadius: '8px',
                color: '#000',
                cursor: 'pointer',
                fontWeight: '700',
                fontSize: '13px',
                transition: 'all 0.2s',
              }}
            >
              SAVE
            </button>
          </div>
        )}
      </div>

      {/* Hidden audio element for background music */}
      <audio
        ref={audioRef}
        src="/audio/menu-music.mp3"
        loop
        style={{ display: 'none' }}
      />

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }

        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #39ff14;
          cursor: pointer;
          box-shadow: 0 0 8px rgba(57, 255, 20, 0.6);
        }

        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #39ff14;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 8px rgba(57, 255, 20, 0.6);
        }

        input[type="range"]::-webkit-slider-runnable-track {
          background: rgba(57, 255, 20, 0.2);
          height: 6px;
          border-radius: 3px;
        }

        input[type="range"]::-moz-range-track {
          background: rgba(57, 255, 20, 0.2);
          height: 6px;
          border-radius: 3px;
          border: none;
        }

        .reduced-motion * {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      `}</style>
    </div>
  );
};

export default SettingsPage;
