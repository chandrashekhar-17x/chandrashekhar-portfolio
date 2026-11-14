/** Pure geometry for the blueprint overlay: which dimension lines to draw. */

export interface Box {
  id: string;
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface DimLine {
  key: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** Where the value label sits, and its text (the real size, in px). */
  lx: number;
  ly: number;
  text: string;
  vertical: boolean;
}

export interface DimTag {
  key: string;
  x: number;
  y: number;
  text: string;
}

/** Distance of the dimension lines from the box edges. */
const INSET = 14;
const MIN_VISIBLE = 40;

/**
 * Width line along the top of each box and height line down its left side, like
 * a CAD drawing. Lines are clipped to the viewport; labels keep the real size.
 */
export function dimensions(
  boxes: readonly Box[],
  viewW: number,
  viewH: number,
  /** Top of the drawable area (below the sticky nav). */
  minY = 0,
): { lines: DimLine[]; tags: DimTag[] } {
  const lines: DimLine[] = [];
  const tags: DimTag[] = [];
  for (const b of boxes) {
    const bottom = b.top + b.height;
    const visTop = Math.max(b.top, minY);
    const visBottom = Math.min(bottom, viewH);
    if (visBottom - visTop < MIN_VISIBLE || b.width < MIN_VISIBLE * 2) continue;

    const y = b.top + INSET;
    if (y > minY && y < viewH) {
      const x1 = Math.max(b.left + INSET * 2, 0);
      const x2 = Math.min(b.left + b.width - INSET, viewW);
      lines.push({
        key: `${b.id}-w`,
        x1,
        y1: y,
        x2,
        y2: y,
        lx: (x1 + x2) / 2,
        ly: y,
        text: String(Math.round(b.width)),
        vertical: false,
      });
      tags.push({ key: b.id, x: b.left + INSET * 2 + 4, y: y + 22, text: `#${b.id}` });
    }

    const x = b.left + INSET;
    const y1 = Math.max(visTop, b.top + INSET * 2);
    const y2 = Math.min(visBottom, bottom - INSET);
    if (y2 - y1 >= MIN_VISIBLE) {
      lines.push({
        key: `${b.id}-h`,
        x1: x,
        y1,
        x2: x,
        y2,
        lx: x,
        ly: (y1 + y2) / 2,
        text: String(Math.round(b.height)),
        vertical: true,
      });
    }
  }
  return { lines, tags };
}
