export type MediaBounds = { left: number; right: number };

// Bounds include the second carousel copy; indices refer to the original media.
export function nearbyMedia(bounds: MediaBounds[], viewport: MediaBounds, count: number, direction: number) {
  if (!count) return [];
  const visible = bounds.flatMap((box, index) => box.right > viewport.left && box.left < viewport.right ? [index] : []);
  if (!visible.length) return [];
  const edge = direction < 0 ? visible[0] : visible[visible.length - 1];
  const step = direction < 0 ? -1 : 1;
  return [...new Set([...visible, edge + step, edge + step * 2].map(index => ((index % count) + count) % count))];
}
