import { StudioProjectState } from './types';
import { renderStudioFrame } from './canvasRenderer';

export interface ExportProgress {
  progress: number; // 0 to 100
  currentTime: number;
  totalDuration: number;
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
    state: StudioProjectState,
    bgVideo: HTMLVideoElement | null,
    tabVideo: HTMLVideoElement | null,
    onProgress: (info: ExportProgress) => void
  ): Promise<{ blob: Blob; blobUrl: string }> {
    this.isCancelled = false;

    return new Promise(async (resolve, reject) => {
      try {
        onProgress({
          progress: 2,
          currentTime: 0,
          totalDuration: state.duration,
          status: 'initializing',
        });

        // 1. Create offline render canvas
        const exportCanvas = document.createElement('canvas');
        const exportWidth = state.canvasWidth || 1080;
        const exportHeight = state.canvasHeight || 1440;
        exportCanvas.width = exportWidth;
        exportCanvas.height = exportHeight;

        const ctx = exportCanvas.getContext('2d', { alpha: false });
        if (!ctx) {
          throw new Error('Failed to create canvas rendering context');
        }

        // 2. Prepare audio mixer stream
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
              bgGain.gain.value = state.background.isMuted ? 0 : state.background.volume;
              bgSrc.connect(bgGain);
              bgGain.connect(masterGain);
            } catch {}
          }

          if (tabVideo && !tabVideo.error) {
            try {
              const tabSrc = audioContext.createMediaElementSource(tabVideo);
              const tabGain = audioContext.createGain();
              tabGain.gain.value = state.tabMockup.isMuted ? 0 : state.tabMockup.volume;
              tabSrc.connect(tabGain);
              tabGain.connect(masterGain);
            } catch {}
          }

          audioStream = dest.stream;
        } catch (audioErr) {
          console.warn('Audio export fallback:', audioErr);
        }

        // 3. Set up MediaRecorder on canvas stream
        const canvasStream = exportCanvas.captureStream(60);
        const combinedStream = new MediaStream();

        canvasStream.getVideoTracks().forEach((track) => combinedStream.addTrack(track));
        if (audioStream) {
          audioStream.getAudioTracks().forEach((track) => combinedStream.addTrack(track));
        }

        // Determine best supported MIME type
        const mimeTypes = [
          'video/webm;codecs=vp9,opus',
          'video/webm;codecs=vp8,opus',
          'video/webm',
          'video/mp4;codecs=avc1',
          'video/mp4',
        ];
        let chosenMimeType = '';
        for (const mime of mimeTypes) {
          if (MediaRecorder.isTypeSupported(mime)) {
            chosenMimeType = mime;
            break;
          }
        }

        const options: MediaRecorderOptions = {
          mimeType: chosenMimeType || undefined,
          videoBitsPerSecond: 8000000, // 8 Mbps for crisp HD 1080x1440 quality
        };

        const mediaRecorder = new MediaRecorder(combinedStream, options);
        const recordedChunks: Blob[] = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            recordedChunks.push(event.data);
          }
        };

        const totalDuration = Math.max(1, state.duration);
        const targetFps = 30;
        const totalFrames = Math.ceil(totalDuration * targetFps);
        const timeStep = 1 / targetFps;

        // Reset video playheads
        if (bgVideo) {
          bgVideo.currentTime = 0;
          bgVideo.playbackRate = state.background.playbackSpeed || 1.0;
        }
        if (tabVideo) {
          tabVideo.currentTime = 0;
          tabVideo.playbackRate = state.tabMockup.playbackSpeed || 1.0;
        }

        mediaRecorder.start(200);

        onProgress({
          progress: 5,
          currentTime: 0,
          totalDuration,
          status: 'rendering',
        });

        // 4. Render loop
        let currentFrame = 0;

        const renderNextFrame = async () => {
          if (this.isCancelled) {
            mediaRecorder.stop();
            if (audioContext) audioContext.close().catch(() => {});
            reject(new Error('Export cancelled by user'));
            return;
          }

          const currentTime = currentFrame * timeStep;

          if (currentFrame >= totalFrames || currentTime >= totalDuration) {
            // Finished all frames
            onProgress({
              progress: 95,
              currentTime: totalDuration,
              totalDuration,
              status: 'encoding',
            });

            mediaRecorder.onstop = () => {
              const blob = new Blob(recordedChunks, {
                type: chosenMimeType || 'video/webm',
              });
              const blobUrl = URL.createObjectURL(blob);

              if (audioContext) audioContext.close().catch(() => {});

              onProgress({
                progress: 100,
                currentTime: totalDuration,
                totalDuration,
                status: 'completed',
                blobUrl,
                blobSize: blob.size,
              });

              resolve({ blob, blobUrl });
            };

            mediaRecorder.stop();
            return;
          }

          // Seek videos to currentTime
          const seekPromises: Promise<void>[] = [];

          if (bgVideo && bgVideo.duration) {
            const bgTime = state.background.loop
              ? currentTime % bgVideo.duration
              : Math.min(currentTime, bgVideo.duration);
            seekPromises.push(seekVideo(bgVideo, bgTime));
          }

          if (tabVideo && tabVideo.duration) {
            const tabTime = Math.min(currentTime, tabVideo.duration);
            seekPromises.push(seekVideo(tabVideo, tabTime));
          }

          await Promise.all(seekPromises);

          // Draw composed frame to canvas
          renderStudioFrame({
            ctx,
            state,
            bgVideo,
            tabVideo,
            time: currentTime,
            width: exportWidth,
            height: exportHeight,
          });

          currentFrame++;
          const progressPercent = Math.min(94, Math.round((currentFrame / totalFrames) * 90) + 5);

          onProgress({
            progress: progressPercent,
            currentTime,
            totalDuration,
            status: 'rendering',
          });

          // Schedule next frame with requestAnimationFrame or setTimeout
          requestAnimationFrame(renderNextFrame);
        };

        // Start frame pipeline
        renderNextFrame();
      } catch (err: any) {
        onProgress({
          progress: 0,
          currentTime: 0,
          totalDuration: state.duration,
          status: 'error',
          errorMessage: err.message || 'Export error occurred',
        });
        reject(err);
      }
    });
  }

  public captureStillFrame(
    state: StudioProjectState,
    bgVideo: HTMLVideoElement | null,
    tabVideo: HTMLVideoElement | null
  ): string {
    const canvas = document.createElement('canvas');
    const width = state.canvasWidth || 1080;
    const height = state.canvasHeight || 1440;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    renderStudioFrame({
      ctx,
      state,
      bgVideo,
      tabVideo,
      time: state.currentTime,
      width,
      height,
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

    const onSeeked = () => {
      video.removeEventListener('seeked', onSeeked);
      resolve();
    };

    video.addEventListener('seeked', onSeeked, { once: true });
    video.currentTime = time;

    // Timeout fallback in case seek event misses
    setTimeout(() => {
      video.removeEventListener('seeked', onSeeked);
      resolve();
    }, 150);
  });
}
