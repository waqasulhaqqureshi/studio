'use client';

import React from 'react';
import { 
  Sparkles, 
  Download, 
  Camera, 
  RotateCcw, 
  Layers, 
  SlidersHorizontal, 
  Play, 
  Pause,
  Tv,
  Check
} from 'lucide-react';
import { AspectRatioType } from '@/lib/types';
import { ASPECT_RATIOS } from '@/lib/presets';

interface HeaderProps {
  aspectRatio: AspectRatioType;
  onSelectAspectRatio: (ratio: AspectRatioType) => void;
  onOpenPresets: () => void;
  onOpenExport: () => void;
  onCaptureScreenshot: () => void;
  onResetProject: () => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  aspectRatio,
  onSelectAspectRatio,
  onOpenPresets,
  onOpenExport,
  onCaptureScreenshot,
  onResetProject,
  isPlaying,
  onTogglePlay,
}) => {
  return (
    <header className="h-16 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-30 sticky top-0">
      {/* Brand & Logo */}
      <div className="flex items-center space-x-3">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
          <Layers className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-base tracking-tight text-white">VideoTab Studio</span>
            <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              3:4 Dual Layer
            </span>
          </div>
          <p className="text-xs text-neutral-400 hidden sm:block">
            Transparent mockup tab over background video
          </p>
        </div>
      </div>

      {/* Middle: Aspect Ratio & Quick Tools */}
      <div className="hidden md:flex items-center space-x-2 bg-neutral-900/90 p-1 rounded-xl border border-neutral-800">
        {(Object.keys(ASPECT_RATIOS) as AspectRatioType[]).map((ratioKey) => {
          const isSelected = aspectRatio === ratioKey;
          const isDefault34 = ratioKey === '3:4';
          return (
            <button
              key={ratioKey}
              onClick={() => onSelectAspectRatio(ratioKey)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
              }`}
            >
              <span>{ratioKey}</span>
              {isDefault34 && (
                <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-400/30 text-indigo-200 font-bold">
                  DEFAULT
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2.5">
        {/* Presets Button */}
        <button
          onClick={onOpenPresets}
          className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-200 text-xs font-medium transition-all flex items-center space-x-1.5 shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Templates</span>
        </button>

        {/* HD Screenshot */}
        <button
          onClick={onCaptureScreenshot}
          title="Capture HD Poster Screenshot (PNG)"
          className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white transition-all text-xs flex items-center justify-center shadow-sm"
        >
          <Camera className="w-4 h-4" />
        </button>

        {/* Reset */}
        <button
          onClick={onResetProject}
          title="Reset to default"
          className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-neutral-200 transition-all text-xs flex items-center justify-center"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Export Video Button */}
        <button
          onClick={onOpenExport}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/25 ring-1 ring-white/20 transition-all flex items-center space-x-2 group hover:scale-[1.02] active:scale-[0.98]"
        >
          <Download className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
          <span>Export 3:4 Video</span>
        </button>
      </div>
    </header>
  );
};
