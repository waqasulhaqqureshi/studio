import { StudioState, MacOsFrameStyle } from './types';

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
  ctx.clearRect(0, 0, width, height);

  const baseScale = width / 1080;
  const isBezel = state.showTabletBezel;

  // Tablet Device Outer Bezel & Screen Dimensions
  const outerPad = isBezel ? Math.round(12 * baseScale) : 0;
  const bezelThickness = isBezel ? Math.round(36 * baseScale) : 0;
  const screenX = outerPad + bezelThickness;
  const screenY = outerPad + bezelThickness;
  const screenW = width - screenX * 2;
  const screenH = height - screenY * 2;
  const screenRadius = isBezel ? Math.round(28 * baseScale) : 0;
  const outerRadius = isBezel ? Math.round(48 * baseScale) : 0;

  // -------------------------------------------------------------
  // 1. Tablet Device Outer Bezel
  // -------------------------------------------------------------
  if (isBezel) {
    ctx.save();
    drawPerfectRoundedRect(
      ctx,
      outerPad,
      outerPad,
      width - outerPad * 2,
      height - outerPad * 2,
      outerRadius
    );
    ctx.fillStyle = '#0d0e12';
    ctx.fill();

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
  // 2. Screen Area Mask
  // -------------------------------------------------------------
  ctx.save();
  if (isBezel) {
    drawPerfectRoundedRect(ctx, screenX, screenY, screenW, screenH, screenRadius);
    ctx.clip();
  }

  // -------------------------------------------------------------
  // 3. LAYER 1: DOWN (BACKGROUND VIDEO)
  // -------------------------------------------------------------
  ctx.save();
  ctx.filter = `blur(${6 * baseScale}px)`; // Optimized default blur

  let bgDrawn = false;
  if (bgVideo && bgVideo.readyState >= 2 && !bgVideo.error) {
    try {
      const vWidth = bgVideo.videoWidth || 1920;
      const vHeight = bgVideo.videoHeight || 1080;

      const hRatio = screenW / vWidth;
      const vRatio = screenH / vHeight;
      const ratio = Math.max(hRatio, vRatio) * 1.08;
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
    const grad = ctx.createLinearGradient(screenX, screenY, screenX + screenW, screenY + screenH);
    grad.addColorStop(0, '#1e293b');
    grad.addColorStop(0.5, '#0f172a');
    grad.addColorStop(1, '#020617');
    ctx.fillStyle = grad;
    ctx.fillRect(screenX, screenY, screenW, screenH);

    ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
    ctx.font = `600 ${Math.floor(22 * baseScale)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('⬇️ Upload Down Video (Background)', screenX + screenW / 2, screenY + screenH * 0.22);
  }

  ctx.restore();

  // Subtle dark atmospheric overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
  ctx.fillRect(screenX, screenY, screenW, screenH);

  // -------------------------------------------------------------
  // 4. LAYER 2: UP (AUTHENTIC macOS TAB MOCKUP + CONTENT VIDEO)
  // -------------------------------------------------------------
  const tabW = Math.round(screenW * 0.78); // Ideal 78% golden proportion
  const headerH = Math.round(44 * baseScale);
  const contentH = Math.round(tabW * 0.62);
  const tabH = headerH + contentH;

  const tabX = screenX + (screenW - tabW) / 2;
  const tabY = screenY + (screenH - tabH) / 2;
  const radius = Math.round(18 * baseScale);

  // Deep realistic macOS Drop Shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.82)';
  ctx.shadowBlur = 48 * baseScale;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 24 * baseScale;
  drawPerfectRoundedRect(ctx, tabX, tabY, tabW, tabH, radius);
  ctx.fillStyle = '#000000';
  ctx.fill();
  ctx.restore();

  // Clip Entire Window
  ctx.save();
  drawPerfectRoundedRect(ctx, tabX, tabY, tabW, tabH, radius);
  ctx.clip();

  // Render specific macOS header style
  renderMacOsHeader(ctx, state.macFrameStyle, state.tabTitle, state.tabUrl, tabX, tabY, tabW, headerH, radius, baseScale);

  // Video Content Area
  const contentY = tabY + headerH;
  ctx.fillStyle = '#000000';
  ctx.fillRect(tabX, contentY, tabW, contentH);

  let tabDrawn = false;
  if (tabVideo && tabVideo.readyState >= 2 && !tabVideo.error) {
    try {
      const vWidth = tabVideo.videoWidth || 1920;
      const vHeight = tabVideo.videoHeight || 1080;

      const hRatio = tabW / vWidth;
      const vRatio = contentH / vHeight;
      const ratio = Math.max(hRatio, vRatio);
      const drawW = vWidth * ratio;
      const drawH = vHeight * ratio;
      const drawX = tabX + (tabW - drawW) / 2;
      const drawY = contentY + (contentH - drawH) / 2;

      ctx.drawImage(tabVideo, drawX, drawY, drawW, drawH);
      tabDrawn = true;
    } catch {
      tabDrawn = false;
    }
  }

  if (!tabDrawn) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(tabX, contentY, tabW, contentH);

    ctx.fillStyle = '#f8fafc';
    ctx.font = `bold ${Math.floor(19 * baseScale)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('⬆️ Upload Up Video', tabX + tabW / 2, contentY + contentH / 2 - 8 * baseScale);

    ctx.fillStyle = '#64748b';
    ctx.font = `${Math.floor(12 * baseScale)}px sans-serif`;
    ctx.fillText('Content video will play inside this macOS tab', tabX + tabW / 2, contentY + contentH / 2 + 18 * baseScale);
  }

  ctx.restore();

  // Window Outer Rim Highlight
  ctx.save();
  drawPerfectRoundedRect(ctx, tabX, tabY, tabW, tabH, radius);
  ctx.strokeStyle = state.macFrameStyle.includes('light')
    ? 'rgba(0, 0, 0, 0.15)'
    : 'rgba(255, 255, 255, 0.16)';
  ctx.lineWidth = 1.5 * baseScale;
  ctx.stroke();
  ctx.restore();

  ctx.restore(); // Screen clip restore
}

function renderMacOsHeader(
  ctx: CanvasRenderingContext2D,
  style: MacOsFrameStyle,
  title: string,
  url: string,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
  scale: number
) {
  const isLight = style === 'safari-sonoma-light';
  const isGlass = style === 'glass-frost-mac';

  // Header Background
  if (isLight) {
    ctx.fillStyle = '#e8ecf2';
  } else if (isGlass) {
    ctx.fillStyle = 'rgba(24, 28, 38, 0.85)';
  } else if (style === 'chrome-macos') {
    ctx.fillStyle = '#1f2024';
  } else {
    // safari-sonoma-dark & minimal-mac
    ctx.fillStyle = '#1e1f24';
  }
  ctx.fillRect(x, y, w, h);

  // Bottom Border Line
  ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x + w, y + h);
  ctx.stroke();

  // 1. macOS Traffic Lights (Red, Yellow, Green)
  const dotR = 5.5 * scale;
  const startX = x + 18 * scale;
  const centerY = y + h / 2;
  const spacing = 18 * scale;

  const dots = [
    { fill: '#ff5f57', stroke: '#e0443e' },
    { fill: '#febc2e', stroke: '#d89e24' },
    { fill: '#28c840', stroke: '#1aab29' },
  ];

  dots.forEach((dot, i) => {
    ctx.beginPath();
    ctx.arc(startX + i * spacing, centerY, dotR, 0, Math.PI * 2);
    ctx.fillStyle = dot.fill;
    ctx.fill();
    ctx.strokeStyle = dot.stroke;
    ctx.lineWidth = 0.5 * scale;
    ctx.stroke();
  });

  // 2. Window URL Bar or Tab Header
  if (style === 'minimal-mac') {
    // Centered Window Title
    ctx.fillStyle = isLight ? '#0f172a' : '#f8fafc';
    ctx.font = `600 ${Math.floor(13 * scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(title || 'Studio Tab', x + w / 2, centerY + 4 * scale);
  } else {
    // Safari / Chrome URL Pill
    const pillW = Math.min(w * 0.54, 460 * scale);
    const pillH = 24 * scale;
    const pillX = x + (w - pillW) / 2;
    const pillY = y + (h - pillH) / 2;

    drawPerfectRoundedRect(ctx, pillX, pillY, pillW, pillH, 6 * scale);
    ctx.fillStyle = isLight ? '#ffffff' : '#121316';
    ctx.fill();
    ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Lock Icon
    const lockX = pillX + 12 * scale;
    ctx.fillStyle = isLight ? '#64748b' : '#94a3b8';
    ctx.beginPath();
    ctx.arc(lockX, centerY - 2 * scale, 2.5 * scale, Math.PI, 0);
    ctx.stroke();
    ctx.fillRect(lockX - 3.5 * scale, centerY - 1 * scale, 7 * scale, 6 * scale);

    // Text inside URL Pill
    const text = url || title || 'studio.app/tab-view';
    ctx.font = `500 ${Math.floor(11 * scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillStyle = isLight ? '#334155' : '#cbd5e1';
    ctx.textAlign = 'left';
    ctx.fillText(text, lockX + 10 * scale, centerY + 4 * scale);
  }
}

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
