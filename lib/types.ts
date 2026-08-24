export type MacOsFrameStyle = 
  | 'safari-sonoma-dark'
  | 'safari-sonoma-light'
  | 'chrome-macos'
  | 'glass-frost-mac'
  | 'minimal-mac';

export type TabAnimationType = 
  | '3d-flip-h'      // 3D Horizontal Flip
  | '3d-flip-v'      // 3D Vertical Flip
  | 'floating-wave'  // Smooth Floating & Tilt Drift
  | 'pulse-bounce'   // Rhythmic Scale Pulse
  | 'slide-snap'     // Horizontal Slide & Snap
  | 'spin-360'       // 360 Spin Snap
  | 'none';          // Static Centered

export type TabAspectRatio = '16:9' | '4:3' | '1:1' | '9:16' | 'auto';
export type ExportFormat = 'mp4' | 'webm' | 'mov';

export interface StudioState {
  // Video sources
  tabVideoUrl: string | null;
  tabVideoName: string;
  bgVideoUrl: string | null;
  bgVideoName: string;

  // macOS Tab Frame Style & Sizing
  macFrameStyle: MacOsFrameStyle;
  tabTitle: string;
  tabUrl: string;
  tabAspectRatio: TabAspectRatio;
  tabScale: number;

  // Tab Movement & Flip Animation
  animationType: TabAnimationType;
  flipInterval: number;
  animationSpeed: number;

  // Device Bezel
  showTabletBezel: boolean;

  // Playback & Export
  duration: number;
  currentTime: number;
  isExporting: boolean;

  // Export Settings
  exportFormat: ExportFormat;
}
