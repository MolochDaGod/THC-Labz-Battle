import { create } from "zustand";

// Music track definitions based on game state
export enum MusicTrack {
  CALM = 'calm',
  TRADING = 'trading', 
  HIGH_HEAT = 'high_heat',
  POLICE_CHASE = 'police_chase',
  SUCCESS = 'success',
  DANGER = 'danger',
  NIGHT = 'night',
  DAY = 'day'
}

interface AudioState {
  backgroundMusic: HTMLAudioElement | null;
  hitSound: HTMLAudioElement | null;
  successSound: HTMLAudioElement | null;
  isMuted: boolean;
  currentTrack: MusicTrack;
  musicTracks: Record<MusicTrack, HTMLAudioElement | null>;
  isLoading: boolean;
  fadeOutId: number | null;
  
  // Setter functions
  setBackgroundMusic: (music: HTMLAudioElement) => void;
  setHitSound: (sound: HTMLAudioElement) => void;
  setSuccessSound: (sound: HTMLAudioElement) => void;
  setMusicTrack: (track: MusicTrack, audio: HTMLAudioElement) => void;
  
  // Dynamic music control functions
  switchToTrack: (track: MusicTrack, fadeDuration?: number) => void;
  updateMusicBasedOnGameState: (gameState: any) => void;
  initializeMusicTracks: () => Promise<void>;
  
  // Control functions
  toggleMute: () => void;
  playHit: () => void;
  playSuccess: () => void;
}

export const useAudio = create<AudioState>((set, get) => ({
  backgroundMusic: null,
  hitSound: null,
  successSound: null,
  isMuted: true, // Start muted by default
  currentTrack: MusicTrack.CALM,
  musicTracks: {
    [MusicTrack.CALM]: null,
    [MusicTrack.TRADING]: null,
    [MusicTrack.HIGH_HEAT]: null,
    [MusicTrack.POLICE_CHASE]: null,
    [MusicTrack.SUCCESS]: null,
    [MusicTrack.DANGER]: null,
    [MusicTrack.NIGHT]: null,
    [MusicTrack.DAY]: null,
  },
  isLoading: false,
  fadeOutId: null,
  
  setBackgroundMusic: (music) => set({ backgroundMusic: music }),
  setHitSound: (sound) => set({ hitSound: sound }),
  setSuccessSound: (sound) => set({ successSound: sound }),
  setMusicTrack: (track, audio) => set(state => ({
    musicTracks: { ...state.musicTracks, [track]: audio }
  })),
  
  // Initialize all music tracks
  initializeMusicTracks: async () => {
    set({ isLoading: true });
    console.log('🎵 Initializing dynamic music tracks...');
    
    const trackSources = {
      [MusicTrack.CALM]: '/sounds/background.mp3', // Use existing as calm
      [MusicTrack.TRADING]: '/sounds/background.mp3', // Will create variants
      [MusicTrack.HIGH_HEAT]: '/sounds/background.mp3', 
      [MusicTrack.POLICE_CHASE]: '/sounds/background.mp3',
      [MusicTrack.SUCCESS]: '/sounds/success.mp3',
      [MusicTrack.DANGER]: '/sounds/background.mp3',
      [MusicTrack.NIGHT]: '/sounds/background.mp3',
      [MusicTrack.DAY]: '/sounds/background.mp3',
    };
    
    try {
      const { musicTracks } = get();
      const newTracks = { ...musicTracks };
      
      // Load each track
      for (const [track, src] of Object.entries(trackSources)) {
        const audio = new Audio(src);
        audio.loop = track !== MusicTrack.SUCCESS; // Success is one-shot
        audio.volume = 0.15; // Lower volume for background music
        audio.preload = 'auto';
        
        // Set different playback rates for variety
        switch (track) {
          case MusicTrack.HIGH_HEAT:
            audio.playbackRate = 1.1; // Slightly faster
            audio.volume = 0.2;
            break;
          case MusicTrack.POLICE_CHASE:
            audio.playbackRate = 1.2; // Much faster, intense
            audio.volume = 0.25;
            break;
          case MusicTrack.NIGHT:
            audio.playbackRate = 0.9; // Slower, more atmospheric
            audio.volume = 0.12;
            break;
          case MusicTrack.TRADING:
            audio.playbackRate = 1.05; // Slightly upbeat
            audio.volume = 0.18;
            break;
          case MusicTrack.SUCCESS:
            audio.volume = 0.3; // Louder for celebration
            break;
        }
        
        newTracks[track as MusicTrack] = audio;
      }
      
      set({ musicTracks: newTracks, isLoading: false });
      console.log('🎵 All music tracks loaded successfully');
    } catch (error) {
      console.error('Failed to load music tracks:', error);
      set({ isLoading: false });
    }
  },
  
  // Switch to a specific track with smooth fade transition
  switchToTrack: (track: MusicTrack, fadeDuration = 1000) => {
    const { currentTrack, musicTracks, isMuted, fadeOutId } = get();
    
    if (currentTrack === track || isMuted) return;
    
    console.log(`🎵 Switching music: ${currentTrack} → ${track}`);
    
    const currentAudio = musicTracks[currentTrack];
    const newAudio = musicTracks[track];
    
    if (!newAudio) {
      console.warn(`Music track ${track} not loaded`);
      return;
    }
    
    // Clear any existing fade
    if (fadeOutId) {
      clearInterval(fadeOutId);
    }
    
    // Fade out current track
    if (currentAudio && !currentAudio.paused) {
      const startVolume = currentAudio.volume;
      const fadeSteps = 20;
      const stepDuration = fadeDuration / fadeSteps;
      const volumeStep = startVolume / fadeSteps;
      let currentStep = 0;
      
      const fadeInterval = setInterval(() => {
        currentStep++;
        currentAudio.volume = Math.max(0, startVolume - (volumeStep * currentStep));
        
        if (currentStep >= fadeSteps) {
          currentAudio.pause();
          currentAudio.currentTime = 0;
          clearInterval(fadeInterval);
        }
      }, stepDuration);
      
      set({ fadeOutId: fadeInterval });
    }
    
    // Start new track
    try {
      newAudio.currentTime = 0;
      newAudio.volume = 0;
      newAudio.play().then(() => {
        // Fade in new track
        const targetVolume = track === MusicTrack.SUCCESS ? 0.3 : 
                           track === MusicTrack.POLICE_CHASE ? 0.25 :
                           track === MusicTrack.HIGH_HEAT ? 0.2 :
                           track === MusicTrack.TRADING ? 0.18 :
                           track === MusicTrack.NIGHT ? 0.12 : 0.15;
        
        const fadeSteps = 20;
        const stepDuration = fadeDuration / fadeSteps;
        const volumeStep = targetVolume / fadeSteps;
        let currentStep = 0;
        
        const fadeInInterval = setInterval(() => {
          currentStep++;
          newAudio.volume = Math.min(targetVolume, volumeStep * currentStep);
          
          if (currentStep >= fadeSteps) {
            clearInterval(fadeInInterval);
          }
        }, stepDuration);
      }).catch(error => {
        console.log('Music play prevented:', error);
      });
    } catch (error) {
      console.error('Failed to switch track:', error);
    }
    
    set({ currentTrack: track });
  },
  
  // Update music based on current game state
  updateMusicBasedOnGameState: (gameState: any) => {
    const { switchToTrack } = get();
    
    if (!gameState) return;
    
    const { heat, money, currentCity, health, day } = gameState;
    const currentHour = new Date().getHours();
    const isNight = currentHour >= 20 || currentHour < 6;
    
    // Determine appropriate track based on game state
    let newTrack = MusicTrack.CALM;
    
    // Police chase scenario (highest priority)
    if (heat >= 4) {
      newTrack = MusicTrack.POLICE_CHASE;
    }
    // High heat scenario
    else if (heat >= 2) {
      newTrack = MusicTrack.HIGH_HEAT;
    }
    // Trading scenario (has money and in a city)
    else if (money > 1000 && currentCity) {
      newTrack = isNight ? MusicTrack.NIGHT : MusicTrack.TRADING;
    }
    // Night time atmosphere
    else if (isNight) {
      newTrack = MusicTrack.NIGHT;
    }
    // Low health danger
    else if (health < 50) {
      newTrack = MusicTrack.DANGER;
    }
    // Default calm
    else {
      newTrack = isNight ? MusicTrack.NIGHT : MusicTrack.CALM;
    }
    
    switchToTrack(newTrack, 2000); // 2 second fade
  },
  
  toggleMute: () => {
    const { isMuted, musicTracks, currentTrack } = get();
    const newMutedState = !isMuted;
    
    // Mute/unmute all audio
    Object.values(musicTracks).forEach(audio => {
      if (audio) {
        audio.muted = newMutedState;
      }
    });
    
    // If unmuting, resume current track
    if (!newMutedState) {
      const currentAudio = musicTracks[currentTrack];
      if (currentAudio && currentAudio.paused) {
        currentAudio.play().catch(error => {
          console.log('Music resume prevented:', error);
        });
      }
    }
    
    set({ isMuted: newMutedState });
    console.log(`🎵 Sound ${newMutedState ? 'muted' : 'unmuted'}`);
  },
  
  playHit: () => {
    const { hitSound, isMuted } = get();
    if (hitSound && !isMuted) {
      const soundClone = hitSound.cloneNode() as HTMLAudioElement;
      soundClone.volume = 0.3;
      soundClone.play().catch(error => {
        console.log("Hit sound play prevented:", error);
      });
    }
  },
  
  playSuccess: () => {
    const { successSound, isMuted, switchToTrack } = get();
    if (successSound && !isMuted) {
      // Play success sound effect
      successSound.currentTime = 0;
      successSound.play().catch(error => {
        console.log("Success sound play prevented:", error);
      });
      
      // Briefly switch to success music for big wins
      switchToTrack(MusicTrack.SUCCESS, 500);
      
      // Return to normal music after 3 seconds
      setTimeout(() => {
        const state = get();
        if (state.currentTrack === MusicTrack.SUCCESS) {
          state.updateMusicBasedOnGameState(null); // Will recalculate appropriate track
        }
      }, 3000);
    }
  }
}));
