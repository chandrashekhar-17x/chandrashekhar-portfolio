// "AI core": a rotating sphere of particles with three tilted rings
// (prototype drawCore). Pure drawing code.

export interface Particle {
  x: number;
  y: number;
  z: number;
}

/** Evenly spread points on a unit sphere. */
export function createParticles(count: number, random: () => number): Particle[] {
  return Array.from({ length: count }, () => {
    const u = random() * 2 - 1;
    const theta = random() * Math.PI * 2;
    const r = Math.sqrt(1 - u * u);
    return { x: r * Math.cos(theta), y: u, z: r * Math.sin(theta) };
  });
}

export interface OrbFrame {
  width: number;
  height: number;
  /** Seconds (frozen for reduced motion). */
  t: number;
  /** 0…1: pulses the sphere while the agent "speaks". */
  speaking: number;
  front: string; // colour for particles facing the viewer
  back: string;
}

export function drawOrb(ctx: CanvasRenderingContext2D, particles: Particle[], f: OrbFrame): void {
  const { width: w, height: h, t } = f;
  ctx.clearRect(0, 0, w, h);
  const radius = Math.min(w, h) * 0.33 * (1 + f.speaking * 0.08 * Math.sin(t * 14));
  const cos = Math.cos(t * 0.4);
  const sin = Math.sin(t * 0.4);

  // Rings
  ctx.strokeStyle = f.front;
  ctx.globalAlpha = 0.25;
  for (let k = 0; k < 3; k++) {
    ctx.beginPath();
    ctx.ellipse(
      w / 2,
      h / 2,
      radius * (1.25 + k * 0.18),
      radius * (0.32 + k * 0.05),
      (t * 0.2 + k) * 0.6,
      0,
      Math.PI * 2,
    );
    ctx.stroke();
  }

  // Particles, rotated around the vertical axis; nearer = bigger and brighter.
  // Batched: 2 colours × 4 depth levels = 8 fills instead of one per particle.
  const levels = 4;
  const batches = Array.from({ length: levels * 2 }, () => new Path2D());
  for (const p of particles) {
    const x = p.x * cos - p.z * sin;
    const z = p.x * sin + p.z * cos;
    const depth = (z + 2) / 3; // 1/3 … 1
    const level = Math.min(levels - 1, Math.floor((depth - 1 / 3) * 1.5 * levels));
    const path = batches[(z > 0 ? 0 : levels) + level];
    const px = w / 2 + x * radius;
    const py = h / 2 + p.y * radius;
    const r = 1.4 * depth + 0.3;
    path?.moveTo(px + r, py);
    path?.arc(px, py, r, 0, Math.PI * 2);
  }
  batches.forEach((path, i) => {
    const level = i % levels;
    ctx.globalAlpha = 0.25 + ((level + 0.5) / levels) * 0.7;
    ctx.fillStyle = i < levels ? f.front : f.back;
    ctx.fill(path);
  });
  ctx.globalAlpha = 1;
}
