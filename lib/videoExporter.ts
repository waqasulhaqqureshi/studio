import { StudioState, ExportFormat } from './types';
import { renderStudioFrame } from './canvasRenderer';

export interface ExportProgress {
  progress: number;
  status: 'initializing' | 'recording' | 'encoding' | 'completed' | 'error';
  errorMessage?: string;
  blobUrl?: string;
  blobSizeMb?: string;
  elapsedSeconds?: number;
  totalSeconds?: number;
  hasAlpha?: boolean;
}

export class StudioVideoExporter {
  private isCancelled = false;
  private animId: number | null = null;
  private offscreenTabVideo: HTMLVideoElement | null = null;
  private offscreenBgVideo: HTMLVideoElement | null = null;

  public cancel() {
    this.isCancelled = true;
    if (this.animId) cancelAnimationFrame(this.animId);
    if (this.offscreenTabVideo) {
      this.offscreenTabVideo.pause();
      this.offscreenTabVideo.src = '';
    }
    if (this.offscreenBgVideo) {
      this.offscreenBgVideo.pause();
      this.offscreenBgVideo.src = '';
    }
  }

  public async exportVideo(
    state: StudioState,
    _uiBgVideo: HTMLVideoElement | null,
    _uiTabVideo: HTMLVideoElement | null,
    onProgress: (info: ExportProgress) => void
  ): Promise<{ blob: Blob; blobUrl: string; sizeMb: string; format: ExportFormat; hasAlpha: boolean }> {
    this.isCancelled = false;

    return new Promise(async (resolve, reject) => {
      try {
        onProgress({ progress: 2, status: 'initializing' });

        const width = 1080;
        const height = 1440;
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = width;
        exportCanvas.height = height;

        const isAlphaTransparent = !state.bgVideoUrl;
        const ctx = exportCanvas.getContext('2d', { alpha: true });
        if (!ctx) throw new Error('Canvas 2D context creation failed');

        // Dedicated Isolated Offscreen Videos
        const tabVid = document.createElement('video');
        tabVid.crossOrigin = 'anonymous';
        tabVid.playsInline = true;
        tabVid.muted = true;
        tabVid.loop = true;
        tabVid.preload = 'auto';
        this.offscreenTabVideo = tabVid;

        let bgVid: HTMLVideoElement | null = null;
        if (state.bgVideoUrl) {
          bgVid = document.createElement('video');
          bgVid.crossOrigin = 'anonymous';
          bgVid.playsInline = true;
          bgVid.muted = true;
          bgVid.loop = true;
          bgVid.preload = 'auto';
          this.offscreenBgVideo = bgVid;
        }

        const loadPromises: Promise<void>[] = [];

        if (state.tabVideoUrl) {
          tabVid.src = state.tabVideoUrl;
          loadPromises.push(
            new Promise((res) => {
              if (tabVid.readyState >= 2) res();
              else {
                tabVid.onloadeddata = () => res();
                tabVid.onerror = () => res();
              }
            })
          );
          tabVid.load();
        }

        if (bgVid && state.bgVideoUrl) {
          bgVid.src = state.bgVideoUrl;
          loadPromises.push(
            new Promise((res) => {
              if (bgVid!.readyState >= 2) res();
              else {
                bgVid!.onloadeddata = () => res();
                bgVid!.onerror = () => res();
              }
            })
          );
          bgVid.load();
        }

        await Promise.all(loadPromises);

        let totalDuration = state.duration || 10;
        if (tabVid.duration && !isNaN(tabVid.duration) && tabVid.duration > 0) {
          totalDuration = tabVid.duration;
        } else if (bgVid && bgVid.duration && !isNaN(bgVid.duration) && bgVid.duration > 0) {
          totalDuration = bgVid.duration;
        }
        totalDuration = Math.max(2, Math.min(300, totalDuration));

        // Format & Codec selection
        const requestedFormat = state.exportFormat || (isAlphaTransparent ? 'mov' : 'mp4');

        let mimeType = '';
        if (requestedFormat === 'mov') {
          if (MediaRecorder.isTypeSupported('video/quicktime')) {
            mimeType = 'video/quicktime';
          } else if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')) {
            mimeType = 'video/mp4;codecs=avc1';
          } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
            mimeType = 'video/webm;codecs=vp9';
          } else {
            mimeType = 'video/mp4';
          }
        } else if (requestedFormat === 'webm' || isAlphaTransparent) {
          if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
            mimeType = 'video/webm;codecs=vp9';
          } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
            mimeType = 'video/webm;codecs=vp8';
          } else {
            mimeType = 'video/webm';
          }
        } else {
          // mp4
          if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')) {
            mimeType = 'video/mp4;codecs=avc1';
          } else if (MediaRecorder.isTypeSupported('video/mp4')) {
            mimeType = 'video/mp4';
          } else {
            mimeType = 'video/webm;codecs=vp9';
          }
        }

        const canvasStream = exportCanvas.captureStream(60);
        const mediaRecorder = new MediaRecorder(canvasStream, {
          mimeType: mimeType || undefined,
          videoBitsPerSecond: 25000000, // 25 Mbps native uncompressed quality
        });

        const recordedChunks: Blob[] = [];
        mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) recordedChunks.push(e.data);
        };

        tabVid.currentTime = 0;
        tabVid.playbackRate = 1.0;
        await tabVid.play().catch(() => {});

        if (bgVid) {
          bgVid.currentTime = 0;
          bgVid.playbackRate = 1.0;
          await bgVid.play().catch(() => {});
        }

        const recordStartTime = performance.now();
        mediaRecorder.start(100);

        onProgress({
          progress: 5,
          status: 'recording',
          elapsedSeconds: 0,
          totalSeconds: totalDuration,
          hasAlpha: isAlphaTransparent,
        });

        const recordFrame = () => {
          if (this.isCancelled) {
            mediaRecorder.stop();
            tabVid.pause();
            if (bgVid) bgVid.pause();
            reject(new Error('Export cancelled'));
            return;
          }

          if (tabVid.paused && !tabVid.error && tabVid.src) {
            tabVid.play().catch(() => {});
          }
          if (bgVid && bgVid.paused && !bgVid.error && bgVid.src) {
            bgVid.play().catch(() => {});
          }

          const elapsedSec = (performance.now() - recordStartTime) / 1000;

          if (elapsedSec >= totalDuration) {
            onProgress({
              progress: 96,
              status: 'encoding',
              elapsedSeconds: totalDuration,
              totalSeconds: totalDuration,
              hasAlpha: isAlphaTransparent,
            });

            tabVid.pause();
            if (bgVid) bgVid.pause();

            mediaRecorder.onstop = () => {
              let outputMime = 'video/mp4';
              if (requestedFormat === 'mov') {
                outputMime = 'video/quicktime';
              } else if (requestedFormat === 'webm' || isAlphaTransparent) {
                outputMime = 'video/webm';
              } else {
                outputMime = 'video/mp4';
              }

              const blob = new Blob(recordedChunks, { type: outputMime });
              const blobUrl = URL.createObjectURL(blob);
              const sizeMb = (blob.size / (1024 * 1024)).toFixed(2) + ' MB';

              onProgress({
                progress: 100,
                status: 'completed',
                blobUrl,
                blobSizeMb: sizeMb,
                elapsedSeconds: totalDuration,
                totalSeconds: totalDuration,
                hasAlpha: isAlphaTransparent,
              });

              resolve({
                blob,
                blobUrl,
                sizeMb,
                format: requestedFormat,
                hasAlpha: isAlphaTransparent,
              });
            };

            mediaRecorder.stop();
            return;
          }

          renderStudioFrame({
            ctx,
            state,
            bgVideo: bgVid,
            tabVideo: tabVid,
            time: elapsedSec,
            width,
            height,
          });

          const currentPercent = Math.min(95, Math.round((elapsedSec / totalDuration) * 90) + 5);
          onProgress({
            progress: currentPercent,
            status: 'recording',
            elapsedSeconds: Math.round(elapsedSec * 10) / 10,
            totalSeconds: totalDuration,
            hasAlpha: isAlphaTransparent,
          });

          this.animId = requestAnimationFrame(recordFrame);
        };

        this.animId = requestAnimationFrame(recordFrame);
      } catch (err: any) {
        onProgress({ progress: 0, status: 'error', errorMessage: err.message });
        reject(err);
      }
    });
  }

  public captureStillFrame(
    state: StudioState,
    bgVideo: HTMLVideoElement | null,
    tabVideo: HTMLVideoElement | null
  ): string {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1440;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return '';

    renderStudioFrame({
      ctx,
      state,
      bgVideo,
      tabVideo,
      time: 0,
      width: 1080,
      height: 1440,
    });

    return canvas.toDataURL('image/png', 1.0);
  }
}
