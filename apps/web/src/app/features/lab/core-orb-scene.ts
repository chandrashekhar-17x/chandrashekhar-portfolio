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
  for (const p of particles) {
    const x = p.x * cos - p.z * sin;
    const z = p.x * sin + p.z * cos;
    const depth = (z + 2) / 3;
    ctx.globalAlpha = 0.25 + depth * 0.7;
    ctx.fillStyle = z > 0 ? f.front : f.back;
    ctx.beginPath();
    ctx.arc(w / 2 + x * radius, h / 2 + p.y * radius, 1.4 * depth + 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}
