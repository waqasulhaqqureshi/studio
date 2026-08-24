import { StudioState } from './types';
import { renderStudioFrame } from './canvasRenderer';

export interface ExportProgress {
  progress: number;
  status: 'initializing' | 'rendering' | 'encoding' | 'completed' | 'error';
  errorMessage?: string;
  blobUrl?: string;
  blobSize?: number;
}

export class StudioVideoExporter {
  private isCancelled = false;

  public cancel() {
    this.isCancelled = true;
  }

  public async exportVideo(
    state: StudioState,
    bgVideo: HTMLVideoElement | null,
    tabVideo: HTMLVideoElement | null,
    onProgress: (info: ExportProgress) => void
  ): Promise<{ blob: Blob; blobUrl: string }> {
    this.isCancelled = false;

    return new Promise(async (resolve, reject) => {
      try {
        onProgress({ progress: 5, status: 'initializing' });

        const width = 1080;
        const height = 1440;
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = width;
        exportCanvas.height = height;

        const ctx = exportCanvas.getContext('2d', { alpha: false });
        if (!ctx) throw new Error('Canvas 2D context creation failed');

        // Prepare Audio Context & Mixer
        let audioStream: MediaStream | null = null;
        let audioContext: AudioContext | null = null;

        try {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          audioContext = new AudioCtx();
          const dest = audioContext.createMediaStreamDestination();
          const masterGain = audioContext.createGain();
          masterGain.gain.value = state.masterVolume;
          masterGain.connect(dest);

          if (bgVideo && !bgVideo.error) {
            try {
              const bgSrc = audioContext.createMediaElementSource(bgVideo);
              const bgGain = audioContext.createGain();
              bgGain.gain.value = state.isBgMuted ? 0 : state.bgVolume;
              bgSrc.connect(bgGain);
              bgGain.connect(masterGain);
            } catch {}
          }

          if (tabVideo && !tabVideo.error) {
            try {
              const tabSrc = audioContext.createMediaElementSource(tabVideo);
              const tabGain = audioContext.createGain();
              tabGain.gain.value = state.isTabMuted ? 0 : state.tabVolume;
              tabSrc.connect(tabGain);
              tabGain.connect(masterGain);
            } catch {}
          }

          audioStream = dest.stream;
        } catch (e) {
          console.warn('Audio mixer skipped:', e);
        }

        const canvasStream = exportCanvas.captureStream(60);
        const combinedStream = new MediaStream();
        canvasStream.getVideoTracks().forEach((t) => combinedStream.addTrack(t));
        if (audioStream) {
          audioStream.getAudioTracks().forEach((t) => combinedStream.addTrack(t));
        }

        const mimeTypes = [
          'video/webm;codecs=vp9,opus',
          'video/webm;codecs=vp8,opus',
          'video/webm',
          'video/mp4',
        ];
        let chosenMime = '';
        for (const m of mimeTypes) {
          if (MediaRecorder.isTypeSupported(m)) {
            chosenMime = m;
            break;
          }
        }

        const mediaRecorder = new MediaRecorder(combinedStream, {
          mimeType: chosenMime || undefined,
          videoBitsPerSecond: 8000000,
        });

        const recordedChunks: Blob[] = [];
        mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) recordedChunks.push(e.data);
        };

        const totalDuration = Math.max(2, state.duration || 10);
        const fps = 30;
        const totalFrames = Math.ceil(totalDuration * fps);
        const dt = 1 / fps;

        if (bgVideo) bgVideo.currentTime = 0;
        if (tabVideo) tabVideo.currentTime = 0;

        mediaRecorder.start(200);
        onProgress({ progress: 10, status: 'rendering' });

        let frame = 0;
        const renderLoop = async () => {
          if (this.isCancelled) {
            mediaRecorder.stop();
            if (audioContext) audioContext.close().catch(() => {});
            reject(new Error('Export cancelled'));
            return;
          }

          const t = frame * dt;

          if (frame >= totalFrames || t >= totalDuration) {
            onProgress({ progress: 95, status: 'encoding' });
            mediaRecorder.onstop = () => {
              const blob = new Blob(recordedChunks, { type: chosenMime || 'video/webm' });
              const blobUrl = URL.createObjectURL(blob);
              if (audioContext) audioContext.close().catch(() => {});

              onProgress({
                progress: 100,
                status: 'completed',
                blobUrl,
                blobSize: blob.size,
              });
              resolve({ blob, blobUrl });
            };
            mediaRecorder.stop();
            return;
          }

          const seeks: Promise<void>[] = [];
          if (bgVideo && bgVideo.duration) {
            seeks.push(seekVideo(bgVideo, t % bgVideo.duration));
          }
          if (tabVideo && tabVideo.duration) {
            seeks.push(seekVideo(tabVideo, Math.min(t, tabVideo.duration)));
          }

          await Promise.all(seeks);

          renderStudioFrame({
            ctx,
            state,
            bgVideo,
            tabVideo,
            time: t,
            width,
            height,
          });

          frame++;
          const percent = Math.min(94, Math.round((frame / totalFrames) * 85) + 10);
          onProgress({ progress: percent, status: 'rendering' });

          requestAnimationFrame(renderLoop);
        };

        renderLoop();
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
      time: state.currentTime,
      width: 1080,
      height: 1440,
    });

    return canvas.toDataURL('image/png', 1.0);
  }
}

function seekVideo(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve) => {
    if (Math.abs(video.currentTime - time) < 0.03) {
      resolve();
      return;
    }
    const onSeek = () => {
      video.removeEventListener('seeked', onSeek);
      resolve();
    };
    video.addEventListener('seeked', onSeek, { once: true });
    video.currentTime = time;
    setTimeout(() => {
      video.removeEventListener('seeked', onSeek);
      resolve();
    }, 150);
  });
}
