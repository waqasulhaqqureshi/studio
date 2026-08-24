'use client';

import React, { useState, useRef, useCallback } from 'react';
import { StudioProjectState, AspectRatioType, PresetTemplate } from '@/lib/types';
import { INITIAL_STUDIO_STATE, ASPECT_RATIOS } from '@/lib/presets';
import { StudioVideoExporter } from '@/lib/videoExporter';
import { Header } from '@/components/studio/Header';
import { CanvasPreview } from '@/components/studio/CanvasPreview';
import { TabMockupControls } from '@/components/studio/TabMockupControls';
import { BackgroundControls } from '@/components/studio/BackgroundControls';
import { OverlayControls } from '@/components/studio/OverlayControls';
import { AudioMixerControls } from '@/components/studio/AudioMixerControls';
import { TimelineControls } from '@/components/studio/TimelineControls';
import { PresetsModal } from '@/components/studio/PresetsModal';
import { ExportModal } from '@/components/studio/ExportModal';
import { 
  Layers, 
  Film, 
  Sparkles, 
  Type, 
  Volume2, 
  Maximize2,
  CheckCircle2
} from 'lucide-react';

export default function StudioPage() {
  const [state, setState] = useState<StudioProjectState>(INITIAL_STUDIO_STATE);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'tabMockup' | 'background' | 'overlays' | 'audio'>('tabMockup');
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Video references from CanvasPreview
  const bgVideoRef = useRef<HTMLVideoElement | null>(null);
  const tabVideoRef = useRef<HTMLVideoElement | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleRegisterVideoRefs = useCallback(
    (bgVideo: HTMLVideoElement | null, tabVideo: HTMLVideoElement | null) => {
      bgVideoRef.current = bgVideo;
      tabVideoRef.current = tabVideo;
    },
    []
  );

  const handleSelectAspectRatio = (ratio: AspectRatioType) => {
    const config = ASPECT_RATIOS[ratio];
    setState((prev) => ({
      ...prev,
      aspectRatio: ratio,
      canvasWidth: config.width,
      canvasHeight: config.height,
    }));
    showToast(`Aspect ratio switched to ${ratio}`);
  };

  const handleTogglePlay = () => {
    setState((prev) => ({
      ...prev,
      isPlaying: !prev.isPlaying,
    }));
  };

  const handleApplyPreset = (preset: PresetTemplate) => {
    setState((prev) => ({
      ...prev,
      ...preset.config,
    }));
    showToast(`Applied preset: ${preset.name}`);
  };

  const handleResetProject = () => {
    if (confirm('Reset project back to default settings?')) {
      setState(INITIAL_STUDIO_STATE);
      showToast('Project reset to default');
    }
  };

  const handleCaptureScreenshot = () => {
    const exporter = new StudioVideoExporter();
    const dataUrl = exporter.captureStillFrame(state, bgVideoRef.current, tabVideoRef.current);
    if (!dataUrl) {
      showToast('Failed to capture screenshot');
      return;
    }

    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `tab-studio-mockup-frame-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('HD 3:4 Poster Frame (PNG) downloaded!');
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-neutral-950 text-neutral-100 font-sans">
      {/* 1. Studio Top Navigation Bar */}
      <Header
        aspectRatio={state.aspectRatio}
        onSelectAspectRatio={handleSelectAspectRatio}
        onOpenPresets={() => setIsPresetsOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onCaptureScreenshot={handleCaptureScreenshot}
        onResetProject={handleResetProject}
        isPlaying={state.isPlaying}
        onTogglePlay={handleTogglePlay}
      />

      {/* 2. Main Studio Workspace (Split View) */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Center Stage Canvas Preview */}
        <CanvasPreview
          state={state}
          onUpdateState={setState}
          onRegisterVideoRefs={handleRegisterVideoRefs}
        />

        {/* Right Controls Panel */}
        <div className="w-full md:w-96 lg:w-[410px] h-1/2 md:h-full border-l border-neutral-800 bg-neutral-950 flex flex-col z-10 shrink-0">
          {/* Layer Tabs Header */}
          <div className="flex items-center border-b border-neutral-800 bg-neutral-950 px-2 py-1.5 space-x-1 shrink-0 overflow-x-auto custom-scrollbar">
            <button
              onClick={() => setActiveSidebarTab('tabMockup')}
              className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all whitespace-nowrap ${
                activeSidebarTab === 'tabMockup'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
              <span>Up: Tab Mockup</span>
            </button>

            <button
              onClick={() => setActiveSidebarTab('background')}
              className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all whitespace-nowrap ${
                activeSidebarTab === 'background'
                  ? 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
              <span>Down: Background</span>
            </button>

            <button
              onClick={() => setActiveSidebarTab('overlays')}
              className={`py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all whitespace-nowrap ${
                activeSidebarTab === 'overlays'
                  ? 'bg-pink-600/20 text-pink-300 border border-pink-500/40 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>Overlays</span>
            </button>

            <button
              onClick={() => setActiveSidebarTab('audio')}
              className={`py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all whitespace-nowrap ${
                activeSidebarTab === 'audio'
                  ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Audio</span>
            </button>
          </div>

          {/* Active Tab Panel Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar">
            {activeSidebarTab === 'tabMockup' && (
              <TabMockupControls state={state} onUpdateState={setState} />
            )}
            {activeSidebarTab === 'background' && (
              <BackgroundControls state={state} onUpdateState={setState} />
            )}
            {activeSidebarTab === 'overlays' && (
              <OverlayControls state={state} onUpdateState={setState} />
            )}
            {activeSidebarTab === 'audio' && (
              <AudioMixerControls state={state} onUpdateState={setState} />
            )}
          </div>
        </div>
      </div>

      {/* 3. Bottom Master Timeline & Scrubber */}
      <TimelineControls
        state={state}
        onUpdateState={setState}
        onTogglePlay={handleTogglePlay}
      />

      {/* 4. Modals */}
      <PresetsModal
        isOpen={isPresetsOpen}
        onClose={() => setIsPresetsOpen(false)}
        onApplyPreset={handleApplyPreset}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        state={state}
        bgVideo={bgVideoRef.current}
        tabVideo={tabVideoRef.current}
        onCaptureScreenshot={handleCaptureScreenshot}
      />

      {/* 5. Toast Feedback Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-neutral-900 border border-neutral-700 text-white text-xs px-4 py-2.5 rounded-xl shadow-2xl flex items-center space-x-2 animate-in fade-in slide-in-from-top-2 duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
