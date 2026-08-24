export type MacOsFrameStyle = 
  | 'safari-sonoma-dark'
  | 'safari-sonoma-light'
  | 'chrome-macos'
  | 'glass-frost-mac'
  | 'minimal-mac';

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

  // Device Bezel
  showTabletBezel: boolean;

  // Playback & Export
  duration: number;
  currentTime: number;
  isExporting: boolean;
}
