// 音效管理 Context
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

interface SoundContextType {
  isEnabled: boolean;
  toggleSound: () => void;
  playNewMarketSound: () => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export const useSound = () => {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error('useSound must be used within a SoundProvider');
  }
  return context;
};

export const SoundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isEnabled, setIsEnabled] = useState(() => {
    // 从 localStorage 读取设置
    const saved = localStorage.getItem('soundEnabled');
    return saved !== null ? saved === 'true' : true; // 默认开启
  });
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 初始化音效（更清脆的铃声）
  useEffect(() => {
    // 创建一个更清脆的通知音（使用 Web Audio API 生成）
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;

    const createNotificationSound = () => {
      const audioContext = new AudioContext();
      const duration = 0.15;
      const sampleRate = audioContext.sampleRate;
      const buffer = audioContext.createBuffer(1, duration * sampleRate, sampleRate);
      const channel = buffer.getChannelData(0);

      // 生成清脆的铃声（双音）
      for (let i = 0; i < buffer.length; i++) {
        const t = i / sampleRate;
        // 两个频率叠加：800Hz + 1000Hz
        const tone1 = Math.sin(2 * Math.PI * 800 * t);
        const tone2 = Math.sin(2 * Math.PI * 1000 * t);
        // 添加包络线（快速衰减）
        const envelope = Math.exp(-t * 10);
        channel[i] = (tone1 + tone2) * 0.3 * envelope;
      }

      return buffer;
    };

    const buffer = createNotificationSound();
    
    // 创建播放函数
    const playSound = () => {
      const audioContext = new AudioContext();
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.start();
    };

    // 存储播放函数到 ref
    (audioRef as any).current = { play: playSound };
  }, []);

  // 保存设置到 localStorage
  useEffect(() => {
    localStorage.setItem('soundEnabled', isEnabled.toString());
  }, [isEnabled]);

  const toggleSound = () => {
    setIsEnabled(prev => !prev);
  };

  const playNewMarketSound = () => {
    if (!isEnabled) return;
    
    try {
      (audioRef as any).current?.play();
    } catch (err) {
      console.log('Failed to play sound:', err);
    }
  };

  return (
    <SoundContext.Provider value={{ isEnabled, toggleSound, playNewMarketSound }}>
      {children}
    </SoundContext.Provider>
  );
};

