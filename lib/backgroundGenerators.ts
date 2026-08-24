// Procedural background visualizers for canvas when no external video file is provided, or as live presets

export function drawProceduralBackground(
  ctx: CanvasRenderingContext2D,
  presetId: string,
  width: number,
  height: number,
  timeSeconds: number
) {
  switch (presetId) {
    case 'cyber-grid':
      drawCyberGrid(ctx, width, height, timeSeconds);
      break;
    case 'starfield-particles':
      drawStarfield(ctx, width, height, timeSeconds);
      break;
    case 'tech-code-stream':
      drawCodeStream(ctx, width, height, timeSeconds);
      break;
    case 'bokeh-ambient':
      drawBokeh(ctx, width, height, timeSeconds);
      break;
    case 'aurora-motion':
    default:
      drawAuroraWaves(ctx, width, height, timeSeconds);
      break;
  }
}

function drawAuroraWaves(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  // Base dark gradient
  const bgGrad = ctx.createLinearGradient(0, 0, w, h);
  bgGrad.addColorStop(0, '#090a16');
  bgGrad.addColorStop(0.5, '#0b0f24');
  bgGrad.addColorStop(1, '#050711');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // Moving blobs
  const blobs = [
    { x: w * (0.3 + 0.25 * Math.sin(t * 0.7)), y: h * (0.3 + 0.2 * Math.cos(t * 0.5)), r: w * 0.45, c1: 'rgba(99, 102, 241, 0.45)', c2: 'rgba(99, 102, 241, 0)' },
    { x: w * (0.7 + 0.2 * Math.cos(t * 0.6)), y: h * (0.6 + 0.25 * Math.sin(t * 0.8)), r: w * 0.5, c1: 'rgba(236, 72, 153, 0.4)', c2: 'rgba(236, 72, 153, 0)' },
    { x: w * (0.5 + 0.3 * Math.sin(t * 0.4 + 2)), y: h * (0.8 + 0.15 * Math.cos(t * 0.9)), r: w * 0.4, c1: 'rgba(56, 189, 248, 0.35)', c2: 'rgba(56, 189, 248, 0)' },
    { x: w * (0.2 + 0.15 * Math.cos(t * 0.8 + 1)), y: h * (0.8 + 0.2 * Math.sin(t * 0.6)), r: w * 0.35, c1: 'rgba(168, 85, 247, 0.4)', c2: 'rgba(168, 85, 247, 0)' },
  ];

  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (const b of blobs) {
    const radGrad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
    radGrad.addColorStop(0, b.c1);
    radGrad.addColorStop(1, b.c2);
    ctx.fillStyle = radGrad;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawCyberGrid(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  ctx.fillStyle = '#05070e';
  ctx.fillRect(0, 0, w, h);

  // Horizon at 40% height
  const horizonY = h * 0.4;
  const numLines = 24;
  const speed = (t * 120) % 80;

  // Sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
  skyGrad.addColorStop(0, '#0f172a');
  skyGrad.addColorStop(1, '#1e1b4b');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, horizonY);

  // Distant glowing sun
  const sunGrad = ctx.createRadialGradient(w * 0.5, horizonY, 0, w * 0.5, horizonY, w * 0.3);
  sunGrad.addColorStop(0, 'rgba(236, 72, 153, 0.6)');
  sunGrad.addColorStop(0.5, 'rgba(147, 51, 234, 0.2)');
  sunGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = sunGrad;
  ctx.fillRect(0, 0, w, horizonY + 100);

  // Perspective Grid Lines
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
  ctx.lineWidth = 2;

  // Vanishing perspective vertical lines
  for (let i = -10; i <= numLines + 10; i++) {
    const startX = (w / numLines) * i;
    ctx.beginPath();
    ctx.moveTo(w * 0.5, horizonY);
    const bottomX = w * 0.5 + (startX - w * 0.5) * 4.5;
    ctx.lineTo(bottomX, h);
    ctx.stroke();
  }

  // Horizontal moving lines
  for (let y = 1; y < 16; y++) {
    const progress = Math.pow(y / 16, 2.2);
    const currentY = horizonY + (h - horizonY) * progress + speed * (progress * 0.3);
    if (currentY <= h) {
      ctx.strokeStyle = `rgba(236, 72, 153, ${0.15 + progress * 0.6})`;
      ctx.beginPath();
      ctx.moveTo(0, currentY);
      ctx.lineTo(w, currentY);
      ctx.stroke();
    }
  }
}

function drawStarfield(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  ctx.fillStyle = '#030712';
  ctx.fillRect(0, 0, w, h);

  const count = 70;
  ctx.fillStyle = '#ffffff';

  for (let i = 0; i < count; i++) {
    const seed = i * 137.5;
    const x = ((seed * 17 + t * (10 + (i % 5) * 8)) % w + w) % w;
    const y = ((seed * 31 + Math.sin(t * 0.5 + i) * 30) % h + h) % h;
    const radius = 1 + (i % 3) * 1.2;
    const alpha = 0.3 + 0.7 * Math.abs(Math.sin(t * 1.5 + i));

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.shadowBlur = 8;
    ctx.shadowColor = i % 2 === 0 ? '#38bdf8' : '#c084fc';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawCodeStream(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  ctx.fillStyle = '#080d14';
  ctx.fillRect(0, 0, w, h);

  const columns = 14;
  const colWidth = w / columns;
  const snippets = [
    'const studio = createStudio();',
    'await videoLayer.render({ 3:4 });',
    'transparent: true, tab: center',
    'export const Mockup = () => {',
    'return <VideoFrame down={bg} />',
    'ctx.drawImage(tabVideo, x, y);',
    'syncAudioTracks([up, down]);',
    'quality: "lossless", fps: 60',
    'tab.mockup.setCornerRadius(24)',
  ];

  ctx.font = `${Math.floor(w * 0.024)}px monospace`;
  for (let c = 0; c < columns; c++) {
    const speed = 25 + (c % 5) * 15;
    const offsetY = ((t * speed + c * 140) % (h + 300)) - 100;
    const alpha = 0.15 + 0.15 * Math.sin(c + t);
    ctx.fillStyle = `rgba(52, 211, 153, ${alpha})`;
    const text = snippets[c % snippets.length];
    ctx.fillText(text, c * colWidth + 10, offsetY);
  }
}

function drawBokeh(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  const bgGrad = ctx.createLinearGradient(0, 0, w, h);
  bgGrad.addColorStop(0, '#1c1917');
  bgGrad.addColorStop(0.5, '#292524');
  bgGrad.addColorStop(1, '#0c0a09');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  const circles = 20;
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < circles; i++) {
    const x = w * (0.5 + 0.4 * Math.sin(t * 0.3 + i * 1.3));
    const y = h * (0.5 + 0.4 * Math.cos(t * 0.25 + i * 0.9));
    const radius = w * (0.08 + (i % 4) * 0.05);
    const alpha = 0.12 + 0.1 * Math.sin(t * 0.8 + i);

    const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
    const hue = (i * 45 + t * 10) % 360;
    grad.addColorStop(0, `hsla(${hue}, 80%, 70%, ${alpha * 1.5})`);
    grad.addColorStop(1, `hsla(${hue}, 80%, 70%, 0)`);

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
