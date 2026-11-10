/**
 * Where to put the hover tooltip so it stays fully inside the graph box
 * (the box clips overflow, so a tooltip near an edge used to be cut off).
 * Prefers below-right of the pointer, flips to the other side when it
 * wouldn't fit, and finally clamps to the edges. Pure: easy to test.
 */
export interface Size {
  width: number;
  height: number;
}

const GAP = 14; // distance from the pointer
const PAD = 8; // minimum distance from the box edge

export function tipPosition(
  x: number,
  y: number,
  tip: Size,
  box: Size,
): { left: number; top: number } {
  const clamp = (v: number, max: number) => Math.max(PAD, Math.min(v, max));
  let left = x + GAP;
  if (left + tip.width > box.width - PAD) left = x - GAP - tip.width;
  let top = y + GAP;
  if (top + tip.height > box.height - PAD) top = y - GAP - tip.height;
  return {
    left: clamp(left, box.width - tip.width - PAD),
    top: clamp(top, box.height - tip.height - PAD),
  };
}
