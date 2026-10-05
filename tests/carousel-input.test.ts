import test from 'node:test';
import assert from 'node:assert/strict';
import { horizontalWheelDelta, swipeDirection } from '../app/carousel-input.ts';

void test('vertical and diagonal wheel preserve page scrolling', () => {
  assert.equal(horizontalWheelDelta(0, 120, false, 0, 900), null);
  assert.equal(horizontalWheelDelta(50, 50, false, 0, 900), null);
  assert.equal(horizontalWheelDelta(5, 50, false, 0, 900), null);
});
void test('horizontal and Shift wheel accept signed distances and normalize units', () => {
  assert.equal(horizontalWheelDelta(50, 5, false, 0, 900), 50);
  assert.equal(horizontalWheelDelta(0, 120, true, 0, 900), 120);
  assert.equal(horizontalWheelDelta(-3, 0, false, 1, 900), -48);
  assert.equal(horizontalWheelDelta(0, -1, true, 2, 900), -900);
  assert.equal(horizontalWheelDelta(40, 0, true, 0, 900), 40);
  assert.equal(horizontalWheelDelta(0, 0, false, 0, 900), null);
});
void test('swipe requires clear horizontal intent, not a tap or vertical gesture', () => {
  assert.equal(swipeDirection(-60, 10), 1);
  assert.equal(swipeDirection(60, 10), -1);
  assert.equal(swipeDirection(40, 0), 0);
  assert.equal(swipeDirection(60, 50), 0);
});
