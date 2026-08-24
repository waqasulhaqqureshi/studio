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
  // Clear full canvas with transparency
  ctx.clearRect(0, 0, width, height);

  const baseScale = width / 1080;
  const isBezel = state.showTabletBezel;

  // Tablet Device Outer Bezel & Screen Dimensions
  const outerPad = isBezel ? Math.round(12 * baseScale) : 0;
  const bezelThickness = isBezel ? Math.round(36 * baseScale) : 0;
  const screenX = outerPad + bezelThickness;
  const screenY = outerPad + bezelThickness;
  const screenW = width - (screenX * 2);
  const screenH = height - (screenY * 2);
  const screenRadius = isBezel ? Math.round(28 * baseScale) : 0;
  const outerRadius = isBezel ? Math.round(48 * baseScale) : 0;

  // -------------------------------------------------------------
  // 1. Device Outer Body Bezel
  // -------------------------------------------------------------
  if (isBezel) {
    ctx.save();
    // Device Body
    drawPerfectRoundedRect(
      ctx,
      outerPad,
      outerPad,
      width - outerPad * 2,
      height - outerPad * 2,
      outerRadius
    );
    ctx.fillStyle = '#0f1015';
    ctx.fill();

    // Metallic Outer Rim Highlight
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = 2 * baseScale;
    ctx.stroke();

    // Top Camera Dot
    ctx.fillStyle = '#1c1f26';
    ctx.beginPath();
    ctx.arc(width / 2, outerPad + bezelThickness / 2, 4.5 * baseScale, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0b0f19';
    ctx.beginPath();
    ctx.arc(width / 2, outerPad + bezelThickness / 2, 2 * baseScale, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // -------------------------------------------------------------
  // Clip to Screen Area
  // -------------------------------------------------------------
  ctx.save();
  if (isBezel) {
    drawPerfectRoundedRect(ctx, screenX, screenY, screenW, screenH, screenRadius);
    ctx.clip();
  }

  // -------------------------------------------------------------
  // 2. LAYER 1: DOWN (BACKGROUND VIDEO)
  // -------------------------------------------------------------
  ctx.save();

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
      const ratio = Math.max(hRatio, vRatio) * 1.08; // slight zoom so blur doesn't bleed edge
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
    // Elegant clean background placeholder
    const grad = ctx.createLinearGradient(screenX, screenY, screenX + screenW, screenY + screenH);
    grad.addColorStop(0, '#1e293b');
    grad.addColorStop(0.5, '#0f172a');
    grad.addColorStop(1, '#020617');
    ctx.fillStyle = grad;
    ctx.fillRect(screenX, screenY, screenW, screenH);

    // Subtle guide text on canvas if no video is loaded
    ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
    ctx.font = `600 ${Math.floor(22 * baseScale)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('⬇️ Upload Down Video (Background)', screenX + screenW / 2, screenY + screenH * 0.22);
  }

  ctx.restore();

  // Dim overlay
  if (state.bgDim > 0) {
    ctx.fillStyle = `rgba(0, 0, 0, ${state.bgDim})`;
    ctx.fillRect(screenX, screenY, screenW, screenH);
  }

  // -------------------------------------------------------------
  // 3. LAYER 2: UP (CENTERED TAB MOCKUP + CONTENT VIDEO)
  // -------------------------------------------------------------
  const tabW = Math.round(screenW * state.tabWidthScale);
  const tabH = Math.round(tabW * 0.72); // standard portrait card ratio
  const tabX = screenX + (screenW - tabW) / 2;
  const tabY = screenY + (screenH - tabH) / 2;
  const radius = Math.round(state.tabRadius * baseScale);

  // Drop Shadow
  if (state.tabShadow === 'deep') {
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = 48 * baseScale;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 24 * baseScale;
    drawPerfectRoundedRect(ctx, tabX, tabY, tabW, tabH, radius);
    ctx.fillStyle = '#000000';
    ctx.fill();
    ctx.restore();
  } else if (state.tabShadow === 'soft') {
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 24 * baseScale;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 12 * baseScale;
    drawPerfectRoundedRect(ctx, tabX, tabY, tabW, tabH, radius);
    ctx.fillStyle = '#000000';
    ctx.fill();
    ctx.restore();
  }

  // Clip Tab Content
  ctx.save();
  drawPerfectRoundedRect(ctx, tabX, tabY, tabW, tabH, radius);
  ctx.clip();

  // Tab Base Background
  ctx.fillStyle = '#000000';
  ctx.fillRect(tabX, tabY, tabW, tabH);

  let tabDrawn = false;
  if (tabVideo && tabVideo.readyState >= 2 && !tabVideo.error) {
    try {
      const vWidth = tabVideo.videoWidth || 1920;
      const vHeight = tabVideo.videoHeight || 1080;

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
    // Clean tab placeholder
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(tabX, tabY, tabW, tabH);

    ctx.fillStyle = '#f8fafc';
    ctx.font = `bold ${Math.floor(20 * baseScale)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('⬆️ Upload Up Video', tabX + tabW / 2, tabY + tabH / 2 - 8 * baseScale);

    ctx.fillStyle = '#64748b';
    ctx.font = `${Math.floor(13 * baseScale)}px sans-serif`;
    ctx.fillText('Content video will play inside this centered tab', tabX + tabW / 2, tabY + tabH / 2 + 18 * baseScale);
  }

  // Optional Safari / Chrome Header bar
  if (state.tabStyle === 'safari-dark' || state.tabStyle === 'chrome-dark') {
    const headerH = Math.round(34 * baseScale);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.fillRect(tabX, tabY, tabW, headerH);

    // Window Dots
    const dots = ['#ff5f56', '#ffbd2e', '#27c93f'];
    dots.forEach((color, i) => {
      ctx.beginPath();
      ctx.arc(tabX + 18 * baseScale + i * 14 * baseScale, tabY + headerH / 2, 4 * baseScale, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    });

    // Pill
    const pillW = tabW * 0.5;
    const pillH = 20 * baseScale;
    const pillX = tabX + (tabW - pillW) / 2;
    const pillY = tabY + (headerH - pillH) / 2;
    drawPerfectRoundedRect(ctx, pillX, pillY, pillW, pillH, 5 * baseScale);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fill();

    ctx.fillStyle = '#94a3b8';
    ctx.font = `500 ${Math.floor(10 * baseScale)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('tab-content.mp4', tabX + tabW / 2, pillY + pillH * 0.72);
  }

  ctx.restore();

  // Tab Border Outline
  if (state.tabBorder) {
    ctx.save();
    drawPerfectRoundedRect(ctx, tabX, tabY, tabW, tabH, radius);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.lineWidth = 1.5 * baseScale;
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore(); // Screen clip restore
}

/**
 * Mathematically perfect 4-corner arc rounded rectangle.
 * Prevents any line-glitches, corner tearing, or arcTo artifacts on HTML5 canvas.
 */
function drawPerfectRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  if (radius === 0) {
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.closePath();
    return;
  }

  ctx.beginPath();
  ctx.arc(x + radius, y + radius, radius, Math.PI, Math.PI * 1.5);
  ctx.arc(x + w - radius, y + radius, radius, Math.PI * 1.5, 0);
  ctx.arc(x + w - radius, y + h - radius, radius, 0, Math.PI * 0.5);
  ctx.arc(x + radius, y + h - radius, radius, Math.PI * 0.5, Math.PI);
  ctx.closePath();
}
