'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { StudioProjectState } from '@/lib/types';
import { renderStudioFrame } from '@/lib/canvasRenderer';
import { 
  Play, 
  Pause, 
  Maximize2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Move,
  Layers,
  Eye
} from 'lucide-react';

interface CanvasPreviewProps {
  state: StudioProjectState;
  onUpdateState: (updater: (prev: StudioProjectState) => StudioProjectState) => void;
  onRegisterVideoRefs: (bgVideo: HTMLVideoElement | null, tabVideo: HTMLVideoElement | null) => void;
}

export const CanvasPreview: React.FC<CanvasPreviewProps> = ({
  state,
  onUpdateState,
  onRegisterVideoRefs,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const bgVideoRef = useRef<HTMLVideoElement | null>(null);
  const tabVideoRef = useRef<HTMLVideoElement | null>(null);

  const [zoomLevel, setZoomLevel] = useState<'fit' | '50' | '75' | '100'>('fit');
  const [fps, setFps] = useState<number>(60);
  const [isDraggingTab, setIsDraggingTab] = useState(false);
  const dragStartPos = useRef<{ x: number; y: number; startOffsetX: number; startOffsetY: number }>({
    x: 0,
    y: 0,
    startOffsetX: 0,
    startOffsetY: 0,
  });

  // Share video elements with parent for audio mixing and export
  useEffect(() => {
    onRegisterVideoRefs(bgVideoRef.current, tabVideoRef.current);
  }, [onRegisterVideoRefs]);

  // Sync video sources when state URLs change
  useEffect(() => {
    if (bgVideoRef.current && state.background.videoUrl) {
      if (bgVideoRef.current.src !== state.background.videoUrl) {
        bgVideoRef.current.src = state.background.videoUrl;
        bgVideoRef.current.load();
      }
    }
  }, [state.background.videoUrl]);

  useEffect(() => {
    if (tabVideoRef.current && state.tabMockup.videoUrl) {
      if (tabVideoRef.current.src !== state.tabMockup.videoUrl) {
        tabVideoRef.current.src = state.tabMockup.videoUrl;
        tabVideoRef.current.load();
      }
    }
  }, [state.tabMockup.videoUrl]);

  // Sync playback state (play / pause)
  useEffect(() => {
    const bg = bgVideoRef.current;
    const tab = tabVideoRef.current;

    if (state.isPlaying) {
      if (bg && bg.paused && !bg.error) {
        bg.play().catch(() => {});
      }
      if (tab && tab.paused && !tab.error) {
        tab.play().catch(() => {});
      }
    } else {
      if (bg && !bg.paused) bg.pause();
      if (tab && !tab.paused) tab.pause();
    }
  }, [state.isPlaying]);

  // Sync playback rate & mute
  useEffect(() => {
    if (bgVideoRef.current) {
      bgVideoRef.current.playbackRate = state.background.playbackSpeed || 1.0;
      bgVideoRef.current.muted = state.background.isMuted;
      bgVideoRef.current.volume = state.background.volume;
    }
    if (tabVideoRef.current) {
      tabVideoRef.current.playbackRate = state.tabMockup.playbackSpeed || 1.0;
      tabVideoRef.current.muted = state.tabMockup.isMuted;
      tabVideoRef.current.volume = state.tabMockup.volume;
    }
  }, [
    state.background.playbackSpeed,
    state.background.isMuted,
    state.background.volume,
    state.tabMockup.playbackSpeed,
    state.tabMockup.isMuted,
    state.tabMockup.volume,
  ]);

  // Sync seek time when state.currentTime changes externally (scrubber)
  const prevTimeRef = useRef(state.currentTime);
  useEffect(() => {
    if (Math.abs(state.currentTime - prevTimeRef.current) > 0.3) {
      if (bgVideoRef.current && bgVideoRef.current.duration) {
        const bgDuration = bgVideoRef.current.duration;
        const targetBgTime = state.background.loop
          ? state.currentTime % bgDuration
          : Math.min(state.currentTime, bgDuration);
        bgVideoRef.current.currentTime = targetBgTime;
      }
      if (tabVideoRef.current && tabVideoRef.current.duration) {
        tabVideoRef.current.currentTime = Math.min(state.currentTime, tabVideoRef.current.duration);
      }
    }
    prevTimeRef.current = state.currentTime;
  }, [state.currentTime, state.background.loop]);

  // Main 60 FPS Render Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();
    let frameCount = 0;
    let fpsTimer = performance.now();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const loop = (now: number) => {
      // Calculate real-time FPS
      frameCount++;
      if (now - fpsTimer >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - fpsTimer)));
        frameCount = 0;
        fpsTimer = now;
      }

      // If playing, update time from tab video or clock
      if (state.isPlaying) {
        const tab = tabVideoRef.current;
        const bg = bgVideoRef.current;

        let newCurrentTime = state.currentTime;

        if (tab && !tab.paused && tab.duration) {
          newCurrentTime = tab.currentTime;
          if (tab.ended) {
            tab.currentTime = 0;
            tab.play().catch(() => {});
          }
        } else if (bg && !bg.paused && bg.duration) {
          newCurrentTime = bg.currentTime;
        } else {
          const delta = (now - lastTime) / 1000;
          newCurrentTime = (state.currentTime + delta) % (state.duration || 15);
        }

        // Loop handling
        if (state.duration > 0 && newCurrentTime >= state.duration) {
          newCurrentTime = 0;
          if (tab) tab.currentTime = 0;
          if (bg) bg.currentTime = 0;
        }

        onUpdateState((prev) => ({
          ...prev,
          currentTime: newCurrentTime,
        }));
      }

      // Render composite frame
      renderStudioFrame({
        ctx,
        state,
        bgVideo: bgVideoRef.current,
        tabVideo: tabVideoRef.current,
        time: state.currentTime,
        width: canvas.width,
        height: canvas.height,
      });

      lastTime = now;
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [state, onUpdateState]);

  // Handle video metadata loaded to update project duration
  const handleTabLoadedMetadata = useCallback(() => {
    if (tabVideoRef.current && tabVideoRef.current.duration) {
      const dur = tabVideoRef.current.duration;
      onUpdateState((prev) => {
        if (prev.syncMode === 'sync-content') {
          return { ...prev, duration: Math.max(1, Math.round(dur * 10) / 10) };
        }
        return prev;
      });
    }
  }, [onUpdateState]);

  // Mouse Drag on Canvas to Move Tab Mockup
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDraggingTab(true);
    dragStartPos.current = {
      x: e.clientX,
      y: e.clientY,
      startOffsetX: state.tabMockup.offsetX,
      startOffsetY: state.tabMockup.offsetY,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingTab) return;
    const dx = e.clientX - dragStartPos.current.x;
    const dy = e.clientY - dragStartPos.current.y;

    onUpdateState((prev) => ({
      ...prev,
      tabMockup: {
        ...prev.tabMockup,
        offsetX: Math.round(dragStartPos.current.startOffsetX + dx * 1.5),
        offsetY: Math.round(dragStartPos.current.startOffsetY + dy * 1.5),
      },
    }));
  };

  const handleMouseUp = () => {
    setIsDraggingTab(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-950/60 relative overflow-hidden select-none">
      {/* Hidden Video Source Elements */}
      <video
        ref={bgVideoRef}
        crossOrigin="anonymous"
        playsInline
        loop={state.background.loop}
        className="hidden"
      />
      <video
        ref={tabVideoRef}
        crossOrigin="anonymous"
        playsInline
        onLoadedMetadata={handleTabLoadedMetadata}
        className="hidden"
      />

      {/* Top Canvas Viewport Toolbar */}
      <div className="h-10 px-4 flex items-center justify-between border-b border-neutral-800/80 bg-neutral-950/40 text-xs text-neutral-400">
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1 font-mono text-[11px] text-neutral-300 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{state.canvasWidth} × {state.canvasHeight}</span>
            <span className="text-neutral-500">({state.aspectRatio})</span>
          </span>

          <span className="font-mono text-[11px] text-neutral-400 hidden sm:inline">
            FPS: <span className="text-neutral-200">{fps}</span>
          </span>

          <span className="text-neutral-500 text-[11px] hidden md:inline">
            💡 Drag tab on canvas to reposition
          </span>
        </div>

        {/* Zoom & Viewport Controls */}
        <div className="flex items-center space-x-1 bg-neutral-900/80 p-0.5 rounded-lg border border-neutral-800">
          <button
            onClick={() => setZoomLevel('fit')}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
              zoomLevel === 'fit' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Fit
          </button>
          <button
            onClick={() => setZoomLevel('50')}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
              zoomLevel === '50' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            50%
          </button>
          <button
            onClick={() => setZoomLevel('75')}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
              zoomLevel === '75' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            75%
          </button>
          <button
            onClick={() => setZoomLevel('100')}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
              zoomLevel === '100' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            100%
          </button>

          {(state.tabMockup.offsetX !== 0 || state.tabMockup.offsetY !== 0) && (
            <button
              onClick={() =>
                onUpdateState((prev) => ({
                  ...prev,
                  tabMockup: { ...prev.tabMockup, offsetX: 0, offsetY: 0 },
                }))
              }
              title="Reset Tab Position to Center"
              className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-neutral-800 text-amber-300 hover:bg-neutral-700 flex items-center space-x-0.5"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Center</span>
            </button>
          )}
        </div>
      </div>

      {/* Center Canvas Stage */}
      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center p-4 sm:p-6 overflow-hidden relative"
      >
        {/* Subtle Background Canvas Grid pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none"></div>

        {/* 3:4 Studio Canvas Wrapper */}
        <div
          className="relative transition-all duration-150 flex items-center justify-center shadow-2xl rounded-2xl overflow-hidden ring-1 ring-neutral-700/60 bg-black group"
          style={{
            aspectRatio: '3 / 4',
            maxHeight: zoomLevel === 'fit' ? 'calc(100% - 10px)' : undefined,
            height:
              zoomLevel === '50'
                ? '50%'
                : zoomLevel === '75'
                ? '75%'
                : zoomLevel === '100'
                ? '100%'
                : '100%',
          }}
        >
          <canvas
            ref={canvasRef}
            width={state.canvasWidth}
            height={state.canvasHeight}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className={`w-full h-full object-contain ${
              isDraggingTab ? 'cursor-grabbing' : 'cursor-grab'
            }`}
          />

          {/* Quick Play Overlay on Hover */}
          <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-2 pointer-events-none">
            <span className="bg-black/70 backdrop-blur-md text-[11px] text-white px-2.5 py-1 rounded-full border border-white/10 flex items-center space-x-1.5 shadow-lg">
              <Move className="w-3 h-3 text-indigo-400" />
              <span>Tab Centered (Transparent Mask)</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
