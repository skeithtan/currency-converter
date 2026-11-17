/** A row is deleted once swiped past half its width, or 200px at most. */
const DELETE_FRACTION = 0.5;
const DELETE_MAX_PX = 200;

export type Direction = "horizontal" | "vertical";

/** How far left a row must be swiped before letting go deletes it. */
export function deleteThreshold(width: number): number {
  return Math.min(width * DELETE_FRACTION, DELETE_MAX_PX);
}

/** The row's horizontal offset: it only moves left, and no further than its width. */
export function swipeOffset(dx: number, width: number): number {
  return Math.max(-width, Math.min(0, dx));
}

export function isDeleteArmed(offset: number, width: number): boolean {
  return -offset >= deleteThreshold(width);
}

/**
 * Which way a touch is heading once it has moved further than `slop`, or
 * undefined while it is still within it. Decided once per gesture.
 */
export function lockDirection(
  dx: number,
  dy: number,
  slop: number,
): Direction | undefined {
  if (Math.hypot(dx, dy) <= slop) return undefined;
  return Math.abs(dx) > Math.abs(dy) ? "horizontal" : "vertical";
}
