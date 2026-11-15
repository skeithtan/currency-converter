import assert from "node:assert/strict";
import { test } from "node:test";
import { displacement, dropIndex, moveItem } from "./reorder.ts";

test("moveItem moves an item up or down and copies the array", () => {
  const items = ["a", "b", "c", "d"];
  assert.deepEqual(moveItem(items, 0, 2), ["b", "c", "a", "d"]);
  assert.deepEqual(moveItem(items, 3, 0), ["d", "a", "b", "c"]);
  assert.deepEqual(moveItem(items, 1, 1), items);
  assert.notEqual(moveItem(items, 1, 1), items);
  assert.deepEqual(items, ["a", "b", "c", "d"]);
});

test("moveItem clamps targets past either end", () => {
  assert.deepEqual(moveItem(["a", "b", "c"], 0, 9), ["b", "c", "a"]);
  assert.deepEqual(moveItem(["a", "b", "c"], 2, -4), ["c", "a", "b"]);
});

const boxes = [0, 68, 136, 204].map((top) => ({ top, height: 68 }));

test("dropIndex moves past rows whose middle the leading edge crosses", () => {
  // Moving row 0 down, its bottom edge (top + 68) must pass row 1's middle
  // (102).
  assert.equal(dropIndex(boxes, 0, 0), 0);
  assert.equal(dropIndex(boxes, 0, 33), 0);
  assert.equal(dropIndex(boxes, 0, 35), 1);
  // Dragged as far down as the list allows, it reaches the last place.
  assert.equal(dropIndex(boxes, 0, 204), 3);

  // Moving row 3 up, its top edge must pass each row's middle.
  assert.equal(dropIndex(boxes, 3, 171), 3);
  assert.equal(dropIndex(boxes, 3, 169), 2);
  assert.equal(dropIndex(boxes, 3, 100), 1);
  assert.equal(dropIndex(boxes, 3, 0), 0);
});

test("rows between the old and new place move aside by one row", () => {
  // Dragging row 0 to position 2 moves rows 1 and 2 up.
  assert.deepEqual(
    [0, 1, 2, 3].map((index) => displacement(index, 0, 2, 68)),
    [0, -68, -68, 0],
  );
  // Dragging row 3 to position 1 moves rows 1 and 2 down.
  assert.deepEqual(
    [0, 1, 2, 3].map((index) => displacement(index, 3, 1, 68)),
    [0, 68, 68, 0],
  );
});
