/** A 2D canvas sized to its CSS box, with drawing units in CSS pixels. */
export interface FittedCanvas {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
}

/**
 * Matches the canvas backing store to its displayed size × device pixel ratio
 * (capped, because 3× screens would quadruple the work for no visible gain).
 * Returns null if the canvas has no size yet or 2D is unavailable.
 */
export function fitCanvas(canvas: HTMLCanvasElement, maxDpr = 2): FittedCanvas | null {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const ctx = canvas.getContext('2d');
  if (!width || !height || !ctx) return null;

  const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, width, height };
}

/** Reads a CSS custom property (e.g. "--cyan") so canvases follow the active theme. */
export function cssVar(name: string, el: Element = document.documentElement): string {
  return getComputedStyle(el).getPropertyValue(name).trim();
}
