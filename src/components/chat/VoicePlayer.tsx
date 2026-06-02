'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';

interface VoicePlayerProps {
  src: string;
  durationSeconds?: number | null;
}

export const VoicePlayer: React.FC<VoicePlayerProps> = ({ src, durationSeconds }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationSeconds || 0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (durationSeconds) {
      setDuration(durationSeconds);
    }
  }, [durationSeconds]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startPlaybackTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrentTime(prev => {
        const nextTime = prev + 0.1;
        if (nextTime >= duration) {
          if (timerRef.current) clearInterval(timerRef.current);
          setIsPlaying(false);
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.loop = false;
            audioRef.current.currentTime = 0;
          }
          return duration;
        }
        return nextTime;
      });
    }, 100);
  };

  const stopPlaybackTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      stopPlaybackTimer();
      setIsPlaying(false);
    } else {
      let startingPos = currentTime;
      if (currentTime >= duration) {
        startingPos = 0;
        setCurrentTime(0);
      }
      
      // If durationSeconds is set, loop the short physical asset to simulate long note
      if (durationSeconds) {
        audioRef.current.loop = true;
        const dur = audioRef.current.duration && audioRef.current.duration > 0 ? audioRef.current.duration : 1.0;
        audioRef.current.currentTime = startingPos % dur;
      }
      
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        if (durationSeconds) {
          startPlaybackTimer();
        }
      }).catch(err => {
        console.error('Playback failed:', err);
      });
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    // Only track native time if we are not running a virtual duration note
    if (!durationSeconds) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    if (!durationSeconds && audioRef.current.duration) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    if (!durationSeconds) {
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !progressRef.current || duration === 0) return;
    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = Math.max(0, Math.min(1, clickX / width));
    const seekTime = percentage * duration;
    
    if (durationSeconds) {
      setCurrentTime(seekTime);
      if (audioRef.current) {
        const dur = audioRef.current.duration && audioRef.current.duration > 0 ? audioRef.current.duration : 1.0;
        audioRef.current.currentTime = seekTime % dur;
      }
    } else {
      audioRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const percentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-3 py-2 px-3.5 bg-black/35 border border-white/5 rounded-2xl w-[240px] shadow-lg select-none backdrop-blur-md">
      {/* Audio Engine */}
      <audio
        ref={audioRef}
        src={src}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="metadata"
      />

      {/* Play/Pause Trigger */}
      <button
        type="button"
        onClick={togglePlay}
        className="w-8 h-8 rounded-full bg-white text-indigo-950 flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all shrink-0 cursor-pointer"
      >
        {isPlaying ? (
          <Pause className="w-3.5 h-3.5 fill-indigo-950 stroke-indigo-950" />
        ) : (
          <Play className="w-3.5 h-3.5 fill-indigo-950 stroke-indigo-950 translate-x-[1px]" />
        )}
      </button>

      {/* Progress & Timeline */}
      <div className="flex-1 flex flex-col gap-1.5 justify-center py-1">
        {/* Timeline Slider */}
        <div
          ref={progressRef}
          onClick={handleSeek}
          className="h-1.5 w-full bg-white/10 hover:bg-white/15 rounded-full relative cursor-pointer group"
        >
          {/* Active filled progress */}
          <div
            className="h-full bg-indigo-400 rounded-full relative transition-all duration-75"
            style={{ width: `${percentage}%` }}
          >
            {/* Grabber handle */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white border border-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Time Progress */}
        <div className="flex items-center justify-between text-[9px] text-[#a1a1aa] font-mono tabular-nums">
          <span>{formatTime(currentTime)}</span>
          <div className="flex items-center gap-1">
            <Volume2 className="w-2.5 h-2.5 opacity-40 shrink-0" />
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
