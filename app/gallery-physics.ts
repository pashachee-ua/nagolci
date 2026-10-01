const FRICTION = 0.0045;

export function momentumStep(velocity: number, elapsedMs: number) {
  const next = velocity * Math.exp(-FRICTION * elapsedMs);
  return {
    distance: (velocity - next) / FRICTION,
    velocity: Math.abs(next) < 0.018 ? 0 : next,
  };
}

export function releaseVelocity(velocity: number, idleMs: number, reducedMotion: boolean) {
  if (reducedMotion || idleMs > 90 || Math.abs(velocity) < 0.04) return 0;
  return Math.max(-2.4, Math.min(2.4, velocity));
}
