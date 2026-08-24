'use client';

import React, { useRef } from 'react';
import { StudioProjectState, TabStyleType, ShadowPreset, BorderPreset, VideoFit } from '@/lib/types';
import { 
  Upload, 
  Film, 
  Globe, 
  Layout, 
  Volume2, 
  VolumeX, 
  Rotate3d, 
  Maximize, 
  Square, 
  Sparkles,
  Move,
  RotateCcw,
  Palette,
  Sliders
} from 'lucide-react';

interface TabMockupControlsProps {
  state: StudioProjectState;
  onUpdateState: (updater: (prev: StudioProjectState) => StudioProjectState) => void;
}

export const TabMockupControls: React.FC<TabMockupControlsProps> = ({
  state,
  onUpdateState,
}) => {
  const tab = state.tabMockup;
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    onUpdateState((prev) => ({
      ...prev,
      tabMockup: {
        ...prev.tabMockup,
        videoUrl: url,
        fileName: file.name,
        sourceType: 'upload',
      },
    }));
  };

  const handleUseRecording = () => {
    onUpdateState((prev) => ({
      ...prev,
      tabMockup: {
        ...prev.tabMockup,
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
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500 animate-pulse"></div>
          <h3 className="font-semibold text-sm text-white tracking-wide uppercase">
            Up Layer — Tab Mockup & Video
          </h3>
        </div>
        <p className="text-xs text-neutral-400 mt-1">
          Centered browser tab holding your main video. Outer area is 100% transparent.
        </p>
      </div>

      {/* 1. Video Source Picker */}
      <div className="space-y-3 bg-neutral-900/60 p-3.5 rounded-xl border border-neutral-800">
        <label className="text-xs font-medium text-neutral-300 flex items-center justify-between">
          <span>Tab Content Video</span>
          {tab.fileName && (
            <span className="text-[10px] text-indigo-400 truncate max-w-[140px]">
              {tab.fileName}
            </span>
          )}
        </label>

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
            className="flex items-center justify-center space-x-2 py-2.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all shadow-md shadow-indigo-600/20"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Video</span>
          </button>

          <button
            onClick={handleUseRecording}
            className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-lg border text-xs font-medium transition-all ${
              tab.sourceType === 'recording'
                ? 'bg-indigo-950/60 border-indigo-500/80 text-indigo-200'
                : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-300'
            }`}
          >
            <Film className="w-3.5 h-3.5 text-purple-400" />
            <span>Demo Clip</span>
          </button>
        </div>
      </div>

      {/* 2. Window Mockup Style */}
      <div className="space-y-3 bg-neutral-900/60 p-3.5 rounded-xl border border-neutral-800">
        <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
          Browser & Window Style
        </h4>

        <div className="grid grid-cols-2 gap-2">
          {[
            { id: 'safari-dark', name: 'macOS Safari Dark' },
            { id: 'safari-light', name: 'macOS Safari Light' },
            { id: 'arc-glass', name: 'Arc Glassmorphism' },
            { id: 'chrome-dark', name: 'Chrome Dark' },
            { id: 'minimal-glass', name: 'Minimal Frameless' },
            { id: 'retro-mac', name: 'Classic Retro Mac' },
          ].map((style) => {
            const isSelected = tab.style === style.id;
            return (
              <button
                key={style.id}
                onClick={() =>
                  onUpdateState((prev) => ({
                    ...prev,
                    tabMockup: { ...prev.tabMockup, style: style.id as TabStyleType },
                  }))
                }
                className={`px-3 py-2 rounded-lg text-xs font-medium text-left transition-all ${
                  isSelected
                    ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/80 font-semibold'
                    : 'bg-neutral-800/80 text-neutral-400 hover:text-white border border-neutral-800'
                }`}
              >
                {style.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Header & URL Bar Details */}
      <div className="space-y-3 bg-neutral-900/60 p-3.5 rounded-xl border border-neutral-800">
        <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
          Tab Header & Address Bar
        </h4>

        {/* Tab Title */}
        <div className="space-y-1">
          <label className="text-[11px] text-neutral-400">Tab Title</label>
          <input
            type="text"
            value={tab.tabTitle}
            onChange={(e) =>
              onUpdateState((prev) => ({
                ...prev,
                tabMockup: { ...prev.tabMockup, tabTitle: e.target.value },
              }))
            }
            placeholder="studio.app — Video Canvas"
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* URL Bar Text */}
        <div className="space-y-1">
          <label className="text-[11px] text-neutral-400">URL Bar Address</label>
          <div className="relative">
            <Globe className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={tab.tabUrl}
              onChange={(e) =>
                onUpdateState((prev) => ({
                  ...prev,
                  tabMockup: { ...prev.tabMockup, tabUrl: e.target.value },
                }))
              }
              placeholder="https://studio.app/workspace/tab"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>
        </div>

        {/* Toggles */}
        <div className="flex items-center justify-between pt-1 text-xs text-neutral-400">
          <span>Show URL Pill</span>
          <button
            onClick={() =>
              onUpdateState((prev) => ({
                ...prev,
                tabMockup: { ...prev.tabMockup, showUrlBar: !prev.tabMockup.showUrlBar },
              }))
            }
            className={`px-2.5 py-1 rounded text-xs font-semibold ${
              tab.showUrlBar ? 'bg-indigo-600 text-white' : 'bg-neutral-800 text-neutral-400'
            }`}
          >
            {tab.showUrlBar ? 'ON' : 'OFF'}
          </button>
        </div>

        <div className="flex items-center justify-between text-xs text-neutral-400">
          <span>Window Controls (Dots)</span>
          <button
            onClick={() =>
              onUpdateState((prev) => ({
                ...prev,
                tabMockup: {
                  ...prev.tabMockup,
                  showWindowControls: !prev.tabMockup.showWindowControls,
                },
              }))
            }
            className={`px-2.5 py-1 rounded text-xs font-semibold ${
              tab.showWindowControls ? 'bg-indigo-600 text-white' : 'bg-neutral-800 text-neutral-400'
            }`}
          >
            {tab.showWindowControls ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* 4. Tab Geometry & Layout */}
      <div className="space-y-4 bg-neutral-900/60 p-3.5 rounded-xl border border-neutral-800">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
            Sizing & Centering
          </h4>
          {(tab.offsetX !== 0 || tab.offsetY !== 0) && (
            <button
              onClick={() =>
                onUpdateState((prev) => ({
                  ...prev,
                  tabMockup: { ...prev.tabMockup, offsetX: 0, offsetY: 0 },
                }))
              }
              className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Center</span>
            </button>
          )}
        </div>

        {/* Tab Scale / Width */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-400">Tab Width Scale</span>
            <span className="font-mono text-indigo-300">{Math.round(tab.tabScale * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="0.96"
            step="0.02"
            value={tab.tabScale}
            onChange={(e) =>
              onUpdateState((prev) => ({
                ...prev,
                tabMockup: { ...prev.tabMockup, tabScale: parseFloat(e.target.value) },
              }))
            }
            className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>

        {/* Corner Radius */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-400">Corner Rounding</span>
            <span className="font-mono text-indigo-300">{tab.borderRadius}px</span>
          </div>
          <input
            type="range"
            min="4"
            max="40"
            step="2"
            value={tab.borderRadius}
            onChange={(e) =>
              onUpdateState((prev) => ({
                ...prev,
                tabMockup: { ...prev.tabMockup, borderRadius: parseInt(e.target.value) },
              }))
            }
            className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>

        {/* X / Y Position Offsets */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-neutral-400">
              <span>X Offset</span>
              <span>{tab.offsetX}px</span>
            </div>
            <input
              type="range"
              min="-200"
              max="200"
              step="5"
              value={tab.offsetX}
              onChange={(e) =>
                onUpdateState((prev) => ({
                  ...prev,
                  tabMockup: { ...prev.tabMockup, offsetX: parseInt(e.target.value) },
                }))
              }
              className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-neutral-400">
              <span>Y Offset</span>
              <span>{tab.offsetY}px</span>
            </div>
            <input
              type="range"
              min="-200"
              max="200"
              step="5"
              value={tab.offsetY}
              onChange={(e) =>
                onUpdateState((prev) => ({
                  ...prev,
                  tabMockup: { ...prev.tabMockup, offsetY: parseInt(e.target.value) },
                }))
              }
              className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* 5. 3D Perspective Tilt */}
      <div className="space-y-3 bg-neutral-900/60 p-3.5 rounded-xl border border-neutral-800">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center space-x-1.5">
            <Rotate3d className="w-3.5 h-3.5 text-pink-400" />
            <span>3D Perspective Tilt</span>
          </span>
          <button
            onClick={() =>
              onUpdateState((prev) => ({
                ...prev,
                tabMockup: {
                  ...prev.tabMockup,
                  tilt3D: { ...prev.tabMockup.tilt3D, enabled: !prev.tabMockup.tilt3D.enabled },
                },
              }))
            }
            className={`px-2.5 py-1 rounded text-xs font-semibold ${
              tab.tilt3D.enabled ? 'bg-pink-600 text-white' : 'bg-neutral-800 text-neutral-400'
            }`}
          >
            {tab.tilt3D.enabled ? 'ON' : 'OFF'}
          </button>
        </div>

        {tab.tilt3D.enabled && (
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-neutral-400">
                <span>Tilt X</span>
                <span>{tab.tilt3D.rotateX}°</span>
              </div>
              <input
                type="range"
                min="-20"
                max="20"
                step="1"
                value={tab.tilt3D.rotateX}
                onChange={(e) =>
                  onUpdateState((prev) => ({
                    ...prev,
                    tabMockup: {
                      ...prev.tabMockup,
                      tilt3D: { ...prev.tabMockup.tilt3D, rotateX: parseInt(e.target.value) },
                    },
                  }))
                }
                className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-neutral-400">
                <span>Tilt Y</span>
                <span>{tab.tilt3D.rotateY}°</span>
              </div>
              <input
                type="range"
                min="-20"
                max="20"
                step="1"
                value={tab.tilt3D.rotateY}
                onChange={(e) =>
                  onUpdateState((prev) => ({
                    ...prev,
                    tabMockup: {
                      ...prev.tabMockup,
                      tilt3D: { ...prev.tabMockup.tilt3D, rotateY: parseInt(e.target.value) },
                    },
                  }))
                }
                className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* 6. Shadows & Borders */}
      <div className="space-y-4 bg-neutral-900/60 p-3.5 rounded-xl border border-neutral-800">
        <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
          Shadow & Outer Border
        </h4>

        {/* Shadows */}
        <div className="space-y-1.5">
          <label className="text-[11px] text-neutral-400">Drop Shadow Elevation</label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'deep', label: 'Deep 3D' },
              { id: 'soft', label: 'Soft' },
              { id: 'glow-purple', label: 'Purple Glow' },
              { id: 'glow-cyan', label: 'Cyan Glow' },
              { id: 'glow-amber', label: 'Amber Glow' },
              { id: 'none', label: 'None' },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() =>
                  onUpdateState((prev) => ({
                    ...prev,
                    tabMockup: { ...prev.tabMockup, shadow: s.id as ShadowPreset },
                  }))
                }
                className={`px-2 py-1.5 rounded text-[11px] font-medium transition-all ${
                  tab.shadow === s.id
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Borders */}
        <div className="space-y-1.5">
          <label className="text-[11px] text-neutral-400">Frame Border</label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'glass', label: 'Glass' },
              { id: 'neon-gradient', label: 'Neon' },
              { id: 'subtle', label: 'Subtle' },
              { id: 'solid-white', label: 'White' },
              { id: 'solid-dark', label: 'Dark' },
              { id: 'none', label: 'None' },
            ].map((b) => (
              <button
                key={b.id}
                onClick={() =>
                  onUpdateState((prev) => ({
                    ...prev,
                    tabMockup: { ...prev.tabMockup, border: b.id as BorderPreset },
                  }))
                }
                className={`px-2 py-1.5 rounded text-[11px] font-medium transition-all ${
                  tab.border === b.id
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 7. Content Video Fit & Inset */}
      <div className="space-y-4 bg-neutral-900/60 p-3.5 rounded-xl border border-neutral-800">
        <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
          Tab Video Sizing & Audio
        </h4>

        {/* Video Fit */}
        <div className="space-y-1.5">
          <label className="text-[11px] text-neutral-400">Video Content Fit</label>
          <div className="grid grid-cols-3 gap-1.5">
            {(['cover', 'contain', 'fill'] as VideoFit[]).map((fit) => (
              <button
                key={fit}
                onClick={() =>
                  onUpdateState((prev) => ({
                    ...prev,
                    tabMockup: { ...prev.tabMockup, videoFit: fit },
                  }))
                }
                className={`px-2 py-1.5 rounded text-[11px] capitalize font-medium ${
                  tab.videoFit === fit
                    ? 'bg-indigo-600 text-white'
                    : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                {fit}
              </button>
            ))}
          </div>
        </div>

        {/* Video Audio Volume */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-400 flex items-center space-x-1.5">
              {tab.isMuted ? <VolumeX className="w-3.5 h-3.5 text-neutral-500" /> : <Volume2 className="w-3.5 h-3.5 text-indigo-400" />}
              <span>Tab Video Volume</span>
            </span>
            <button
              onClick={() =>
                onUpdateState((prev) => ({
                  ...prev,
                  tabMockup: { ...prev.tabMockup, isMuted: !prev.tabMockup.isMuted },
                }))
              }
              className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 hover:text-white"
            >
              {tab.isMuted ? 'Unmute' : 'Mute'}
            </button>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={tab.isMuted ? 0 : tab.volume}
            disabled={tab.isMuted}
            onChange={(e) =>
              onUpdateState((prev) => ({
                ...prev,
                tabMockup: { ...prev.tabMockup, volume: parseFloat(e.target.value) },
              }))
            }
            className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 disabled:opacity-40"
          />
        </div>
      </div>
    </div>
  );
};
