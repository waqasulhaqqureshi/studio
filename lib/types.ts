export type AspectRatioType = '3:4' | '9:16' | '16:9' | '1:1';

export type TabStyleType = 
  | 'safari-dark'
  | 'safari-light'
  | 'chrome-dark'
  | 'chrome-light'
  | 'arc-glass'
  | 'minimal-glass'
  | 'retro-mac'
  | 'tablet-bezel';

export type ShadowPreset = 'none' | 'soft' | 'deep' | 'glow-purple' | 'glow-cyan' | 'glow-amber';
export type BorderPreset = 'none' | 'subtle' | 'glass' | 'neon-gradient' | 'solid-white' | 'solid-dark';
export type VideoFit = 'cover' | 'contain' | 'fill';

export interface BackgroundLayerConfig {
  videoUrl: string | null;
  fileName?: string;
  sourceType: 'upload' | 'preset' | 'recording';
  presetId?: string;
  blur: number; // 0 to 40 px
  opacity: number; // 0 to 1 (1 = fully visible)
  brightness: number; // 0 to 2 (1 = normal)
  contrast: number; // 0 to 2 (1 = normal)
  saturation: number; // 0 to 2 (1 = normal)
  scale: number; // 1 to 2
  fit: VideoFit;
  volume: number; // 0 to 1
  isMuted: boolean;
  loop: boolean;
  playbackSpeed: number;
  overlayGradient: 'none' | 'dark-vignette' | 'radial-glow' | 'top-bottom-fade' | 'cyber-mesh';
  solidColorFallback: string;
}

export interface TabMockupConfig {
  videoUrl: string | null;
  fileName?: string;
  sourceType: 'upload' | 'preset' | 'recording';
  presetId?: string;
  style: TabStyleType;
  tabTitle: string;
  tabUrl: string;
  showTabFavicon: boolean;
  showUrlBar: boolean;
  showWindowControls: boolean;
  borderRadius: number; // 4 to 40 px
  tabScale: number; // 0.5 to 1.0 (relative to canvas width)
  offsetX: number; // -200 to +200 px
  offsetY: number; // -200 to +200 px
  tilt3D: {
    enabled: boolean;
    rotateX: number; // -30 to 30 deg
    rotateY: number; // -30 to 30 deg
    perspective: number; // 800 to 2000
  };
  shadow: ShadowPreset;
  border: BorderPreset;
  videoFit: VideoFit;
  videoPadding: number; // 0 to 24 px
  volume: number; // 0 to 1
  isMuted: boolean;
  playbackSpeed: number;
}

export interface OverlayConfig {
  headline: {
    enabled: boolean;
    text: string;
    subtext: string;
    position: 'top' | 'bottom';
    badgeColor: string;
    textColor: string;
    fontSize: 'sm' | 'md' | 'lg' | 'xl';
  };
  watermark: {
    enabled: boolean;
    text: string;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    opacity: number;
  };
  progressBar: {
    enabled: boolean;
    color: string;
    height: number;
  };
}

export interface StudioProjectState {
  aspectRatio: AspectRatioType;
  canvasWidth: number;
  canvasHeight: number;
  duration: number; // max duration in seconds
  currentTime: number;
  isPlaying: boolean;
  masterVolume: number;
  background: BackgroundLayerConfig;
  tabMockup: TabMockupConfig;
  overlays: OverlayConfig;
  syncMode: 'sync-content' | 'sync-background' | 'custom-duration';
  customDurationSeconds: number;
}

export interface PresetTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  badge: string;
  config: Partial<StudioProjectState>;
  previewGradient: string;
}
