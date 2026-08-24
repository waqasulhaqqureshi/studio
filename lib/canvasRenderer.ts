import { StudioProjectState } from './types';
import { drawProceduralBackground } from './backgroundGenerators';

export interface RenderOptions {
  ctx: CanvasRenderingContext2D;
  state: StudioProjectState;
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
  // Clear entire frame
  ctx.clearRect(0, 0, width, height);

  // -------------------------------------------------------------
  // 1. LAYER 1: DOWN (BACKGROUND VIDEO LAYER)
  // -------------------------------------------------------------
  renderBackgroundLayer(ctx, state, bgVideo, time, width, height);

  // -------------------------------------------------------------
  // 2. LAYER 2: UP (TAB MOCKUP + CONTENT VIDEO LAYER)
  // Apart from the tab mockup bounding box, this layer is transparent!
  // -------------------------------------------------------------
  renderTabMockupLayer(ctx, state, tabVideo, time, width, height);

  // -------------------------------------------------------------
  // 3. LAYER 3: OVERLAYS (Headlines, Progress Bar, Watermark)
  // -------------------------------------------------------------
  renderOverlays(ctx, state, time, width, height);
}

function renderBackgroundLayer(
  ctx: CanvasRenderingContext2D,
  state: StudioProjectState,
  bgVideo: HTMLVideoElement | null,
  time: number,
  width: number,
  height: number
) {
  const bg = state.background;
  ctx.save();

  // Apply filters
  const filters: string[] = [];
  if (bg.blur > 0) filters.push(`blur(${bg.blur * (width / 1080)}px)`);
  if (bg.brightness !== 1) filters.push(`brightness(${bg.brightness})`);
  if (bg.contrast !== 1) filters.push(`contrast(${bg.contrast})`);
  if (bg.saturation !== 1) filters.push(`saturate(${bg.saturation})`);

  if (filters.length > 0) {
    ctx.filter = filters.join(' ');
  }

  ctx.globalAlpha = Math.max(0, Math.min(1, bg.opacity));

  let videoDrawn = false;
  if (bgVideo && bgVideo.readyState >= 2 && !bgVideo.error) {
    try {
      const vWidth = bgVideo.videoWidth || 1920;
      const vHeight = bgVideo.videoHeight || 1080;
      const scale = bg.scale || 1.0;

      if (bg.fit === 'cover') {
        const hRatio = (width / vWidth) * scale;
        const vRatio = (height / vHeight) * scale;
        const ratio = Math.max(hRatio, vRatio);
        const drawW = vWidth * ratio;
        const drawH = vHeight * ratio;
        const drawX = (width - drawW) / 2;
        const drawY = (height - drawH) / 2;

        ctx.drawImage(bgVideo, drawX, drawY, drawW, drawH);
        videoDrawn = true;
      } else if (bg.fit === 'contain') {
        const ratio = Math.min(width / vWidth, height / vHeight) * scale;
        const drawW = vWidth * ratio;
        const drawH = vHeight * ratio;
        const drawX = (width - drawW) / 2;
        const drawY = (height - drawH) / 2;

        // Fill background first
        ctx.fillStyle = bg.solidColorFallback || '#090a16';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(bgVideo, drawX, drawY, drawW, drawH);
        videoDrawn = true;
      } else {
        // fill
        ctx.drawImage(bgVideo, 0, 0, width, height);
        videoDrawn = true;
      }
    } catch {
      videoDrawn = false;
    }
  }

  if (!videoDrawn) {
    // Fallback procedural visualizer
    const presetId = bg.presetId || 'aurora-motion';
    drawProceduralBackground(ctx, presetId, width, height, time);
  }

  ctx.restore();

  // Post background gradients / overlays
  if (bg.overlayGradient && bg.overlayGradient !== 'none') {
    ctx.save();
    if (bg.overlayGradient === 'dark-vignette') {
      const radGrad = ctx.createRadialGradient(
        width / 2,
        height / 2,
        width * 0.25,
        width / 2,
        height / 2,
        width * 0.8
      );
      radGrad.addColorStop(0, 'rgba(0, 0, 0, 0.1)');
      radGrad.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
      ctx.fillStyle = radGrad;
      ctx.fillRect(0, 0, width, height);
    } else if (bg.overlayGradient === 'radial-glow') {
      const glowGrad = ctx.createRadialGradient(
        width / 2,
        height / 2,
        width * 0.1,
        width / 2,
        height / 2,
        width * 0.7
      );
      glowGrad.addColorStop(0, 'rgba(99, 102, 241, 0.25)');
      glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, width, height);
    } else if (bg.overlayGradient === 'top-bottom-fade') {
      const linGrad = ctx.createLinearGradient(0, 0, 0, height);
      linGrad.addColorStop(0, 'rgba(0, 0, 0, 0.6)');
      linGrad.addColorStop(0.2, 'rgba(0, 0, 0, 0.1)');
      linGrad.addColorStop(0.8, 'rgba(0, 0, 0, 0.1)');
      linGrad.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
      ctx.fillStyle = linGrad;
      ctx.fillRect(0, 0, width, height);
    } else if (bg.overlayGradient === 'cyber-mesh') {
      const linGrad = ctx.createLinearGradient(0, 0, width, height);
      linGrad.addColorStop(0, 'rgba(6, 182, 212, 0.15)');
      linGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.4)');
      linGrad.addColorStop(1, 'rgba(236, 72, 153, 0.2)');
      ctx.fillStyle = linGrad;
      ctx.fillRect(0, 0, width, height);
    }
    ctx.restore();
  }
}

function renderTabMockupLayer(
  ctx: CanvasRenderingContext2D,
  state: StudioProjectState,
  tabVideo: HTMLVideoElement | null,
  time: number,
  width: number,
  height: number
) {
  const tab = state.tabMockup;
  const baseScale = width / 1080;

  // Calculate tab dimensions
  const tabWidth = width * tab.tabScale;
  // Browser standard aspect ratio for the window content (e.g. 16:10 or 16:9 + header)
  const headerHeight = Math.round(52 * baseScale);
  const contentHeight = Math.round((tabWidth * 9) / 16);
  const tabHeight = headerHeight + contentHeight;

  // Center position + custom offsets
  const tabX = (width - tabWidth) / 2 + tab.offsetX * baseScale;
  const tabY = (height - tabHeight) / 2 + tab.offsetY * baseScale;
  const radius = Math.max(4, tab.borderRadius * baseScale);

  ctx.save();

  // Optional 3D tilt perspective transformation
  if (tab.tilt3D && tab.tilt3D.enabled) {
    const rotX = (tab.tilt3D.rotateX * Math.PI) / 180;
    const rotY = (tab.tilt3D.rotateY * Math.PI) / 180;
    ctx.translate(width / 2, height / 2);
    // Skew / scale simulation for 3D tilt
    ctx.transform(
      Math.cos(rotY),
      Math.sin(rotX) * 0.18,
      -Math.sin(rotY) * 0.18,
      Math.cos(rotX),
      0,
      0
    );
    ctx.translate(-width / 2, -height / 2);
  }

  // Draw Realistic Drop Shadows
  drawTabShadow(ctx, tab.shadow, tabX, tabY, tabWidth, tabHeight, radius, baseScale);

  // Tab Background Base
  drawRoundedRectPath(ctx, tabX, tabY, tabWidth, tabHeight, radius);
  const isLight = tab.style.includes('light');
  ctx.fillStyle = isLight ? '#f8fafc' : '#0f172a';
  ctx.fill();

  // -------------------------------------------------------------
  // Header Bar (Window controls, Tab pill, URL bar)
  // -------------------------------------------------------------
  renderTabHeader(ctx, tab, tabX, tabY, tabWidth, headerHeight, radius, baseScale, isLight);

  // -------------------------------------------------------------
  // Video Content Area (inside tab mockup)
  // -------------------------------------------------------------
  const contentX = tabX + tab.videoPadding * baseScale;
  const contentY = tabY + headerHeight;
  const contentW = tabWidth - tab.videoPadding * 2 * baseScale;
  const contentH = contentHeight - tab.videoPadding * baseScale;

  // Clip content area with bottom rounded corners
  ctx.save();
  drawBottomRoundedRectPath(
    ctx,
    tabX,
    contentY,
    tabWidth,
    contentHeight,
    radius
  );
  ctx.clip();

  // Dark screen background before video loads
  ctx.fillStyle = '#020617';
  ctx.fillRect(tabX, contentY, tabWidth, contentHeight);

  let videoRendered = false;
  if (tabVideo && tabVideo.readyState >= 2 && !tabVideo.error) {
    try {
      const vWidth = tabVideo.videoWidth || 1920;
      const vHeight = tabVideo.videoHeight || 1080;

      if (tab.videoFit === 'cover') {
        const ratio = Math.max(contentW / vWidth, contentH / vHeight);
        const drawW = vWidth * ratio;
        const drawH = vHeight * ratio;
        const drawX = contentX + (contentW - drawW) / 2;
        const drawY = contentY + (contentH - drawH) / 2;
        ctx.drawImage(tabVideo, drawX, drawY, drawW, drawH);
        videoRendered = true;
      } else if (tab.videoFit === 'contain') {
        const ratio = Math.min(contentW / vWidth, contentH / vHeight);
        const drawW = vWidth * ratio;
        const drawH = vHeight * ratio;
        const drawX = contentX + (contentW - drawW) / 2;
        const drawY = contentY + (contentH - drawH) / 2;
        ctx.drawImage(tabVideo, drawX, drawY, drawW, drawH);
        videoRendered = true;
      } else {
        ctx.drawImage(tabVideo, contentX, contentY, contentW, contentH);
        videoRendered = true;
      }
    } catch {
      videoRendered = false;
    }
  }

  if (!videoRendered) {
    // Dynamic interactive placeholder UI inside tab
    renderMockContentScreen(ctx, contentX, contentY, contentW, contentH, time, baseScale);
  }

  ctx.restore();

  // -------------------------------------------------------------
  // Tab Border Outline
  // -------------------------------------------------------------
  drawTabBorder(ctx, tab.border, tabX, tabY, tabWidth, tabHeight, radius, baseScale);

  ctx.restore();
}

function drawTabShadow(
  ctx: CanvasRenderingContext2D,
  shadow: string,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  scale: number
) {
  ctx.save();
  if (shadow === 'soft') {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 32 * scale;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 16 * scale;
    drawRoundedRectPath(ctx, x, y, w, h, r);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fill();
  } else if (shadow === 'deep') {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 55 * scale;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 30 * scale;
    drawRoundedRectPath(ctx, x, y, w, h, r);
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fill();
  } else if (shadow === 'glow-purple') {
    ctx.shadowColor = 'rgba(168, 85, 247, 0.65)';
    ctx.shadowBlur = 45 * scale;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 8 * scale;
    drawRoundedRectPath(ctx, x, y, w, h, r);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fill();
  } else if (shadow === 'glow-cyan') {
    ctx.shadowColor = 'rgba(6, 182, 212, 0.65)';
    ctx.shadowBlur = 45 * scale;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 8 * scale;
    drawRoundedRectPath(ctx, x, y, w, h, r);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fill();
  } else if (shadow === 'glow-amber') {
    ctx.shadowColor = 'rgba(245, 158, 11, 0.6)';
    ctx.shadowBlur = 45 * scale;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 8 * scale;
    drawRoundedRectPath(ctx, x, y, w, h, r);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fill();
  }
  ctx.restore();
}

function renderTabHeader(
  ctx: CanvasRenderingContext2D,
  tab: any,
  x: number,
  y: number,
  w: number,
  headerH: number,
  radius: number,
  scale: number,
  isLight: boolean
) {
  ctx.save();

  // Top rounded clipping for header background
  drawTopRoundedRectPath(ctx, x, y, w, headerH, radius);
  ctx.fillStyle = isLight ? '#f1f5f9' : '#1e293b';
  ctx.fill();

  // Subtle separator line below header
  ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y + headerH);
  ctx.lineTo(x + w, y + headerH);
  ctx.stroke();

  // 1. Window Controls (macOS Traffic lights)
  if (tab.showWindowControls !== false) {
    const dotRadius = 6 * scale;
    const startDotX = x + 20 * scale;
    const dotCenterY = y + headerH / 2;
    const dotSpacing = 18 * scale;

    if (tab.style === 'retro-mac') {
      // Square classic box
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(startDotX - dotRadius, dotCenterY - dotRadius, dotRadius * 2, dotRadius * 2);
      ctx.strokeStyle = '#64748b';
      ctx.strokeRect(startDotX - dotRadius, dotCenterY - dotRadius, dotRadius * 2, dotRadius * 2);
    } else {
      // Traffic lights: Red, Yellow, Green
      const dots = ['#ff5f56', '#ffbd2e', '#27c93f'];
      dots.forEach((color, i) => {
        ctx.beginPath();
        ctx.arc(startDotX + i * dotSpacing, dotCenterY, dotRadius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      });
    }
  }

  // 2. URL / Tab Bar in center
  const pillW = Math.min(w * 0.58, 480 * scale);
  const pillH = 30 * scale;
  const pillX = x + (w - pillW) / 2;
  const pillY = y + (headerH - pillH) / 2;
  const pillRadius = 8 * scale;

  if (tab.showUrlBar !== false) {
    drawRoundedRectPath(ctx, pillX, pillY, pillW, pillH, pillRadius);
    ctx.fillStyle = isLight ? '#ffffff' : '#0f172a';
    ctx.fill();
    ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Lock icon / Padlock
    const lockX = pillX + 14 * scale;
    const lockY = pillY + pillH / 2;
    ctx.fillStyle = isLight ? '#64748b' : '#94a3b8';
    ctx.beginPath();
    ctx.arc(lockX, lockY - 2 * scale, 3 * scale, Math.PI, 0);
    ctx.stroke();
    ctx.fillRect(lockX - 4 * scale, lockY - 1 * scale, 8 * scale, 7 * scale);

    // Tab URL / Title text
    const displayText = tab.tabUrl || tab.tabTitle || 'studio.app/preview';
    ctx.font = `500 ${Math.floor(13 * scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillStyle = isLight ? '#334155' : '#cbd5e1';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';

    // Truncate text if needed
    const maxTextW = pillW - 40 * scale;
    let textToDraw = displayText;
    if (ctx.measureText(textToDraw).width > maxTextW) {
      while (textToDraw.length > 5 && ctx.measureText(textToDraw + '...').width > maxTextW) {
        textToDraw = textToDraw.slice(0, -1);
      }
      textToDraw += '...';
    }
    ctx.fillText(textToDraw, lockX + 12 * scale, lockY);
  } else if (tab.tabTitle) {
    // Just tab title in header
    ctx.font = `600 ${Math.floor(14 * scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillStyle = isLight ? '#0f172a' : '#f8fafc';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(tab.tabTitle, x + w / 2, y + headerH / 2);
  }

  ctx.restore();
}

function drawTabBorder(
  ctx: CanvasRenderingContext2D,
  border: string,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  scale: number
) {
  if (border === 'none') return;

  ctx.save();
  drawRoundedRectPath(ctx, x, y, w, h, r);

  if (border === 'glass') {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5 * scale;
    ctx.stroke();
  } else if (border === 'subtle') {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1 * scale;
    ctx.stroke();
  } else if (border === 'neon-gradient') {
    const grad = ctx.createLinearGradient(x, y, x + w, y + h);
    grad.addColorStop(0, '#06b6d4');
    grad.addColorStop(0.5, '#a855f7');
    grad.addColorStop(1, '#ec4899');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2.5 * scale;
    ctx.stroke();
  } else if (border === 'solid-white') {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2 * scale;
    ctx.stroke();
  } else if (border === 'solid-dark') {
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2 * scale;
    ctx.stroke();
  }

  ctx.restore();
}

function renderMockContentScreen(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  t: number,
  scale: number
) {
  // Beautiful interactive mock dashboard screen
  ctx.fillStyle = '#0b0f19';
  ctx.fillRect(x, y, w, h);

  // Left sidebar
  const sidebarW = 60 * scale;
  ctx.fillStyle = '#070a12';
  ctx.fillRect(x, y, sidebarW, h);

  // Sidebar mock icons
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i === 1 ? '#6366f1' : '#334155';
    ctx.beginPath();
    ctx.arc(x + sidebarW / 2, y + 30 * scale + i * 36 * scale, 8 * scale, 0, Math.PI * 2);
    ctx.fill();
  }

  // Top header in content area
  const mainX = x + sidebarW + 20 * scale;
  const mainW = w - sidebarW - 40 * scale;

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.floor(18 * scale)}px sans-serif`;
  ctx.fillText('Project Dashboard Preview', mainX, y + 35 * scale);

  ctx.fillStyle = '#64748b';
  ctx.font = `${Math.floor(12 * scale)}px sans-serif`;
  ctx.fillText('Upload your Up Content Video in the sidebar to replace this preview', mainX, y + 54 * scale);

  // 3 Metric Cards
  const cardW = (mainW - 20 * scale) / 3;
  const cardH = 80 * scale;
  const cardY = y + 70 * scale;

  const cardGradients = [
    { title: 'Video Sync', val: '60 FPS 4K', color: '#38bdf8' },
    { title: 'Aspect Ratio', val: '3:4 Portrait', color: '#818cf8' },
    { title: 'Alpha Layer', val: '100% Clear', color: '#34d399' },
  ];

  cardGradients.forEach((card, i) => {
    const cx = mainX + i * (cardW + 10 * scale);
    drawRoundedRectPath(ctx, cx, cardY, cardW, cardH, 10 * scale);
    ctx.fillStyle = '#131c2e';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.stroke();

    ctx.fillStyle = card.color;
    ctx.font = `600 ${Math.floor(11 * scale)}px sans-serif`;
    ctx.fillText(card.title, cx + 12 * scale, cardY + 25 * scale);

    ctx.fillStyle = '#f8fafc';
    ctx.font = `bold ${Math.floor(16 * scale)}px sans-serif`;
    ctx.fillText(card.val, cx + 12 * scale, cardY + 52 * scale);
  });

  // Animated Chart preview
  const chartY = cardY + cardH + 20 * scale;
  const chartH = h - (chartY - y) - 25 * scale;
  if (chartH > 40) {
    drawRoundedRectPath(ctx, mainX, chartY, mainW, chartH, 12 * scale);
    ctx.fillStyle = '#111827';
    ctx.fill();

    // Animated wave graph
    ctx.beginPath();
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 3 * scale;
    const points = 24;
    for (let p = 0; p <= points; p++) {
      const px = mainX + 20 * scale + (p / points) * (mainW - 40 * scale);
      const py =
        chartY +
        chartH * 0.5 +
        Math.sin(t * 2 + p * 0.4) * (chartH * 0.25) +
        Math.cos(p * 0.7) * (chartH * 0.15);
      if (p === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
}

function renderOverlays(
  ctx: CanvasRenderingContext2D,
  state: StudioProjectState,
  time: number,
  width: number,
  height: number
) {
  const scale = width / 1080;
  const { headline, watermark, progressBar } = state.overlays;

  // 1. Headline Badge
  if (headline && headline.enabled && headline.text) {
    ctx.save();
    const isTop = headline.position === 'top';
    const badgeY = isTop ? height * 0.08 : height * 0.88;

    ctx.font = `800 ${Math.floor(28 * scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    const textW = ctx.measureText(headline.text).width;
    const padX = 28 * scale;
    const padY = 14 * scale;
    const badgeW = textW + padX * 2;
    const badgeH = 54 * scale;
    const badgeX = (width - badgeW) / 2;

    // Badge Background Pill
    drawRoundedRectPath(ctx, badgeX, badgeY, badgeW, badgeH, 27 * scale);
    ctx.fillStyle = headline.badgeColor || '#6366f1';
    ctx.shadowColor = headline.badgeColor || '#6366f1';
    ctx.shadowBlur = 24 * scale;
    ctx.fill();

    // Badge Text
    ctx.shadowBlur = 0;
    ctx.fillStyle = headline.textColor || '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(headline.text, width / 2, badgeY + badgeH / 2);

    // Subtext if any
    if (headline.subtext) {
      ctx.font = `500 ${Math.floor(16 * scale)}px sans-serif`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillText(headline.subtext, width / 2, badgeY + (isTop ? badgeH + 24 * scale : -16 * scale));
    }
    ctx.restore();
  }

  // 2. Watermark
  if (watermark && watermark.enabled && watermark.text) {
    ctx.save();
    ctx.globalAlpha = watermark.opacity || 0.6;
    ctx.font = `bold ${Math.floor(16 * scale)}px sans-serif`;
    ctx.fillStyle = '#ffffff';

    const m = 36 * scale;
    let wx = width - m;
    let wy = height - m;
    let align: CanvasTextAlign = 'right';

    if (watermark.position === 'top-left') {
      wx = m;
      wy = m + 20 * scale;
      align = 'left';
    } else if (watermark.position === 'top-right') {
      wx = width - m;
      wy = m + 20 * scale;
      align = 'right';
    } else if (watermark.position === 'bottom-left') {
      wx = m;
      wy = height - m;
      align = 'left';
    }

    ctx.textAlign = align;
    ctx.fillText(watermark.text, wx, wy);
    ctx.restore();
  }

  // 3. Bottom Progress Bar
  if (progressBar && progressBar.enabled && state.duration > 0) {
    const progress = Math.min(1, Math.max(0, time / state.duration));
    const barH = (progressBar.height || 4) * scale;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(0, height - barH, width, barH);

    ctx.fillStyle = progressBar.color || '#6366f1';
    ctx.fillRect(0, height - barH, width * progress, barH);
  }
}

// Helper drawing paths
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
  ctx.arcTo(x, y + h, x, y + h - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
}

function drawTopRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.arcTo(x + w, y, x + w, y + radius, radius);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
}

function drawBottomRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + h - radius);
  ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius);
  ctx.lineTo(x + radius, y + h);
  ctx.arcTo(x, y + h, x, y + h - radius, radius);
  ctx.lineTo(x, y);
  ctx.closePath();
}
