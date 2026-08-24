export interface StudioState {
  // Video sources
  tabVideoUrl: string | null;
  tabVideoName: string;
  bgVideoUrl: string | null;
  bgVideoName: string;

  // Playback
  isPlaying: boolean;
  currentTime: number;
  duration: number;

  // Up Layer (Tab Mockup)
  tabWidthScale: number; // 0.60 to 0.95 (default 0.78)
  tabRadius: number; // 8 to 36 px (default 18)
  tabShadow: 'deep' | 'soft' | 'none';
  tabBorder: boolean;
  tabVolume: number; // 0 to 1
  isTabMuted: boolean;
  tabStyle: 'minimal-card' | 'safari-dark' | 'chrome-dark' | 'frameless';

  // Down Layer (Background)
  bgBlur: number; // 0 to 30 px (default 4)
  bgDim: number; // 0 to 0.8 (default 0.25)
  bgVolume: number; // 0 to 1
  isBgMuted: boolean;

  // Global / Frame
  showTabletBezel: boolean; // Matches the reference iPad tablet mockup frame!
  masterVolume: number;
}
