import test from 'node:test';
import assert from 'node:assert/strict';
import { momentumStep, releaseVelocity } from '../app/gallery-physics.ts';

void test('a flick keeps moving after release and decelerates independently of frame rate', () => {
  const first = momentumStep(1.5, 16);
  const second = momentumStep(first.velocity, 16);
  const combined = momentumStep(1.5, 32);

  assert.ok(first.distance > 0);
  assert.ok(second.velocity > 0 && second.velocity < first.velocity);
  assert.ok(Math.abs(first.distance + second.distance - combined.distance) < 0.01);
  assert.ok(momentumStep(2, 16).distance > first.distance);
});

void test('a pause before release or reduced-motion preference removes momentum', () => {
  assert.equal(releaseVelocity(1.5, 140, false), 0);
  assert.equal(releaseVelocity(1.5, 20, true), 0);
  assert.equal(releaseVelocity(1.5, 20, false), 1.5);
});
