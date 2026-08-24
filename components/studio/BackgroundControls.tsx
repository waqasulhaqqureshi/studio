'use client';

import React, { useRef } from 'react';
import { StudioProjectState, VideoFit } from '@/lib/types';
import { BACKGROUND_PRESET_ANIMATIONS } from '@/lib/presets';
import { 
  Upload, 
  Film, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Repeat, 
  Sun, 
  Sliders, 
  Layers,
  Maximize2,
  Trash2,
  Play
} from 'lucide-react';

interface BackgroundControlsProps {
  state: StudioProjectState;
  onUpdateState: (updater: (prev: StudioProjectState) => StudioProjectState) => void;
}

export const BackgroundControls: React.FC<BackgroundControlsProps> = ({
  state,
  onUpdateState,
}) => {
  const bg = state.background;
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    onUpdateState((prev) => ({
      ...prev,
      background: {
        ...prev.background,
        videoUrl: url,
        fileName: file.name,
        sourceType: 'upload',
      },
    }));
  };

  const handleUsePresetAnimation = (presetId: string) => {
    onUpdateState((prev) => ({
      ...prev,
      background: {
        ...prev.background,
        presetId,
        sourceType: 'preset',
        // keep videoUrl if needed or set to procedural
      },
    }));
  };

  const handleUseRecording = () => {
    onUpdateState((prev) => ({
      ...prev,
      background: {
        ...prev.background,
        videoUrl: '/recording.mp4',
        fileName: 'Recording 2026-08-24 094643.mp4',
        sourceType: 'recording',
      },
    }));
  };

  return (
    <div className="space-y-6 pb-12 text-neutral-200">
      {/* Section Header */}
      <div>
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400"></div>
          <h3 className="font-semibold text-sm text-white tracking-wide uppercase">
            Down Layer — Background Video
          </h3>
        </div>
        <p className="text-xs text-neutral-400 mt-1">
          Fills the entire 3:4 canvas behind the transparent foreground tab.
        </p>
      </div>

      {/* 1. Video Source Picker */}
      <div className="space-y-3 bg-neutral-900/60 p-3.5 rounded-xl border border-neutral-800">
        <label className="text-xs font-medium text-neutral-300 flex items-center justify-between">
          <span>Background Video Source</span>
          {bg.fileName && (
            <span className="text-[10px] text-cyan-400 truncate max-w-[140px]">
              {bg.fileName}
            </span>
          )}
        </label>

        {/* Upload Custom Video Button */}
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime,video/mkv"
          onChange={handleFileUpload}
          className="hidden"
        />

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center space-x-2 py-2.5 px-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-xs font-medium text-white transition-all shadow-sm hover:border-cyan-500/50"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>Upload Video</span>
          </button>

          <button
            onClick={handleUseRecording}
            className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-lg border text-xs font-medium transition-all ${
              bg.sourceType === 'recording'
                ? 'bg-cyan-950/60 border-cyan-500/80 text-cyan-200'
                : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-300'
            }`}
          >
            <Film className="w-3.5 h-3.5 text-indigo-400" />
            <span>Demo Clip</span>
          </button>
        </div>

        {/* Procedural Preset Motion Generators */}
        <div className="mt-3">
          <span className="text-[11px] text-neutral-400 block mb-1.5 font-medium">
            Dynamic Motion Backgrounds:
          </span>
          <div className="grid grid-cols-1 gap-1.5 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
            {BACKGROUND_PRESET_ANIMATIONS.map((preset) => {
              const isSelected = bg.sourceType === 'preset' && bg.presetId === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleUsePresetAnimation(preset.id)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/60 font-semibold'
                      : 'bg-neutral-900/90 text-neutral-400 hover:text-white hover:bg-neutral-800 border border-neutral-800/80'
                  }`}
                >
                  <span className="flex items-center space-x-2 truncate">
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    <span>{preset.name}</span>
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400">
                    {preset.category}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Visual Filters & Blur Effects */}
      <div className="space-y-4 bg-neutral-900/60 p-3.5 rounded-xl border border-neutral-800">
        <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
          Aesthetic Blur & Filters
        </h4>

        {/* Blur Slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-400">Background Blur</span>
            <span className="font-mono text-cyan-300">{bg.blur}px</span>
          </div>
          <input
            type="range"
            min="0"
            max="40"
            step="1"
            value={bg.blur}
            onChange={(e) =>
              onUpdateState((prev) => ({
                ...prev,
                background: { ...prev.background, blur: parseFloat(e.target.value) },
              }))
            }
            className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
        </div>

        {/* Opacity Slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-400">Opacity / Dimming</span>
            <span className="font-mono text-cyan-300">{Math.round(bg.opacity * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={bg.opacity}
            onChange={(e) =>
              onUpdateState((prev) => ({
                ...prev,
                background: { ...prev.background, opacity: parseFloat(e.target.value) },
              }))
            }
            className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
        </div>

        {/* Zoom / Scale Slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-400">Zoom / Scale</span>
            <span className="font-mono text-cyan-300">{bg.scale.toFixed(2)}x</span>
          </div>
          <input
            type="range"
            min="1"
            max="2"
            step="0.05"
            value={bg.scale}
            onChange={(e) =>
              onUpdateState((prev) => ({
                ...prev,
                background: { ...prev.background, scale: parseFloat(e.target.value) },
              }))
            }
            className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
        </div>

        {/* Brightness & Contrast Controls */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-neutral-400">
              <span>Brightness</span>
              <span>{Math.round(bg.brightness * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.4"
              max="1.6"
              step="0.05"
              value={bg.brightness}
              onChange={(e) =>
                onUpdateState((prev) => ({
                  ...prev,
                  background: { ...prev.background, brightness: parseFloat(e.target.value) },
                }))
              }
              className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-neutral-400">
              <span>Contrast</span>
              <span>{Math.round(bg.contrast * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.8"
              step="0.05"
              value={bg.contrast}
              onChange={(e) =>
                onUpdateState((prev) => ({
                  ...prev,
                  background: { ...prev.background, contrast: parseFloat(e.target.value) },
                }))
              }
              className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
        </div>
      </div>

      {/* 3. Overlay Gradient Atmosphere */}
      <div className="space-y-3 bg-neutral-900/60 p-3.5 rounded-xl border border-neutral-800">
        <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
          Atmospheric Vignette & Tint
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: 'dark-vignette', label: 'Dark Vignette' },
            { id: 'radial-glow', label: 'Radial Glow' },
            { id: 'top-bottom-fade', label: 'Top-Bottom Fade' },
            { id: 'cyber-mesh', label: 'Cyber Neon Tint' },
            { id: 'none', label: 'No Tint' },
          ].map((item) => {
            const isSelected = bg.overlayGradient === item.id;
            return (
              <button
                key={item.id}
                onClick={() =>
                  onUpdateState((prev) => ({
                    ...prev,
                    background: { ...prev.background, overlayGradient: item.id as any },
                  }))
                }
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition-all ${
                  isSelected
                    ? 'bg-cyan-600/30 text-cyan-200 border border-cyan-500/60 font-semibold'
                    : 'bg-neutral-800/80 text-neutral-400 hover:text-white border border-neutral-800'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Background Audio & Playback Options */}
      <div className="space-y-4 bg-neutral-900/60 p-3.5 rounded-xl border border-neutral-800">
        <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
          Audio & Looping
        </h4>

        {/* Audio Volume */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-400 flex items-center space-x-1.5">
              {bg.isMuted ? <VolumeX className="w-3.5 h-3.5 text-neutral-500" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
              <span>Background Track Volume</span>
            </span>
            <button
              onClick={() =>
                onUpdateState((prev) => ({
                  ...prev,
                  background: { ...prev.background, isMuted: !prev.background.isMuted },
                }))
              }
              className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 hover:text-white"
            >
              {bg.isMuted ? 'Unmute' : 'Mute'}
            </button>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={bg.isMuted ? 0 : bg.volume}
            disabled={bg.isMuted}
            onChange={(e) =>
              onUpdateState((prev) => ({
                ...prev,
                background: { ...prev.background, volume: parseFloat(e.target.value) },
              }))
            }
            className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 disabled:opacity-40"
          />
        </div>

        {/* Looping Toggle */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-neutral-400 flex items-center space-x-1.5">
            <Repeat className="w-3.5 h-3.5 text-indigo-400" />
            <span>Loop Background Video</span>
          </span>
          <button
            onClick={() =>
              onUpdateState((prev) => ({
                ...prev,
                background: { ...prev.background, loop: !prev.background.loop },
              }))
            }
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              bg.loop
                ? 'bg-cyan-600 text-white'
                : 'bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            {bg.loop ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>
    </div>
  );
};
