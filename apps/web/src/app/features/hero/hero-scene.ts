// Hero background: twinkling starfield + glowing wave hill + perspective grid
// (prototype drawHero(), reference image #2). Pure drawing code, no Angular.

export interface Star {
  x: number;
  y: number;
  /** Depth 0.2–1.2: bigger = closer = moves more with the mouse. */
  z: number;
  twinkle: number;
}

export interface HeroFrame {
  width: number;
  height: number;
  /** Animation clock (grows ~0.48/s; frozen for reduced motion). */
  t: number;
  /** Mouse offset from centre, −0.5…0.5 on each axis. */
  mouseX: number;
  mouseY: number;
  light: boolean;
}

/** One star per ~5000 px², placed in the top 75 % (the sky). */
export function createStars(width: number, height: number, random: () => number): Star[] {
  const count = Math.round((width * height) / 5000);
  return Array.from({ length: count }, () => ({
    x: random() * width,
    y: random() * height * 0.75,
    z: random() + 0.2,
    twinkle: random() * 6,
  }));
}

export function drawHeroScene(ctx: CanvasRenderingContext2D, stars: Star[], f: HeroFrame): void {
  const { width: w, height: h, light } = f;
  const horizon = h * 0.58;

  // The sky gradient is a CSS background on the canvas (static, painted once);
  // the canvas is transparent and only draws what moves.
  ctx.clearRect(0, 0, w, h);

  drawStars(ctx, stars, f);
  drawHill(ctx, f, horizon);

  // Soft glow along the horizon
  const glow = ctx.createLinearGradient(0, horizon - 30, 0, horizon + 30);
  glow.addColorStop(0, 'transparent');
  glow.addColorStop(0.5, light ? 'rgba(8,145,178,.25)' : 'rgba(34,211,238,.25)');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, horizon - 30, w, 60);

  drawGrid(ctx, f, horizon);
  ctx.globalAlpha = 1;
}

/** Twinkle brightness levels: stars are batched per level → 4 fills, not one per star. */
const TWINKLE_LEVELS = 4;

function drawStars(ctx: CanvasRenderingContext2D, stars: Star[], f: HeroFrame): void {
  ctx.fillStyle = f.light ? '#6d3df0' : '#dfe3ff';
  const paths = Array.from({ length: TWINKLE_LEVELS }, () => new Path2D());
  for (const s of stars) {
    const twinkle = Math.abs(Math.sin(f.t * 2 + s.twinkle)); // 0…1
    const level = Math.min(TWINKLE_LEVELS - 1, Math.floor(twinkle * TWINKLE_LEVELS));
    const x = s.x - f.mouseX * 20 * s.z;
    const y = s.y - f.mouseY * 14 * s.z;
    const path = paths[level];
    path?.moveTo(x + s.z * 1.3, y);
    path?.arc(x, y, s.z * 1.3, 0, Math.PI * 2);
  }
  paths.forEach((path, level) => {
    const alpha = 0.35 + 0.65 * ((level + 0.5) / TWINKLE_LEVELS);
    ctx.globalAlpha = alpha * (f.light ? 0.5 : 1);
    ctx.fill(path);
  });
  ctx.globalAlpha = 1;
}

/** The glowing violet surface curving up from the bottom-left. */
function drawHill(ctx: CanvasRenderingContext2D, f: HeroFrame, horizon: number): void {
  const { width: w, height: h, t, light } = f;
  const depth = h - horizon;
  ctx.beginPath();
  ctx.moveTo(0, h);
  for (let x = 0; x <= w; x += 8) {
    const wave = Math.sin((x / w) * Math.PI * 1.1 + t * 0.6) * depth * 0.45;
    ctx.lineTo(x, horizon + depth * 0.55 - wave - (x / w) * h * 0.25);
  }
  ctx.lineTo(w, h);
  ctx.closePath();
  const fill = ctx.createLinearGradient(0, horizon - h * 0.3, 0, h);
  fill.addColorStop(0, light ? 'rgba(109,61,240,.25)' : 'rgba(124,58,237,.55)');
  fill.addColorStop(1, light ? 'rgba(8,145,178,.15)' : 'rgba(30,64,175,.35)');
  ctx.fillStyle = fill;
  ctx.fill();
}

/** Lines converging on a vanishing point + rows scrolling towards the viewer. */
function drawGrid(ctx: CanvasRenderingContext2D, f: HeroFrame, horizon: number): void {
  const { width: w, height: h, t, light } = f;
  ctx.strokeStyle = light ? 'rgba(109,61,240,.28)' : 'rgba(139,150,255,.28)';
  ctx.lineWidth = 1;

  // All converging lines in one path → one stroke call.
  const vanishX = w / 2 + f.mouseX * 80;
  ctx.beginPath();
  for (let i = -24; i <= 24; i++) {
    ctx.moveTo(vanishX + i * 6, horizon);
    ctx.lineTo(vanishX + (i * w) / 9, h);
  }
  ctx.stroke();

  for (let j = 0; j < 18; j++) {
    const p = (j + ((t * 3) % 1)) / 18; // 0 at horizon → 1 at bottom
    const y = horizon + (h - horizon) * p * p;
    ctx.globalAlpha = p;
    ctx.beginPath();
    for (let x = 0; x <= w + 24; x += 24) {
      const yy = y - Math.sin(x / 120 + t * 2 + j) * 3 * p;
      if (x === 0) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }
}
