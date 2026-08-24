'use client';

import React, { useState, useRef, useEffect } from 'react';
import { StudioProjectState } from '@/lib/types';
import { StudioVideoExporter, ExportProgress } from '@/lib/videoExporter';
import { 
  X, 
  Download, 
  Film, 
  Sparkles, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Camera, 
  Play,
  RotateCcw
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: StudioProjectState;
  bgVideo: HTMLVideoElement | null;
  tabVideo: HTMLVideoElement | null;
  onCaptureScreenshot: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  state,
  bgVideo,
  tabVideo,
  onCaptureScreenshot,
}) => {
  const [resolution, setResolution] = useState<'1080x1440' | '720x960'>('1080x1440');
  const [isExporting, setIsExporting] = useState(false);
  const [progressInfo, setProgressInfo] = useState<ExportProgress | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [fileSizeMb, setFileSizeMb] = useState<string | null>(null);

  const exporterRef = useRef<StudioVideoExporter | null>(null);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [downloadUrl]);

  if (!isOpen) return null;

  const handleStartExport = async () => {
    setIsExporting(true);
    setDownloadUrl(null);
    setFileSizeMb(null);

    const [w, h] = resolution.split('x').map(Number);
    const exportState: StudioProjectState = {
      ...state,
      canvasWidth: w,
      canvasHeight: h,
    };

    const exporter = new StudioVideoExporter();
    exporterRef.current = exporter;

    try {
      const result = await exporter.exportVideo(
        exportState,
        bgVideo,
        tabVideo,
        (progress) => {
          setProgressInfo(progress);
        }
      );

      setDownloadUrl(result.blobUrl);
      if (result.blob.size) {
        setFileSizeMb((result.blob.size / (1024 * 1024)).toFixed(2));
      }
      setIsExporting(false);
    } catch (err: any) {
      console.error('Export failed:', err);
      setIsExporting(false);
      setProgressInfo({
        progress: 0,
        currentTime: 0,
        totalDuration: state.duration,
        status: 'error',
        errorMessage: err.message || 'Export could not be completed',
      });
    }
  };

  const handleCancelExport = () => {
    if (exporterRef.current) {
      exporterRef.current.cancel();
      setIsExporting(false);
      setProgressInfo(null);
    }
  };

  const handleDownloadFile = () => {
    if (!downloadUrl) return;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `tab-studio-mockup-${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Export Studio Video</h2>
              <p className="text-xs text-neutral-400">
                Render composite 3:4 video with transparent mockup tab and synced audio
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
          {/* Resolution Options */}
          {!isExporting && !downloadUrl && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                  Select Export Resolution
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setResolution('1080x1440')}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      resolution === '1080x1440'
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-500/10'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-white">1080 × 1440</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold">
                        HD 3:4
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400">
                      Best quality for TikTok, Instagram Reels, and LinkedIn
                    </p>
                  </button>

                  <button
                    onClick={() => setResolution('720x960')}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      resolution === '720x960'
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-500/10'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-white">720 × 960</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 font-semibold">
                        Fast 3:4
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400">
                      Faster rendering and smaller file size for rapid previews
                    </p>
                  </button>
                </div>
              </div>

              {/* Video Specs Summary */}
              <div className="bg-neutral-950/80 rounded-xl p-3.5 border border-neutral-800/80 space-y-2 text-xs">
                <div className="flex justify-between text-neutral-400">
                  <span>Composition Duration:</span>
                  <span className="text-white font-mono">{state.duration.toFixed(1)}s</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Aspect Ratio:</span>
                  <span className="text-white font-mono">{state.aspectRatio} (Portrait)</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Down Layer (Background):</span>
                  <span className="text-cyan-300 truncate max-w-[200px]">
                    {state.background.fileName || 'Animated Preset Motion'}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Up Layer (Tab Mockup):</span>
                  <span className="text-indigo-300 truncate max-w-[200px]">
                    {state.tabMockup.fileName || 'Interactive Demo Screen'}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Audio Tracks:</span>
                  <span className="text-emerald-400">
                    {state.tabMockup.isMuted && state.background.isMuted ? 'Muted' : 'Stereo Mixed'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Rendering Progress View */}
          {isExporting && progressInfo && (
            <div className="space-y-4 py-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 mx-auto flex items-center justify-center text-indigo-400">
                <Loader2 className="w-7 h-7 animate-spin" />
              </div>

              <div>
                <h3 className="text-base font-bold text-white">Rendering 3:4 Composition</h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Compositing transparent mockup tab over background video frame-by-frame...
                </p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="w-full h-3 bg-neutral-800 rounded-full overflow-hidden p-0.5 border border-neutral-700">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-pink-500 rounded-full transition-all duration-150"
                    style={{ width: `${progressInfo.progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs font-mono text-neutral-400">
                  <span>{progressInfo.status.toUpperCase()}</span>
                  <span className="text-white font-bold">{progressInfo.progress}%</span>
                </div>
              </div>

              <button
                onClick={handleCancelExport}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition-all"
              >
                Cancel Export
              </button>
            </div>
          )}

          {/* Render Completed View */}
          {downloadUrl && (
            <div className="space-y-4 py-2 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 mx-auto flex items-center justify-center text-emerald-400">
                <CheckCircle className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-base font-bold text-white">Render Completed Successfully!</h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Your 3:4 video is ready to download {fileSizeMb ? `(${fileSizeMb} MB)` : ''}.
                </p>
              </div>

              {/* Video Preview Player */}
              <div className="rounded-xl overflow-hidden border border-neutral-800 max-h-56 bg-black flex items-center justify-center shadow-lg">
                <video
                  src={downloadUrl}
                  controls
                  autoPlay
                  loop
                  className="max-h-56 w-auto object-contain"
                />
              </div>

              {/* Download Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleDownloadFile}
                  className="py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/30 flex items-center justify-center space-x-2 transition-all hover:scale-[1.02]"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Video</span>
                </button>

                <button
                  onClick={() => {
                    setDownloadUrl(null);
                    handleStartExport();
                  }}
                  className="py-3 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center justify-center space-x-2 transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Render Again</span>
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {progressInfo?.status === 'error' && (
            <div className="p-4 rounded-xl bg-red-950/50 border border-red-500/50 text-red-200 text-xs flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Export Error</p>
                <p className="text-neutral-300 mt-0.5">{progressInfo.errorMessage}</p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {!isExporting && !downloadUrl && (
          <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between">
            <button
              onClick={onCaptureScreenshot}
              className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 text-xs font-medium transition-all flex items-center space-x-1.5"
            >
              <Camera className="w-4 h-4 text-cyan-400" />
              <span>HD Still Poster (PNG)</span>
            </button>

            <div className="flex items-center space-x-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-neutral-400 hover:text-white text-xs font-medium transition-all"
              >
                Close
              </button>

              <button
                onClick={handleStartExport}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/30 transition-all flex items-center space-x-2 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Sparkles className="w-4 h-4" />
                <span>Start Render</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
