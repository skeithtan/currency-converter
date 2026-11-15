export interface ItemBox {
  top: number;
  height: number;
}

/** A copy of `items` with the item at `from` moved to `to`. */
export function moveItem<T>(
  items: readonly T[],
  from: number,
  to: number,
): T[] {
  const result = [...items];
  if (from === to || from < 0 || from >= items.length) return result;
  const [item] = result.splice(from, 1);
  result.splice(Math.max(0, Math.min(to, result.length)), 0, item);
  return result;
}

/**
 * Where a dragged item would land. An item below its starting place makes way
 * once the dragged item's bottom edge passes its middle, and an item above
 * once the top edge does, so the first and last places are both reachable
 * within the list. `boxes` are the items' resting positions.
 */
export function dropIndex(
  boxes: readonly ItemBox[],
  from: number,
  draggedTop: number,
): number {
  const dragged = boxes[from];
  if (!dragged) return from;
  const draggedBottom = draggedTop + dragged.height;
  let index = from;
  boxes.forEach((box, i) => {
    const middle = box.top + box.height / 2;
    if (i > from && draggedBottom > middle) index++;
    if (i < from && draggedTop < middle) index--;
  });
  return index;
}

/**
 * How far an item that is not being dragged moves aside to open a gap for the
 * dragged one, in pixels.
 */
export function displacement(
  index: number,
  from: number,
  to: number,
  draggedHeight: number,
): number {
  if (from < to && index > from && index <= to) return -draggedHeight;
  if (to < from && index >= to && index < from) return draggedHeight;
  return 0;
}
