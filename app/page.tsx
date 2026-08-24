'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { StudioState } from '@/lib/types';
import { renderStudioFrame } from '@/lib/canvasRenderer';
import { StudioVideoExporter, ExportProgress } from '@/lib/videoExporter';
import { 
  Upload, 
  Film, 
  RotateCcw, 
  Download, 
  Camera, 
  Tablet, 
  CheckCircle2, 
  Sliders, 
  FileVideo,
  X,
  Loader2,
  Trash2
} from 'lucide-react';

const INITIAL_STATE: StudioState = {
  tabVideoUrl: null,
  tabVideoName: '',
  bgVideoUrl: null,
  bgVideoName: '',
  tabWidthScale: 0.76,
  tabRadius: 18,
  tabShadow: 'deep',
  tabBorder: true,
  tabStyle: 'minimal-card',
  bgBlur: 6,
  bgDim: 0.15,
  showTabletBezel: true,
  duration: 10,
  currentTime: 0,
};

export default function StudioPage() {
  const [state, setState] = useState<StudioState>(INITIAL_STATE);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Export state
  const [isExporting, setIsExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  // Hidden video elements and canvas refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bgVideoRef = useRef<HTMLVideoElement | null>(null);
  const tabVideoRef = useRef<HTMLVideoElement | null>(null);

  // File input refs
  const tabFileInputRef = useRef<HTMLInputElement | null>(null);
  const bgFileInputRef = useRef<HTMLInputElement | null>(null);

  const exporterRef = useRef<StudioVideoExporter | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Sync video URLs and automatically play them continuously
  useEffect(() => {
    const bg = bgVideoRef.current;
    if (bg && state.bgVideoUrl) {
      if (bg.src !== state.bgVideoUrl) {
        bg.src = state.bgVideoUrl;
        bg.muted = true;
        bg.loop = true;
        bg.load();
        bg.play().catch(() => {});
      }
    }
  }, [state.bgVideoUrl]);

  useEffect(() => {
    const tab = tabVideoRef.current;
    if (tab && state.tabVideoUrl) {
      if (tab.src !== state.tabVideoUrl) {
        tab.src = state.tabVideoUrl;
        tab.muted = true;
        tab.loop = true;
        tab.load();
        tab.play().catch(() => {});
      }
    }
  }, [state.tabVideoUrl]);

  // Main 60 FPS Canvas Render Loop (Always continuously running)
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let lastTime = performance.now();

    const loop = (now: number) => {
      const tab = tabVideoRef.current;
      const bg = bgVideoRef.current;

      let curTime = state.currentTime;

      // Keep videos playing automatically
      if (tab && tab.src && tab.paused && !tab.error) {
        tab.play().catch(() => {});
      }
      if (bg && bg.src && bg.paused && !bg.error) {
        bg.play().catch(() => {});
      }

      if (tab && !tab.paused && tab.duration) {
        curTime = tab.currentTime;
      } else if (bg && !bg.paused && bg.duration) {
        curTime = bg.currentTime;
      } else {
        const delta = (now - lastTime) / 1000;
        curTime = (state.currentTime + delta) % (state.duration || 10);
      }

      setState((prev) => ({ ...prev, currentTime: curTime }));

      renderStudioFrame({
        ctx,
        state,
        bgVideo: bgVideoRef.current,
        tabVideo: tabVideoRef.current,
        time: curTime,
        width: canvas.width,
        height: canvas.height,
      });

      lastTime = now;
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [state]);

  // Update duration when tab video metadata is loaded
  const handleTabLoadedMetadata = useCallback(() => {
    const tab = tabVideoRef.current;
    if (tab && tab.duration && !isNaN(tab.duration)) {
      const dur = tab.duration;
      setState((prev) => ({ ...prev, duration: Math.max(1, Math.round(dur * 10) / 10) }));
      tab.play().catch(() => {});
    }
  }, []);

  const handleBgLoadedMetadata = useCallback(() => {
    const bg = bgVideoRef.current;
    if (bg && bg.duration && !isNaN(bg.duration)) {
      bg.play().catch(() => {});
    }
  }, []);

  // Upload Handlers (File Input & Drag & Drop)
  const handleTabFileUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    setState((prev) => ({
      ...prev,
      tabVideoUrl: url,
      tabVideoName: file.name,
      currentTime: 0,
    }));
    showToast(`Tab content video loaded: ${file.name}`);
  };

  const handleBgFileUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    setState((prev) => ({
      ...prev,
      bgVideoUrl: url,
      bgVideoName: file.name,
      currentTime: 0,
    }));
    showToast(`Background video loaded: ${file.name}`);
  };

  const handleRemoveTabVideo = (e: React.MouseEvent) => {
    e.stopPropagation();
    setState((prev) => ({
      ...prev,
      tabVideoUrl: null,
      tabVideoName: '',
    }));
    if (tabVideoRef.current) tabVideoRef.current.src = '';
    showToast('Tab video removed');
  };

  const handleRemoveBgVideo = (e: React.MouseEvent) => {
    e.stopPropagation();
    setState((prev) => ({
      ...prev,
      bgVideoUrl: null,
      bgVideoName: '',
    }));
    if (bgVideoRef.current) bgVideoRef.current.src = '';
    showToast('Background video removed');
  };

  // HD Poster Frame Screenshot
  const handleCaptureScreenshot = () => {
    const exporter = new StudioVideoExporter();
    const dataUrl = exporter.captureStillFrame(state, bgVideoRef.current, tabVideoRef.current);
    if (!dataUrl) return;

    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `video-tab-mockup-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('HD 3:4 Poster Frame (PNG) downloaded!');
  };

  // Video Export Handler
  const handleStartExport = async () => {
    setIsExporting(true);
    setDownloadUrl(null);

    const exporter = new StudioVideoExporter();
    exporterRef.current = exporter;

    try {
      const result = await exporter.exportVideo(
        state,
        bgVideoRef.current,
        tabVideoRef.current,
        (p) => setExportProgress(p)
      );
      setDownloadUrl(result.blobUrl);
      setIsExporting(false);
    } catch (err: any) {
      setIsExporting(false);
      setExportProgress({
        progress: 0,
        status: 'error',
        errorMessage: err.message || 'Export error',
      });
    }
  };

  const handleDownloadExportedVideo = () => {
    if (!downloadUrl) return;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `studio-tab-mockup-${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatTime = (secs: number) => {
    const s = Math.max(0, secs);
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-neutral-950 text-neutral-100 font-sans select-none overflow-hidden">
      {/* Hidden Video Source Elements */}
      <video
        ref={bgVideoRef}
        crossOrigin="anonymous"
        playsInline
        muted
        loop
        onLoadedMetadata={handleBgLoadedMetadata}
        className="hidden"
      />
      <video
        ref={tabVideoRef}
        crossOrigin="anonymous"
        playsInline
        muted
        loop
        onLoadedMetadata={handleTabLoadedMetadata}
        className="hidden"
      />

      {/* Top Header */}
      <header className="h-14 border-b border-neutral-800 bg-neutral-950 px-4 sm:px-6 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-sky-600 via-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
            <Tablet className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm text-white">VideoTab Studio</span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30">
                3:4 Tab Mockup
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          {/* HD Screenshot */}
          <button
            onClick={handleCaptureScreenshot}
            className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white text-xs font-medium transition-all flex items-center space-x-1.5"
            title="Download HD Poster PNG"
          >
            <Camera className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Capture PNG</span>
          </button>

          {/* Export Video */}
          <button
            onClick={() => {
              setShowExportModal(true);
              setDownloadUrl(null);
              setExportProgress(null);
            }}
            className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-sky-600/20 transition-all flex items-center space-x-1.5 active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export 3:4 Video</span>
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Left / Center Canvas Preview Stage */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 bg-neutral-950/80 relative overflow-hidden">
          {/* Subtle Background Canvas Grid */}
          <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none"></div>

          {/* 3:4 Portrait Canvas Container */}
          <div
            className="relative shadow-2xl rounded-2xl overflow-hidden bg-black ring-1 ring-neutral-800 transition-all"
            style={{
              aspectRatio: '3 / 4',
              maxHeight: 'calc(100% - 10px)',
              height: '100%',
            }}
          >
            <canvas
              ref={canvasRef}
              width={1080}
              height={1440}
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Right Sidebar: Simple, Focused & Practical */}
        <div className="w-full md:w-88 lg:w-96 border-t md:border-t-0 md:border-l border-neutral-800 bg-neutral-950 p-5 overflow-y-auto custom-scrollbar space-y-5 shrink-0 z-10">
          
          {/* SECTION 1: Up Layer (Tab Content Video) */}
          <div className="space-y-3 bg-neutral-900/60 p-4 rounded-xl border border-neutral-800/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-sm shadow-sky-400 animate-pulse"></div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-white">
                  1. Up Video (Tab Content)
                </h3>
              </div>
              {state.tabVideoName && (
                <button
                  onClick={handleRemoveTabVideo}
                  className="text-neutral-500 hover:text-red-400 transition-colors p-1"
                  title="Remove video"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <p className="text-[11px] text-neutral-400">
              Plays inside the centered tab. Outer area is completely transparent.
            </p>

            {/* Tab Video Upload Dropzone */}
            <input
              ref={tabFileInputRef}
              type="file"
              accept="video/*"
              onChange={(e) => e.target.files?.[0] && handleTabFileUpload(e.target.files[0])}
              className="hidden"
            />

            <div
              onClick={() => tabFileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) handleTabFileUpload(file);
              }}
              className={`border-2 border-dashed rounded-xl p-3.5 text-center cursor-pointer transition-all group ${
                state.tabVideoName
                  ? 'border-sky-500/60 bg-sky-950/20 hover:bg-sky-950/30'
                  : 'border-neutral-700 hover:border-sky-500/80 bg-neutral-950/60 hover:bg-neutral-900/80'
              }`}
            >
              <Upload className="w-5 h-5 mx-auto text-neutral-400 group-hover:text-sky-400 transition-colors mb-1.5" />
              <p className="text-xs font-semibold text-neutral-200 group-hover:text-white">
                {state.tabVideoName ? 'Replace Tab Video' : 'Upload Tab Content Video'}
              </p>
              <p className="text-[10px] text-neutral-400 mt-0.5 truncate max-w-[240px] mx-auto font-mono">
                {state.tabVideoName || 'Click or drag video file here'}
              </p>
            </div>

            {/* Tab Sizing Slider */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs text-neutral-400">
                <span>Tab Size</span>
                <span className="font-mono text-sky-400">{Math.round(state.tabWidthScale * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.60"
                max="0.94"
                step="0.02"
                value={state.tabWidthScale}
                onChange={(e) => setState((p) => ({ ...p, tabWidthScale: parseFloat(e.target.value) }))}
                className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
            </div>

            {/* Corner Radius */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-neutral-400">
                <span>Corner Rounding</span>
                <span className="font-mono text-sky-400">{state.tabRadius}px</span>
              </div>
              <input
                type="range"
                min="8"
                max="36"
                step="2"
                value={state.tabRadius}
                onChange={(e) => setState((p) => ({ ...p, tabRadius: parseInt(e.target.value) }))}
                className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
            </div>
          </div>

          {/* SECTION 2: Down Layer (Background Video) */}
          <div className="space-y-3 bg-neutral-900/60 p-4 rounded-xl border border-neutral-800/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500"></div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-white">
                  2. Down Video (Background)
                </h3>
              </div>
              {state.bgVideoName && (
                <button
                  onClick={handleRemoveBgVideo}
                  className="text-neutral-500 hover:text-red-400 transition-colors p-1"
                  title="Remove video"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <p className="text-[11px] text-neutral-400">
              Fills the entire 3:4 background behind the floating tab.
            </p>

            {/* Background Video Upload Dropzone */}
            <input
              ref={bgFileInputRef}
              type="file"
              accept="video/*"
              onChange={(e) => e.target.files?.[0] && handleBgFileUpload(e.target.files[0])}
              className="hidden"
            />

            <div
              onClick={() => bgFileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) handleBgFileUpload(file);
              }}
              className={`border-2 border-dashed rounded-xl p-3.5 text-center cursor-pointer transition-all group ${
                state.bgVideoName
                  ? 'border-indigo-500/60 bg-indigo-950/20 hover:bg-indigo-950/30'
                  : 'border-neutral-700 hover:border-indigo-500/80 bg-neutral-950/60 hover:bg-neutral-900/80'
              }`}
            >
              <Upload className="w-5 h-5 mx-auto text-neutral-400 group-hover:text-indigo-400 transition-colors mb-1.5" />
              <p className="text-xs font-semibold text-neutral-200 group-hover:text-white">
                {state.bgVideoName ? 'Replace Background Video' : 'Upload Background Video'}
              </p>
              <p className="text-[10px] text-neutral-400 mt-0.5 truncate max-w-[240px] mx-auto font-mono">
                {state.bgVideoName || 'Click or drag video file here'}
              </p>
            </div>

            {/* Background Blur */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs text-neutral-400">
                <span>Background Blur</span>
                <span className="font-mono text-indigo-400">{state.bgBlur}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                step="1"
                value={state.bgBlur}
                onChange={(e) => setState((p) => ({ ...p, bgBlur: parseInt(e.target.value) }))}
                className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            {/* Dim / Darken */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-neutral-400">
                <span>Darken Background</span>
                <span className="font-mono text-indigo-400">{Math.round(state.bgDim * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.8"
                step="0.05"
                value={state.bgDim}
                onChange={(e) => setState((p) => ({ ...p, bgDim: parseFloat(e.target.value) }))}
                className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
          </div>

          {/* SECTION 3: Device Frame Style */}
          <div className="space-y-3 bg-neutral-900/60 p-4 rounded-xl border border-neutral-800/80">
            <h3 className="font-bold text-xs uppercase tracking-wider text-white">
              3. Frame & Bezel
            </h3>

            {/* Tablet Bezel Toggle */}
            <div className="flex items-center justify-between text-xs text-neutral-300">
              <span>Outer Tablet Bezel</span>
              <button
                onClick={() => setState((p) => ({ ...p, showTabletBezel: !p.showTabletBezel }))}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                  state.showTabletBezel ? 'bg-sky-600 text-white' : 'bg-neutral-800 text-neutral-400'
                }`}
              >
                {state.showTabletBezel ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Tab Style */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] text-neutral-400">Tab Style</span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'minimal-card', name: 'Clean Card' },
                  { id: 'safari-dark', name: 'Safari Header' },
                  { id: 'chrome-dark', name: 'Chrome Header' },
                  { id: 'frameless', name: 'Frameless' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setState((p) => ({ ...p, tabStyle: s.id as any }))}
                    className={`py-1.5 rounded-lg text-xs font-medium transition-all ${
                      state.tabStyle === s.id
                        ? 'bg-sky-600 text-white font-semibold'
                        : 'bg-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="font-bold text-base text-white">Export 3:4 Video</h3>
              <button
                onClick={() => setShowExportModal(false)}
                disabled={isExporting}
                className="p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!isExporting && !downloadUrl && (
              <div className="space-y-4">
                <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 text-xs space-y-1.5 text-neutral-300">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Resolution:</span>
                    <span className="font-mono text-white">1080 × 1440 (3:4 HD)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Framerate:</span>
                    <span className="font-mono text-white">60 FPS Lossless</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Audio:</span>
                    <span className="text-neutral-400 font-mono">None (Clean Silent Video)</span>
                  </div>
                </div>

                <button
                  onClick={handleStartExport}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-sky-600/30 flex items-center justify-center space-x-2 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Start Video Render</span>
                </button>
              </div>
            )}

            {isExporting && exportProgress && (
              <div className="py-6 text-center space-y-4">
                <Loader2 className="w-8 h-8 mx-auto text-sky-400 animate-spin" />
                <div>
                  <h4 className="font-bold text-sm text-white">Rendering 3:4 Composition...</h4>
                  <p className="text-xs text-neutral-400 mt-1">Merging tab video and background layer frame-by-frame</p>
                </div>
                <div className="w-full h-2.5 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-150"
                    style={{ width: `${exportProgress.progress}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-sky-400 font-bold">{exportProgress.progress}%</span>
              </div>
            )}

            {downloadUrl && (
              <div className="py-4 text-center space-y-4">
                <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400" />
                <div>
                  <h4 className="font-bold text-sm text-white">Render Completed!</h4>
                  <p className="text-xs text-neutral-400 mt-0.5">Your 3:4 video is ready.</p>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={handleDownloadExportedVideo}
                    className="py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center justify-center space-x-1.5 shadow-md shadow-sky-600/20"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </button>
                  <button
                    onClick={() => {
                      setDownloadUrl(null);
                      handleStartExport();
                    }}
                    className="py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold"
                  >
                    Render Again
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 bg-neutral-900 border border-neutral-700 text-white text-xs px-4 py-2.5 rounded-xl shadow-2xl flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
