import assert from "node:assert/strict";
import { test } from "node:test";
import {
  deleteThreshold,
  isDeleteArmed,
  lockDirection,
  swipeOffset,
} from "./swipe.ts";

test("the delete threshold is half the row, at most 200px", () => {
  assert.equal(deleteThreshold(390), 195);
  assert.equal(deleteThreshold(320), 160);
  assert.equal(deleteThreshold(440), 200);
});

test("a row only moves left, and no further than its width", () => {
  assert.equal(swipeOffset(-120, 390), -120);
  assert.equal(swipeOffset(40, 390), 0);
  assert.equal(swipeOffset(-500, 390), -390);
});

test("letting go deletes only past the threshold", () => {
  assert.equal(isDeleteArmed(-194, 390), false);
  assert.equal(isDeleteArmed(-195, 390), true);
  assert.equal(isDeleteArmed(-300, 390), true);
  assert.equal(isDeleteArmed(0, 390), false);
});

test("the direction is decided once the touch leaves the slop", () => {
  assert.equal(lockDirection(5, 3, 8), undefined);
  assert.equal(lockDirection(-12, 4, 8), "horizontal");
  assert.equal(lockDirection(12, 4, 8), "horizontal");
  assert.equal(lockDirection(4, -12, 8), "vertical");
  // A diagonal counts as vertical, so scrolling wins ties.
  assert.equal(lockDirection(9, 9, 8), "vertical");
});
