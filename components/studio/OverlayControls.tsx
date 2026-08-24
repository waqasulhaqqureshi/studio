'use client';

import React from 'react';
import { StudioProjectState } from '@/lib/types';
import { 
  Type, 
  Sparkles, 
  ShieldAlert, 
  Layers, 
  Sliders, 
  Palette,
  AlignVerticalJustifyCenter
} from 'lucide-react';

interface OverlayControlsProps {
  state: StudioProjectState;
  onUpdateState: (updater: (prev: StudioProjectState) => StudioProjectState) => void;
}

export const OverlayControls: React.FC<OverlayControlsProps> = ({
  state,
  onUpdateState,
}) => {
  const { headline, watermark, progressBar } = state.overlays;

  return (
    <div className="space-y-6 pb-12 text-neutral-200">
      {/* Section Header */}
      <div>
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-pink-500 shadow-sm shadow-pink-500"></div>
          <h3 className="font-semibold text-sm text-white tracking-wide uppercase">
            Overlays & Social Badges
          </h3>
        </div>
        <p className="text-xs text-neutral-400 mt-1">
          Add bold headline badges, branding watermarks, and progress bars over your 3:4 video.
        </p>
      </div>

      {/* 1. Headline Badge */}
      <div className="space-y-3 bg-neutral-900/60 p-3.5 rounded-xl border border-neutral-800">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center space-x-1.5">
            <Type className="w-3.5 h-3.5 text-pink-400" />
            <span>Top / Bottom Headline Badge</span>
          </span>
          <button
            onClick={() =>
              onUpdateState((prev) => ({
                ...prev,
                overlays: {
                  ...prev.overlays,
                  headline: { ...prev.overlays.headline, enabled: !prev.overlays.headline.enabled },
                },
              }))
            }
            className={`px-2.5 py-1 rounded text-xs font-semibold ${
              headline.enabled ? 'bg-pink-600 text-white' : 'bg-neutral-800 text-neutral-400'
            }`}
          >
            {headline.enabled ? 'ON' : 'OFF'}
          </button>
        </div>

        {headline.enabled && (
          <div className="space-y-3 pt-2">
            {/* Headline Text */}
            <div className="space-y-1">
              <label className="text-[11px] text-neutral-400">Headline Text</label>
              <input
                type="text"
                value={headline.text}
                onChange={(e) =>
                  onUpdateState((prev) => ({
                    ...prev,
                    overlays: {
                      ...prev.overlays,
                      headline: { ...prev.overlays.headline, text: e.target.value },
                    },
                  }))
                }
                placeholder="🚀 NEW FEATURE DROP"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-pink-500"
              />
            </div>

            {/* Subtext */}
            <div className="space-y-1">
              <label className="text-[11px] text-neutral-400">Subtext (Optional)</label>
              <input
                type="text"
                value={headline.subtext}
                onChange={(e) =>
                  onUpdateState((prev) => ({
                    ...prev,
                    overlays: {
                      ...prev.overlays,
                      headline: { ...prev.overlays.headline, subtext: e.target.value },
                    },
                  }))
                }
                placeholder="Watch until the end to see the result!"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-pink-500"
              />
            </div>

            {/* Position */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-neutral-400">Badge Position</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() =>
                    onUpdateState((prev) => ({
                      ...prev,
                      overlays: {
                        ...prev.overlays,
                        headline: { ...prev.overlays.headline, position: 'top' },
                      },
                    }))
                  }
                  className={`py-1.5 rounded-lg text-xs font-medium ${
                    headline.position === 'top'
                      ? 'bg-pink-600 text-white'
                      : 'bg-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  Top of Video
                </button>
                <button
                  onClick={() =>
                    onUpdateState((prev) => ({
                      ...prev,
                      overlays: {
                        ...prev.overlays,
                        headline: { ...prev.overlays.headline, position: 'bottom' },
                      },
                    }))
                  }
                  className={`py-1.5 rounded-lg text-xs font-medium ${
                    headline.position === 'bottom'
                      ? 'bg-pink-600 text-white'
                      : 'bg-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  Bottom of Video
                </button>
              </div>
            </div>

            {/* Badge Color Presets */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-neutral-400">Badge Theme Color</label>
              <div className="flex items-center space-x-2">
                {['#6366f1', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#dc2626', '#18181b'].map(
                  (col) => (
                    <button
                      key={col}
                      onClick={() =>
                        onUpdateState((prev) => ({
                          ...prev,
                          overlays: {
                            ...prev.overlays,
                            headline: { ...prev.overlays.headline, badgeColor: col },
                          },
                        }))
                      }
                      style={{ backgroundColor: col }}
                      className={`w-6 h-6 rounded-full border-2 transition-transform ${
                        headline.badgeColor === col
                          ? 'border-white scale-110 shadow-md'
                          : 'border-transparent hover:scale-105'
                      }`}
                    />
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Watermark / Branding Tag */}
      <div className="space-y-3 bg-neutral-900/60 p-3.5 rounded-xl border border-neutral-800">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
            Watermark / Creator Tag
          </span>
          <button
            onClick={() =>
              onUpdateState((prev) => ({
                ...prev,
                overlays: {
                  ...prev.overlays,
                  watermark: {
                    ...prev.overlays.watermark,
                    enabled: !prev.overlays.watermark.enabled,
                  },
                },
              }))
            }
            className={`px-2.5 py-1 rounded text-xs font-semibold ${
              watermark.enabled ? 'bg-indigo-600 text-white' : 'bg-neutral-800 text-neutral-400'
            }`}
          >
            {watermark.enabled ? 'ON' : 'OFF'}
          </button>
        </div>

        {watermark.enabled && (
          <div className="space-y-3 pt-2">
            <div className="space-y-1">
              <label className="text-[11px] text-neutral-400">Tag Text</label>
              <input
                type="text"
                value={watermark.text}
                onChange={(e) =>
                  onUpdateState((prev) => ({
                    ...prev,
                    overlays: {
                      ...prev.overlays,
                      watermark: { ...prev.overlays.watermark, text: e.target.value },
                    },
                  }))
                }
                placeholder="@mychannel"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map((pos) => (
                <button
                  key={pos}
                  onClick={() =>
                    onUpdateState((prev) => ({
                      ...prev,
                      overlays: {
                        ...prev.overlays,
                        watermark: { ...prev.overlays.watermark, position: pos },
                      },
                    }))
                  }
                  className={`py-1 rounded text-[11px] font-medium capitalize ${
                    watermark.position === pos
                      ? 'bg-indigo-600 text-white'
                      : 'bg-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  {pos.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. Progress Bar */}
      <div className="space-y-3 bg-neutral-900/60 p-3.5 rounded-xl border border-neutral-800">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
            Bottom Video Progress Bar
          </span>
          <button
            onClick={() =>
              onUpdateState((prev) => ({
                ...prev,
                overlays: {
                  ...prev.overlays,
                  progressBar: {
                    ...prev.overlays.progressBar,
                    enabled: !prev.overlays.progressBar.enabled,
                  },
                },
              }))
            }
            className={`px-2.5 py-1 rounded text-xs font-semibold ${
              progressBar.enabled ? 'bg-indigo-600 text-white' : 'bg-neutral-800 text-neutral-400'
            }`}
          >
            {progressBar.enabled ? 'ON' : 'OFF'}
          </button>
        </div>

        {progressBar.enabled && (
          <div className="space-y-2 pt-1">
            <div className="flex items-center space-x-2">
              {['#6366f1', '#ec4899', '#06b6d4', '#10b981', '#ffffff', '#f59e0b'].map((color) => (
                <button
                  key={color}
                  onClick={() =>
                    onUpdateState((prev) => ({
                      ...prev,
                      overlays: {
                        ...prev.overlays,
                        progressBar: { ...prev.overlays.progressBar, color },
                      },
                    }))
                  }
                  style={{ backgroundColor: color }}
                  className={`w-5 h-5 rounded-full border-2 ${
                    progressBar.color === color ? 'border-white scale-110' : 'border-transparent'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
