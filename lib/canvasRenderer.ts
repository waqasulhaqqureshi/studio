import { StudioState } from './types';

export interface RenderOptions {
  ctx: CanvasRenderingContext2D;
  state: StudioState;
  bgVideo: HTMLVideoElement | null;
  tabVideo: HTMLVideoElement | null;
  time: number;
  width: number;
  height: number;
}

export function renderStudioFrame({
  ctx,
  state,
  bgVideo,
  tabVideo,
  time,
  width,
  height,
}: RenderOptions) {
  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  const baseScale = width / 1080;
  const isBezel = state.showTabletBezel;

  // Screen area inside the tablet frame if bezel is enabled
  const bezelMargin = isBezel ? Math.round(44 * baseScale) : 0;
  const screenX = bezelMargin;
  const screenY = bezelMargin;
  const screenW = width - bezelMargin * 2;
  const screenH = height - bezelMargin * 2;
  const screenRadius = isBezel ? Math.round(36 * baseScale) : 0;

  // -------------------------------------------------------------
  // Outer Bezel Background (if tablet frame enabled)
  // -------------------------------------------------------------
  if (isBezel) {
    ctx.save();
    // Device body outer rounded rect
    drawRoundedRectPath(ctx, 0, 0, width, height, Math.round(52 * baseScale));
    ctx.fillStyle = '#0d0e12';
    ctx.fill();

    // Subtle device outer metallic edge
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 2 * baseScale;
    ctx.stroke();

    // Top Camera Dot
    ctx.fillStyle = '#1e222d';
    ctx.beginPath();
    ctx.arc(width / 2, 22 * baseScale, 4.5 * baseScale, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(width / 2, 22 * baseScale, 2 * baseScale, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Clip everything inside the screen area
  ctx.save();
  if (isBezel) {
    drawRoundedRectPath(ctx, screenX, screenY, screenW, screenH, screenRadius);
    ctx.clip();
  }

  // -------------------------------------------------------------
  // 1. LAYER 1: DOWN (BACKGROUND VIDEO LAYER)
  // -------------------------------------------------------------
  ctx.save();

  // Background blur filter
  if (state.bgBlur > 0) {
    ctx.filter = `blur(${state.bgBlur * baseScale}px)`;
  }

  let bgDrawn = false;
  if (bgVideo && bgVideo.readyState >= 2 && !bgVideo.error) {
    try {
      const vWidth = bgVideo.videoWidth || 1920;
      const vHeight = bgVideo.videoHeight || 1080;

      const hRatio = screenW / vWidth;
      const vRatio = screenH / vHeight;
      const ratio = Math.max(hRatio, vRatio) * 1.05; // slight zoom to prevent blur edge bleeding
      const drawW = vWidth * ratio;
      const drawH = vHeight * ratio;
      const drawX = screenX + (screenW - drawW) / 2;
      const drawY = screenY + (screenH - drawH) / 2;

      ctx.drawImage(bgVideo, drawX, drawY, drawW, drawH);
      bgDrawn = true;
    } catch {
      bgDrawn = false;
    }
  }

  if (!bgDrawn) {
    // Elegant warm dark background gradient matching the user's reference image
    const grad = ctx.createLinearGradient(screenX, screenY, screenX + screenW, screenY + screenH);
    grad.addColorStop(0, '#1c0c04');
    grad.addColorStop(0.35, '#2e1408');
    grad.addColorStop(0.7, '#140803');
    grad.addColorStop(1, '#080302');
    ctx.fillStyle = grad;
    ctx.fillRect(screenX, screenY, screenW, screenH);

    // Warm ambient glow circle in top-left
    const glow = ctx.createRadialGradient(
      screenX + screenW * 0.35,
      screenY + screenH * 0.25,
      0,
      screenX + screenW * 0.35,
      screenY + screenH * 0.25,
      screenW * 0.5
    );
    glow.addColorStop(0, 'rgba(234, 88, 12, 0.25)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(screenX, screenY, screenW, screenH);
  }

  ctx.restore();

  // Dark dim overlay on background
  if (state.bgDim > 0) {
    ctx.fillStyle = `rgba(0, 0, 0, ${state.bgDim})`;
    ctx.fillRect(screenX, screenY, screenW, screenH);
  }

  // -------------------------------------------------------------
  // 2. LAYER 2: UP (CENTERED TAB MOCKUP + CONTENT VIDEO)
  // Transparent everywhere except inside the tab!
  // -------------------------------------------------------------
  const tabW = Math.round(screenW * state.tabWidthScale);
  // Content video aspect ratio inside tab (~ 16:11 or 4:3)
  const tabH = Math.round(tabW * 0.72);

  const tabX = screenX + (screenW - tabW) / 2;
  const tabY = screenY + (screenH - tabH) / 2;
  const radius = Math.round(state.tabRadius * baseScale);

  ctx.save();

  // Draw Realistic Drop Shadow around the tab
  if (state.tabShadow === 'deep') {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
    ctx.shadowBlur = 48 * baseScale;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 22 * baseScale;
    drawRoundedRectPath(ctx, tabX, tabY, tabW, tabH, radius);
    ctx.fillStyle = '#000000';
    ctx.fill();
  } else if (state.tabShadow === 'soft') {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 24 * baseScale;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 12 * baseScale;
    drawRoundedRectPath(ctx, tabX, tabY, tabW, tabH, radius);
    ctx.fillStyle = '#000000';
    ctx.fill();
  }

  ctx.restore();

  // Draw Tab Content Area (Clipped to Rounded Rect)
  ctx.save();
  drawRoundedRectPath(ctx, tabX, tabY, tabW, tabH, radius);
  ctx.clip();

  // Tab Background (Black)
  ctx.fillStyle = '#000000';
  ctx.fillRect(tabX, tabY, tabW, tabH);

  let tabDrawn = false;
  if (tabVideo && tabVideo.readyState >= 2 && !tabVideo.error) {
    try {
      const vWidth = tabVideo.videoWidth || 1920;
      const vHeight = tabVideo.videoHeight || 1080;

      // Cover fill inside tab
      const hRatio = tabW / vWidth;
      const vRatio = tabH / vHeight;
      const ratio = Math.max(hRatio, vRatio);
      const drawW = vWidth * ratio;
      const drawH = vHeight * ratio;
      const drawX = tabX + (tabW - drawW) / 2;
      const drawY = tabY + (tabH - drawH) / 2;

      ctx.drawImage(tabVideo, drawX, drawY, drawW, drawH);
      tabDrawn = true;
    } catch {
      tabDrawn = false;
    }
  }

  if (!tabDrawn) {
    // Clean mock content matching the reference image ("Digitizing Biology to Transform All Omics")
    // Top light half
    const topH = tabH * 0.45;
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(tabX, tabY, tabW, topH);

    // Subtle header microtext
    ctx.fillStyle = '#64748b';
    ctx.font = `600 ${Math.floor(9 * baseScale)}px sans-serif`;
    ctx.fillText('RESEARCH & PIPELINE', tabX + 24 * baseScale, tabY + 28 * baseScale);
    ctx.fillText('MOLECULAR SENSING', tabX + tabW * 0.4, tabY + 28 * baseScale);
    ctx.fillText('CLINICAL SYNTHESIS', tabX + tabW * 0.72, tabY + 28 * baseScale);

    // Bottom dark half
    ctx.fillStyle = '#0a0a0c';
    ctx.fillRect(tabX, tabY + topH, tabW, tabH - topH);

    // Big Headline in bottom dark half
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.floor(26 * baseScale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillText('Digitizing Biology to Transform', tabX + 24 * baseScale, tabY + topH + 48 * baseScale);
    ctx.fillText('All Omics', tabX + 24 * baseScale, tabY + topH + 82 * baseScale);

    // Bottom micro footer
    ctx.fillStyle = '#52525b';
    ctx.font = `${Math.floor(10 * baseScale)}px sans-serif`;
    ctx.fillText('A UNIVERSAL PLATFORM', tabX + 24 * baseScale, tabY + tabH - 18 * baseScale);
  }

  // Header bar if Safari/Chrome style is enabled
  if (state.tabStyle === 'safari-dark' || state.tabStyle === 'chrome-dark') {
    const headerH = Math.round(34 * baseScale);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.fillRect(tabX, tabY, tabW, headerH);

    // Traffic light dots
    const dots = ['#ff5f56', '#ffbd2e', '#27c93f'];
    dots.forEach((color, i) => {
      ctx.beginPath();
      ctx.arc(tabX + 18 * baseScale + i * 14 * baseScale, tabY + headerH / 2, 4.5 * baseScale, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    });

    // Clean address bar in middle
    const pillW = tabW * 0.55;
    const pillH = 20 * baseScale;
    const pillX = tabX + (tabW - pillW) / 2;
    const pillY = tabY + (headerH - pillH) / 2;
    drawRoundedRectPath(ctx, pillX, pillY, pillW, pillH, 5 * baseScale);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fill();

    ctx.fillStyle = '#94a3b8';
    ctx.font = `500 ${Math.floor(10 * baseScale)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('studio.app/preview', tabX + tabW / 2, pillY + pillH * 0.72);
    ctx.textAlign = 'left';
  }

  ctx.restore();

  // Tab Border Outline
  if (state.tabBorder) {
    ctx.save();
    drawRoundedRectPath(ctx, tabX, tabY, tabW, tabH, radius);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5 * baseScale;
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore(); // restore screen clipping
}

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.arcTo(x + w, y, x + w, y + radius, radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius);
  ctx.lineTo(x + radius, y + h);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
}
