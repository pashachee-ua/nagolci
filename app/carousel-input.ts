/** Leave vertical/ambiguous gestures to the document, including at carousel edges. */
export function horizontalWheelDelta(deltaX: number, deltaY: number, shiftKey: boolean, deltaMode: number, pageWidth: number): number | null {
  const horizontal = shiftKey ? (deltaX || deltaY) : Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : 0;
  if (!horizontal) return null;
  return horizontal * (deltaMode === 1 ? 16 : deltaMode === 2 ? pageWidth : 1);
}

export function swipeDirection(dx: number, dy: number): -1 | 0 | 1 {
  if (Math.abs(dx) < 50 || Math.abs(dx) <= Math.abs(dy) * 1.5) return 0;
  return dx < 0 ? 1 : -1;
}
