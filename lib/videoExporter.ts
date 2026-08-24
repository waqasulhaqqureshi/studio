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
}

export class StudioVideoExporter {
  private isCancelled = false;
  private animId: number | null = null;
  private timerId: any = null;

  public cancel() {
    this.isCancelled = true;
    if (this.animId) cancelAnimationFrame(this.animId);
    if (this.timerId) clearTimeout(this.timerId);
  }

  public static getExpectedSizeMb(durationSeconds: number, compress: boolean): string {
    const dur = Math.max(2, durationSeconds || 10);
    // Bitrates: compressed = 4.0 Mbps, uncompressed = 14.0 Mbps
    const bitrateBps = compress ? 4000000 : 14000000;
    const bytes = (bitrateBps * dur) / 8;
    const mb = bytes / (1024 * 1024);
    return `~${mb.toFixed(1)} MB`;
  }

  public async exportVideo(
    state: StudioState,
    bgVideo: HTMLVideoElement | null,
    tabVideo: HTMLVideoElement | null,
    onProgress: (info: ExportProgress) => void
  ): Promise<{ blob: Blob; blobUrl: string; sizeMb: string; format: ExportFormat }> {
    this.isCancelled = false;

    return new Promise(async (resolve, reject) => {
      try {
        onProgress({ progress: 2, status: 'initializing' });

        const width = 1080;
        const height = 1440;
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = width;
        exportCanvas.height = height;

        const ctx = exportCanvas.getContext('2d', { alpha: false });
        if (!ctx) throw new Error('Canvas context could not be created');

        // Determine total duration
        let totalDuration = state.duration || 10;
        if (tabVideo && tabVideo.duration && !isNaN(tabVideo.duration) && tabVideo.duration > 0) {
          totalDuration = tabVideo.duration;
        } else if (bgVideo && bgVideo.duration && !isNaN(bgVideo.duration) && bgVideo.duration > 0) {
          totalDuration = bgVideo.duration;
        }
        totalDuration = Math.max(2, Math.min(300, totalDuration));

        // Codec & Format selection
        const requestedFormat = state.exportFormat || 'mp4';
        const isCompress = state.compressVideo !== false;
        const targetBitrate = isCompress ? 4200000 : 16000000;

        let mimeType = '';
        if (requestedFormat === 'mp4') {
          if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')) {
            mimeType = 'video/mp4;codecs=avc1';
          } else if (MediaRecorder.isTypeSupported('video/mp4')) {
            mimeType = 'video/mp4';
          }
        }

        if (!mimeType) {
          if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
            mimeType = 'video/webm;codecs=vp9';
          } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
            mimeType = 'video/webm;codecs=vp8';
          } else {
            mimeType = 'video/webm';
          }
        }

        // Capture stream at 60 FPS
        const canvasStream = exportCanvas.captureStream(60);

        const options: MediaRecorderOptions = {
          mimeType: mimeType || undefined,
          videoBitsPerSecond: targetBitrate,
        };

        const mediaRecorder = new MediaRecorder(canvasStream, options);
        const recordedChunks: Blob[] = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) recordedChunks.push(e.data);
        };

        // Reset and prepare video elements for 1:1 real-time playback
        if (bgVideo) {
          bgVideo.currentTime = 0;
          bgVideo.playbackRate = 1.0;
          bgVideo.muted = true;
          bgVideo.loop = true;
          await bgVideo.play().catch(() => {});
        }
        if (tabVideo) {
          tabVideo.currentTime = 0;
          tabVideo.playbackRate = 1.0;
          tabVideo.muted = true;
          tabVideo.loop = true;
          await tabVideo.play().catch(() => {});
        }

        const startTime = performance.now();
        mediaRecorder.start(100);

        onProgress({
          progress: 5,
          status: 'recording',
          elapsedSeconds: 0,
          totalSeconds: totalDuration,
        });

        // Exact 1:1 Normal Speed Real-Time Recording Loop
        const recordFrame = () => {
          if (this.isCancelled) {
            mediaRecorder.stop();
            if (bgVideo) bgVideo.pause();
            if (tabVideo) tabVideo.pause();
            reject(new Error('Export cancelled'));
            return;
          }

          const elapsedSec = (performance.now() - startTime) / 1000;

          if (elapsedSec >= totalDuration) {
            // Reached duration limit
            onProgress({
              progress: 96,
              status: 'encoding',
              elapsedSeconds: totalDuration,
              totalSeconds: totalDuration,
            });

            if (bgVideo) bgVideo.pause();
            if (tabVideo) tabVideo.pause();

            mediaRecorder.onstop = () => {
              const outputMime = mimeType.includes('mp4') ? 'video/mp4' : 'video/webm';
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
              });

              resolve({
                blob,
                blobUrl,
                sizeMb,
                format: outputMime.includes('mp4') ? 'mp4' : 'webm',
              });
            };

            mediaRecorder.stop();
            return;
          }

          // Render exact current timestamp
          renderStudioFrame({
            ctx,
            state,
            bgVideo,
            tabVideo,
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
    const ctx = canvas.getContext('2d');
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
