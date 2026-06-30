import { useCallback, useRef } from 'react';
import { NotificationCategory, NotificationPriority } from './useNotifications';

export type SoundType = 'success' | 'error' | 'warning' | 'info' | 'critical' | 'reminder';

// Sound file paths (you would need to add actual sound files to your public/sounds directory)
const soundFiles: Record<SoundType, string> = {
  success: '/sounds/success.mp3',
  error: '/sounds/error.mp3',
  warning: '/sounds/warning.mp3',
  info: '/sounds/info.mp3',
  critical: '/sounds/critical.mp3',
  reminder: '/sounds/reminder.mp3',
};

// Category-specific sound mappings
const categorySoundMappings: Record<NotificationCategory, SoundType> = {
  transaction: 'success',
  budget: 'warning',
  account: 'info',
  goal: 'success',
  system: 'info',
  reminder: 'reminder',
  alert: 'critical',
};

// Priority-based sound overrides
const prioritySoundOverrides: Record<NotificationPriority, SoundType | null> = {
  low: null, // Use category default
  medium: null, // Use category default
  high: 'warning',
  critical: 'critical',
};

export function useNotificationSounds() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioCacheRef = useRef<Map<string, AudioBuffer>>(new Map());

  // Initialize audio context
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current && typeof window !== 'undefined') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Load and cache audio file
  const loadAudioFile = useCallback(async (url: string): Promise<AudioBuffer | null> => {
    const audioContext = initAudioContext();
    if (!audioContext) return null;

    // Check cache first
    if (audioCacheRef.current.has(url)) {
      return audioCacheRef.current.get(url)!;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) return null;

      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Cache the audio buffer
      audioCacheRef.current.set(url, audioBuffer);
      return audioBuffer;
    } catch (error) {
      console.error('Failed to load audio file:', url, error);
      return null;
    }
  }, [initAudioContext]);

  // Play sound effect
  const playSound = useCallback(async (
    category: NotificationCategory,
    priority: NotificationPriority,
    volume: number = 0.7
  ) => {
    const audioContext = initAudioContext();
    if (!audioContext) return;

    // Determine sound type based on priority override or category
    let soundType: SoundType;
    
    if (prioritySoundOverrides[priority]) {
      soundType = prioritySoundOverrides[priority]!;
    } else {
      soundType = categorySoundMappings[category];
    }

    const soundUrl = soundFiles[soundType];
    if (!soundUrl) return;

    try {
      // Load audio file
      const audioBuffer = await loadAudioFile(soundUrl);
      if (!audioBuffer) return;

      // Create audio source
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;

      // Create gain node for volume control
      const gainNode = audioContext.createGain();
      gainNode.gain.value = Math.max(0, Math.min(1, volume));

      // Connect nodes
      source.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Play sound
      source.start(0);

      // Clean up after playback
      source.onended = () => {
        source.disconnect();
        gainNode.disconnect();
      };
    } catch (error) {
      console.error('Failed to play notification sound:', error);
    }
  }, [initAudioContext, loadAudioFile]);

  // Generate a simple beep sound (fallback when no audio files are available)
  const playBeep = useCallback((frequency: number = 800, duration: number = 200, volume: number = 0.3) => {
    const audioContext = initAudioContext();
    if (!audioContext) return;

    try {
      // Create oscillator
      const oscillator = audioContext.createOscillator();
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      // Create gain node
      const gainNode = audioContext.createGain();
      gainNode.gain.value = Math.max(0, Math.min(1, volume));

      // Create envelope
      const now = audioContext.currentTime;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(volume, now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration / 1000);

      // Connect and play
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.start(now);
      oscillator.stop(now + duration / 1000);

      // Clean up
      oscillator.onended = () => {
        oscillator.disconnect();
        gainNode.disconnect();
      };
    } catch (error) {
      console.error('Failed to play beep sound:', error);
    }
  }, [initAudioContext]);

  // Play different beep sounds based on notification type
  const playBeepByType = useCallback((
    category: NotificationCategory,
    priority: NotificationPriority,
    volume: number = 0.3
  ) => {
    let frequency = 800; // Default frequency
    let duration = 200;   // Default duration

    // Adjust based on priority
    switch (priority) {
      case 'critical':
        frequency = 1200;
        duration = 300;
        break;
      case 'high':
        frequency = 1000;
        duration = 250;
        break;
      case 'medium':
        frequency = 800;
        duration = 200;
        break;
      case 'low':
        frequency = 600;
        duration = 150;
        break;
    }

    // Adjust based on category
    switch (category) {
      case 'alert':
        frequency += 200;
        duration += 100;
        break;
      case 'reminder':
        frequency = 900;
        duration = 400; // Longer for reminders
        break;
      case 'transaction':
        frequency = 1000;
        break;
      case 'budget':
        frequency = 400;
        duration = 300;
        break;
    }

    playBeep(frequency, duration, volume);
  }, [playBeep]);

  // Test sound
  const testSound = useCallback((soundType: SoundType, volume: number = 0.7) => {
    const audioContext = initAudioContext();
    if (!audioContext) return;

    const soundUrl = soundFiles[soundType];
    if (soundUrl) {
      loadAudioFile(soundUrl).then(audioBuffer => {
        if (audioBuffer) {
          const source = audioContext.createBufferSource();
          source.buffer = audioBuffer;

          const gainNode = audioContext.createGain();
          gainNode.gain.value = volume;

          source.connect(gainNode);
          gainNode.connect(audioContext.destination);
          source.start(0);
        }
      });
    } else {
      // Fallback to beep
      const frequency = {
        success: 1000,
        error: 400,
        warning: 800,
        info: 600,
        critical: 1200,
        reminder: 900,
      }[soundType] || 800;

      playBeep(frequency, 200, volume);
    }
  }, [initAudioContext, loadAudioFile, playBeep]);

  return {
    playSound,
    playBeepByType,
    testSound,
    isSupported: typeof window !== 'undefined' && !!(window.AudioContext || (window as any).webkitAudioContext),
  };
}
