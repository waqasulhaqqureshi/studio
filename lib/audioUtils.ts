// Web Audio API mixer for dual-layer video tracks

export class DualVideoAudioMixer {
  private audioCtx: AudioContext | null = null;
  private bgSource: MediaElementAudioSourceNode | null = null;
  private tabSource: MediaElementAudioSourceNode | null = null;
  private bgGain: GainNode | null = null;
  private tabGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private destination: MediaStreamAudioDestinationNode | null = null;
  private isInitialized = false;

  public init(bgVideo: HTMLVideoElement, tabVideo: HTMLVideoElement) {
    if (this.isInitialized) return;

    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();

      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.value = 1.0;

      this.destination = this.audioCtx.createMediaStreamDestination();
      this.masterGain.connect(this.destination);
      this.masterGain.connect(this.audioCtx.destination);

      // Connect Background Video
      try {
        this.bgSource = this.audioCtx.createMediaElementSource(bgVideo);
        this.bgGain = this.audioCtx.createGain();
        this.bgGain.gain.value = 0.3;
        this.bgSource.connect(this.bgGain);
        this.bgGain.connect(this.masterGain);
      } catch (err) {
        console.warn('Could not connect background audio source (might already be connected):', err);
      }

      // Connect Tab Mockup Content Video
      try {
        this.tabSource = this.audioCtx.createMediaElementSource(tabVideo);
        this.tabGain = this.audioCtx.createGain();
        this.tabGain.gain.value = 1.0;
        this.tabSource.connect(this.tabGain);
        this.tabGain.connect(this.masterGain);
      } catch (err) {
        console.warn('Could not connect tab video audio source:', err);
      }

      this.isInitialized = true;
    } catch (e) {
      console.warn('Audio Context initialization deferred:', e);
    }
  }

  public setVolumes(bgVolume: number, tabVolume: number, masterVolume: number) {
    if (this.bgGain && this.audioCtx) {
      this.bgGain.gain.setValueAtTime(bgVolume, this.audioCtx.currentTime);
    }
    if (this.tabGain && this.audioCtx) {
      this.tabGain.gain.setValueAtTime(tabVolume, this.audioCtx.currentTime);
    }
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setValueAtTime(masterVolume, this.audioCtx.currentTime);
    }
  }

  public getMixedAudioStream(): MediaStream | null {
    if (this.destination) {
      return this.destination.stream;
    }
    return null;
  }

  public resume() {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public close() {
    if (this.audioCtx) {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
      this.isInitialized = false;
    }
  }
}
