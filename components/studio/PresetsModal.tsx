'use client';

import React from 'react';
import { PRESET_TEMPLATES } from '@/lib/presets';
import { StudioProjectState, PresetTemplate } from '@/lib/types';
import { X, Sparkles, Check, Play, Palette } from 'lucide-react';

interface PresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPreset: (preset: PresetTemplate) => void;
}

export const PresetsModal: React.FC<PresetsModalProps> = ({
  isOpen,
  onClose,
  onApplyPreset,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Preset Templates</h2>
              <p className="text-xs text-neutral-400">
                1-click aesthetic video themes tailored for 3:4 portrait presentations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preset Cards List */}
        <div className="p-6 overflow-y-auto space-y-3 custom-scrollbar flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {PRESET_TEMPLATES.map((preset) => {
              return (
                <div
                  key={preset.id}
                  onClick={() => {
                    onApplyPreset(preset);
                    onClose();
                  }}
                  className="group relative rounded-xl border border-neutral-800 bg-neutral-950/60 p-4 hover:border-indigo-500/70 hover:bg-neutral-800/40 transition-all cursor-pointer flex flex-col justify-between overflow-hidden"
                >
                  {/* Decorative Gradient Bar */}
                  <div
                    className="h-1.5 w-full rounded-full mb-3"
                    style={{ background: preset.previewGradient }}
                  />

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">
                        {preset.name}
                      </h4>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700">
                        {preset.badge}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 mb-3">{preset.description}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80 text-xs">
                    <span className="text-[11px] text-neutral-500">{preset.category}</span>
                    <span className="text-indigo-400 font-medium group-hover:translate-x-0.5 transition-transform flex items-center space-x-1">
                      <span>Apply Preset</span>
                      <span>→</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
