'use client';

import React, { useRef, useState, useEffect } from 'react';
import { StudioProjectState } from '@/lib/types';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  SlidersHorizontal,
  Clock,
  Layers,
  Repeat
} from 'lucide-react';

interface TimelineControlsProps {
  state: StudioProjectState;
  onUpdateState: (updater: (prev: StudioProjectState) => StudioProjectState) => void;
  onTogglePlay: () => void;
}

export const TimelineControls: React.FC<TimelineControlsProps> = ({
  state,
  onUpdateState,
  onTogglePlay,
}) => {
  const scrubberRef = useRef<HTMLDivElement | null>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [showVolumePopup, setShowVolumePopup] = useState(false);

  // Format seconds to mm:ss.s
  const formatTime = (seconds: number) => {
    const s = Math.max(0, seconds);
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    const ms = Math.floor((s % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  const handleScrubberSeek = (clientX: number) => {
    if (!scrubberRef.current || state.duration <= 0) return;
    const rect = scrubberRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const targetTime = ratio * state.duration;

    onUpdateState((prev) => ({
      ...prev,
      currentTime: targetTime,
    }));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsScrubbing(true);
    handleScrubberSeek(e.clientX);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isScrubbing) {
        handleScrubberSeek(e.clientX);
      }
    };
    const handleMouseUp = () => {
      if (isScrubbing) {
        setIsScrubbing(false);
      }
    };

    if (isScrubbing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isScrubbing, state.duration]);

  // Global Spacebar shortcut for Play/Pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.code === 'Space' &&
        !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        onTogglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onTogglePlay]);

  const progressPercent = state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0;

  return (
    <div className="h-20 border-t border-neutral-800 bg-neutral-950/95 backdrop-blur-md px-4 sm:px-6 flex flex-col justify-center z-20 sticky bottom-0">
      {/* 1. Scrubber Track */}
      <div
        ref={scrubberRef}
        onMouseDown={handleMouseDown}
        className="w-full h-4 -mt-2 cursor-pointer flex items-center group relative select-none"
      >
        {/* Background Track Bar */}
        <div className="w-full h-1.5 group-hover:h-2.5 bg-neutral-800 rounded-full overflow-hidden transition-all relative">
          {/* Active Played Fill */}
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-pink-500 rounded-full transition-all duration-75"
            style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
          />
        </div>

        {/* Playhead Handle */}
        <div
          className="absolute w-3.5 h-3.5 bg-white rounded-full shadow-lg shadow-indigo-500/50 -translate-x-1/2 scale-0 group-hover:scale-100 transition-transform pointer-events-none border-2 border-indigo-600"
          style={{ left: `${Math.min(100, Math.max(0, progressPercent))}%` }}
        />
      </div>

      {/* 2. Controls Row */}
      <div className="flex items-center justify-between mt-1">
        {/* Left: Playback Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Jump to Start */}
          <button
            onClick={() =>
              onUpdateState((prev) => ({
                ...prev,
                currentTime: 0,
              }))
            }
            title="Jump to start (00:00)"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* -1s */}
          <button
            onClick={() =>
              onUpdateState((prev) => ({
                ...prev,
                currentTime: Math.max(0, prev.currentTime - 1),
              }))
            }
            title="Back 1 second"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all hidden sm:flex"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {/* Master Play / Pause */}
          <button
            onClick={onTogglePlay}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-md active:scale-95 ${
              state.isPlaying
                ? 'bg-neutral-800 text-white hover:bg-neutral-700 ring-1 ring-white/10'
                : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-600/30'
            }`}
          >
            {state.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>

          {/* +1s */}
          <button
            onClick={() =>
              onUpdateState((prev) => ({
                ...prev,
                currentTime: Math.min(prev.duration, prev.currentTime + 1),
              }))
            }
            title="Forward 1 second"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all hidden sm:flex"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Timecode */}
          <div className="font-mono text-xs text-neutral-300 ml-2">
            <span className="text-white font-semibold">{formatTime(state.currentTime)}</span>
            <span className="text-neutral-500 mx-1">/</span>
            <span className="text-neutral-400">{formatTime(state.duration)}</span>
          </div>
        </div>

        {/* Middle: Duration Presets */}
        <div className="hidden lg:flex items-center space-x-1.5 bg-neutral-900/80 px-2 py-1 rounded-xl border border-neutral-800 text-xs">
          <Clock className="w-3.5 h-3.5 text-neutral-500 mr-1" />
          <span className="text-[11px] text-neutral-400 mr-1">Length:</span>
          {[
            { id: 'sync-content', label: 'Match Tab Video' },
            { id: '15s', label: '15s', seconds: 15 },
            { id: '30s', label: '30s', seconds: 30 },
            { id: '60s', label: '60s', seconds: 60 },
          ].map((item) => {
            const isSelected =
              item.id === 'sync-content'
                ? state.syncMode === 'sync-content'
                : state.syncMode === 'custom-duration' && state.duration === item.seconds;

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'sync-content') {
                    onUpdateState((prev) => ({
                      ...prev,
                      syncMode: 'sync-content',
                    }));
                  } else {
                    onUpdateState((prev) => ({
                      ...prev,
                      syncMode: 'custom-duration',
                      duration: item.seconds || 15,
                    }));
                  }
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Right: Master Audio & Speed */}
        <div className="flex items-center space-x-3">
          {/* Master Volume */}
          <div className="relative">
            <button
              onClick={() => setShowVolumePopup(!showVolumePopup)}
              className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition-all flex items-center space-x-1 text-xs"
            >
              {state.masterVolume === 0 ? (
                <VolumeX className="w-4 h-4 text-neutral-500" />
              ) : (
                <Volume2 className="w-4 h-4 text-indigo-400" />
              )}
              <span className="text-[11px] font-mono hidden sm:inline">
                {Math.round(state.masterVolume * 100)}%
              </span>
            </button>

            {/* Volume Popover */}
            {showVolumePopup && (
              <div className="absolute bottom-12 right-0 w-52 bg-neutral-900 border border-neutral-800 rounded-xl p-3 shadow-2xl z-30 space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-neutral-400">
                    <span>Master Audio</span>
                    <span>{Math.round(state.masterVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={state.masterVolume}
                    onChange={(e) =>
                      onUpdateState((prev) => ({
                        ...prev,
                        masterVolume: parseFloat(e.target.value),
                      }))
                    }
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>

                <div className="space-y-1 pt-1 border-t border-neutral-800 text-[11px]">
                  <div className="flex justify-between text-neutral-400">
                    <span>Tab Content Video</span>
                    <span>{Math.round(state.tabMockup.volume * 100)}%</span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>Background Video</span>
                    <span>{Math.round(state.background.volume * 100)}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
