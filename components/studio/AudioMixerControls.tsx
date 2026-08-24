'use client';

import React from 'react';
import { StudioProjectState } from '@/lib/types';
import { Volume2, VolumeX, Sliders, Music, Mic, Radio } from 'lucide-react';

interface AudioMixerControlsProps {
  state: StudioProjectState;
  onUpdateState: (updater: (prev: StudioProjectState) => StudioProjectState) => void;
}

export const AudioMixerControls: React.FC<AudioMixerControlsProps> = ({
  state,
  onUpdateState,
}) => {
  return (
    <div className="space-y-6 pb-12 text-neutral-200">
      {/* Section Header */}
      <div>
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400"></div>
          <h3 className="font-semibold text-sm text-white tracking-wide uppercase">
            Audio Track Mixer
          </h3>
        </div>
        <p className="text-xs text-neutral-400 mt-1">
          Balance and synchronize audio tracks from both the foreground tab and background videos.
        </p>
      </div>

      {/* Master Volume */}
      <div className="space-y-3 bg-neutral-900/60 p-4 rounded-xl border border-neutral-800">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-white uppercase tracking-wider flex items-center space-x-1.5">
            <Radio className="w-4 h-4 text-emerald-400" />
            <span>Master Output Level</span>
          </span>
          <span className="font-mono text-emerald-400 font-bold text-xs">
            {Math.round(state.masterVolume * 100)}%
          </span>
        </div>

        <input
          type="range"
          min="0"
          max="1"
          step="0.02"
          value={state.masterVolume}
          onChange={(e) =>
            onUpdateState((prev) => ({
              ...prev,
              masterVolume: parseFloat(e.target.value),
            }))
          }
          className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
        />
      </div>

      {/* Channel 1: Up Layer (Tab Mockup Video) */}
      <div className="space-y-3 bg-neutral-900/60 p-4 rounded-xl border border-neutral-800">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-indigo-300 block">
              Channel 1: Tab Content Video
            </span>
            <span className="text-[10px] text-neutral-400">Primary voiceover / app audio</span>
          </div>

          <button
            onClick={() =>
              onUpdateState((prev) => ({
                ...prev,
                tabMockup: { ...prev.tabMockup, isMuted: !prev.tabMockup.isMuted },
              }))
            }
            className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center space-x-1 ${
              state.tabMockup.isMuted
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-neutral-800 text-neutral-300'
            }`}
          >
            {state.tabMockup.isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3 text-indigo-400" />}
            <span>{state.tabMockup.isMuted ? 'MUTED' : 'ACTIVE'}</span>
          </button>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-neutral-400 font-mono">
            <span>Gain Level</span>
            <span>{Math.round(state.tabMockup.volume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={state.tabMockup.isMuted ? 0 : state.tabMockup.volume}
            disabled={state.tabMockup.isMuted}
            onChange={(e) =>
              onUpdateState((prev) => ({
                ...prev,
                tabMockup: { ...prev.tabMockup, volume: parseFloat(e.target.value) },
              }))
            }
            className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 disabled:opacity-30"
          />
        </div>
      </div>

      {/* Channel 2: Down Layer (Background Video) */}
      <div className="space-y-3 bg-neutral-900/60 p-4 rounded-xl border border-neutral-800">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-cyan-300 block">
              Channel 2: Background Video
            </span>
            <span className="text-[10px] text-neutral-400">Atmospheric / BGM audio</span>
          </div>

          <button
            onClick={() =>
              onUpdateState((prev) => ({
                ...prev,
                background: { ...prev.background, isMuted: !prev.background.isMuted },
              }))
            }
            className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center space-x-1 ${
              state.background.isMuted
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-neutral-800 text-neutral-300'
            }`}
          >
            {state.background.isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3 text-cyan-400" />}
            <span>{state.background.isMuted ? 'MUTED' : 'ACTIVE'}</span>
          </button>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-neutral-400 font-mono">
            <span>Gain Level</span>
            <span>{Math.round(state.background.volume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={state.background.isMuted ? 0 : state.background.volume}
            disabled={state.background.isMuted}
            onChange={(e) =>
              onUpdateState((prev) => ({
                ...prev,
                background: { ...prev.background, volume: parseFloat(e.target.value) },
              }))
            }
            className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 disabled:opacity-30"
          />
        </div>
      </div>
    </div>
  );
};
