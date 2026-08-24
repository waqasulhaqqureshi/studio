export interface StudioState {
  // Video sources
  tabVideoUrl: string | null;
  tabVideoName: string;
  bgVideoUrl: string | null;
  bgVideoName: string;

  // Up Layer (Tab Mockup)
  tabWidthScale: number; // 0.60 to 0.95 (default 0.76)
  tabRadius: number; // 8 to 36 px (default 18)
  tabShadow: 'deep' | 'soft' | 'none';
  tabBorder: boolean;
  tabStyle: 'minimal-card' | 'safari-dark' | 'chrome-dark' | 'frameless';

  // Down Layer (Background)
  bgBlur: number; // 0 to 30 px (default 6)
  bgDim: number; // 0 to 0.8 (default 0.15)

  // Global / Frame
  showTabletBezel: boolean;
  duration: number;
  currentTime: number;
}
