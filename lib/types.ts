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

export interface StudioState {
  // Video sources
  tabVideoUrl: string | null;
  tabVideoName: string;
  bgVideoUrl: string | null;
  bgVideoName: string;

  // macOS Tab Frame Style
  macFrameStyle: MacOsFrameStyle;
  tabTitle: string;
  tabUrl: string;

  // Tab Movement & Flip Animation
  animationType: TabAnimationType;
  flipInterval: number; // in seconds (e.g. 3s, range 1 to 10s)
  animationSpeed: number; // 0.5x to 2x (default 1.0)

  // Device Bezel
  showTabletBezel: boolean;

  // Playback & Export
  duration: number;
  currentTime: number;
  isExporting: boolean;
}
