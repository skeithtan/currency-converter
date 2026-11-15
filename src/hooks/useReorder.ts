import {
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { displacement, dropIndex, type ItemBox } from "../utils/reorder.ts";

/** Marks each reorderable item, in order, inside the list element. */
export const REORDER_ITEM_ATTRIBUTE = "data-reorder-item";

// Long enough that a tap or the start of a scroll is never taken for a drag.
const LONG_PRESS_MS = 350;
// Moving further than this before the long press completes means scrolling.
const TOUCH_SLOP_PX = 8;
// With a mouse, dragging starts as soon as the pointer moves this far.
const MOUSE_SLOP_PX = 4;
// A click that ends a drag must not also start editing the row.
const SUPPRESS_CLICK_MS = 250;

export interface DragState {
  from: number;
  to: number;
  /** How far the lifted item has moved from its resting place, in pixels. */
  offset: number;
  height: number;
}

export interface ReorderItemState {
  /** The item is the one being dragged. */
  lifted: boolean;
  /** Any item is being dragged, so the others should animate aside. */
  dragging: boolean;
  /** Vertical translation to apply, in pixels. */
  offset: number;
}

interface Gesture {
  index: number;
  pointerId: number;
  pointerType: string;
  startX: number;
  startY: number;
  timer?: ReturnType<typeof setTimeout>;
  active: boolean;
  boxes: ItemBox[];
}

/**
 * Drag-to-reorder without a separate edit mode: touch and hold a row, or press
 * and drag it with a mouse. Scrolling is only blocked once a row has lifted,
 * so swiping through the list still scrolls.
 */
export function useReorder<T extends HTMLElement>({
  enabled,
  onMove,
}: {
  enabled: boolean;
  onMove(from: number, to: number): void;
}) {
  const listRef = useRef<T>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const gestureRef = useRef<Gesture | null>(null);
  const removeListenersRef = useRef<(() => void) | null>(null);
  const suppressClickUntilRef = useRef(0);
  const onMoveRef = useRef(onMove);
  const endRef = useRef<(commit: boolean) => void>(() => {});

  useEffect(() => {
    onMoveRef.current = onMove;
    endRef.current = end;
  });

  function updateDrag(next: DragState | null) {
    dragRef.current = next;
    setDrag(next);
  }

  function end(commit: boolean) {
    const gesture = gestureRef.current;
    gestureRef.current = null;
    removeListenersRef.current?.();
    removeListenersRef.current = null;
    if (gesture?.timer) clearTimeout(gesture.timer);
    if (!gesture?.active) return;

    suppressClickUntilRef.current = performance.now() + SUPPRESS_CLICK_MS;
    const finished = dragRef.current;
    updateDrag(null);
    if (commit && finished && finished.to !== finished.from) {
      onMoveRef.current(finished.from, finished.to);
    }
  }

  useEffect(() => {
    if (!enabled) endRef.current(false);
  }, [enabled]);

  useEffect(() => () => endRef.current(false), []);

  // Once a row has lifted, stop the browser scrolling instead of dragging.
  // WebKit only honours preventDefault() from a non-passive touchmove
  // listener that was registered before the touch began, so this one stays
  // attached for the life of the list and only acts during a drag.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const preventScrollWhileDragging = (event: TouchEvent) => {
      if (gestureRef.current?.active && event.cancelable) {
        event.preventDefault();
      }
    };
    list.addEventListener("touchmove", preventScrollWhileDragging, {
      passive: false,
    });
    return () =>
      list.removeEventListener("touchmove", preventScrollWhileDragging);
  }, []);

  function lift(gesture: Gesture) {
    const list = listRef.current;
    if (!list) return end(false);
    gesture.boxes = [
      ...list.querySelectorAll<HTMLElement>(`[${REORDER_ITEM_ATTRIBUTE}]`),
    ].map((item) => ({ top: item.offsetTop, height: item.offsetHeight }));
    const box = gesture.boxes[gesture.index];
    if (!box || gesture.boxes.length < 2) return end(false);

    gesture.active = true;
    navigator.vibrate?.(10);
    updateDrag({
      from: gesture.index,
      to: gesture.index,
      offset: 0,
      height: box.height,
    });
  }

  function handlePointerMove(event: PointerEvent) {
    const gesture = gestureRef.current;
    if (!gesture || event.pointerId !== gesture.pointerId) return;
    const dx = event.clientX - gesture.startX;
    const dy = event.clientY - gesture.startY;

    if (!gesture.active) {
      if (gesture.pointerType !== "mouse") {
        if (Math.hypot(dx, dy) > TOUCH_SLOP_PX) end(false);
        return;
      }
      if (Math.abs(dy) < MOUSE_SLOP_PX) return;
      lift(gesture);
      if (!gesture.active) return;
    }

    const { boxes, index } = gesture;
    const box = boxes[index];
    const first = boxes[0];
    const last = boxes[boxes.length - 1];
    const offset = Math.min(
      Math.max(dy, first.top - box.top),
      last.top + last.height - (box.top + box.height),
    );
    updateDrag({
      from: index,
      to: dropIndex(boxes, index, box.top + offset),
      offset,
      height: box.height,
    });
  }

  function handlePointerDown(
    index: number,
    event: ReactPointerEvent<HTMLElement>,
  ) {
    if (!enabled || !event.isPrimary || event.button !== 0) return;
    end(false);

    const gesture: Gesture = {
      index,
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      startX: event.clientX,
      startY: event.clientY,
      active: false,
      boxes: [],
    };
    gestureRef.current = gesture;
    if (event.pointerType !== "mouse") {
      gesture.timer = setTimeout(() => {
        if (gestureRef.current === gesture) lift(gesture);
      }, LONG_PRESS_MS);
    }

    const move = (moveEvent: PointerEvent) => handlePointerMove(moveEvent);
    const up = (upEvent: PointerEvent) => {
      if (upEvent.pointerId === gesture.pointerId) end(true);
    };
    const cancel = (cancelEvent: PointerEvent) => {
      if (cancelEvent.pointerId === gesture.pointerId) end(false);
    };
    // A long press would otherwise open the context menu on Android.
    const contextMenu = (menuEvent: Event) => menuEvent.preventDefault();

    globalThis.addEventListener("pointermove", move);
    globalThis.addEventListener("pointerup", up);
    globalThis.addEventListener("pointercancel", cancel);
    globalThis.addEventListener("contextmenu", contextMenu);
    removeListenersRef.current = () => {
      globalThis.removeEventListener("pointermove", move);
      globalThis.removeEventListener("pointerup", up);
      globalThis.removeEventListener("pointercancel", cancel);
      globalThis.removeEventListener("contextmenu", contextMenu);
    };
  }

  function itemState(index: number): ReorderItemState {
    if (!drag) return { lifted: false, dragging: false, offset: 0 };
    if (index === drag.from) {
      return { lifted: true, dragging: true, offset: drag.offset };
    }
    return {
      lifted: false,
      dragging: true,
      offset: displacement(index, drag.from, drag.to, drag.height),
    };
  }

  return {
    listRef,
    itemState,
    onPointerDown: handlePointerDown,
    /** Whether a click is the tail end of a drag rather than a tap. */
    shouldSuppressClick: () =>
      performance.now() < suppressClickUntilRef.current,
  };
}
