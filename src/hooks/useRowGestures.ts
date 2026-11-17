import {
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { displacement, dropIndex, type ItemBox } from "../utils/reorder.ts";
import { isDeleteArmed, lockDirection, swipeOffset } from "../utils/swipe.ts";

/** Marks each row, in order, inside the list element. */
export const ROW_ITEM_ATTRIBUTE = "data-reorder-item";

// Long enough that a tap or the start of a scroll is never taken for a drag.
const LONG_PRESS_MS = 350;
// How far a touch moves before its direction decides what it is: sideways
// to the left is a swipe, anything else is a scroll.
const TOUCH_SLOP_PX = 8;
// With a mouse, dragging starts as soon as the pointer moves this far.
const MOUSE_SLOP_PX = 4;
// A click that ends a drag or swipe must not also start editing the row.
const SUPPRESS_CLICK_MS = 250;

export interface DragState {
  from: number;
  to: number;
  /** How far the lifted row has moved from its resting place, in pixels. */
  offset: number;
  height: number;
}

export interface SwipeState {
  index: number;
  /** Horizontal offset of the row, zero or negative. */
  offset: number;
  /** Past the threshold: letting go now deletes the row. */
  armed: boolean;
}

export interface RowGestureState {
  /** The row is the one being dragged. */
  lifted: boolean;
  /** Any row is being dragged, so the others should animate aside. */
  dragging: boolean;
  /** Vertical translation to apply, in pixels. */
  offset: number;
  /** A finger is swiping this row. */
  swiping: boolean;
  /** Horizontal translation from a swipe, in pixels. */
  swipeOffset: number;
  swipeArmed: boolean;
}

interface Gesture {
  index: number;
  pointerId: number;
  pointerType: string;
  startX: number;
  startY: number;
  timer?: ReturnType<typeof setTimeout>;
  mode: "pending" | "drag" | "swipe";
  boxes: ItemBox[];
  width: number;
}

/**
 * Touch gestures on the currency rows, without a separate edit mode:
 * touch and hold to lift a row and drag it into place (press and drag with a
 * mouse), or swipe a row left past a threshold to delete it. Scrolling is
 * only blocked once a row has lifted or a swipe has begun, so vertical
 * swipes still scroll the list.
 */
export function useRowGestures<T extends HTMLElement>({
  enabled,
  onMove,
  onSwipeDelete,
}: {
  enabled: boolean;
  onMove(from: number, to: number): void;
  /** Called with the row and its offset when a swipe is released past the threshold. */
  onSwipeDelete(index: number, offset: number): void;
}) {
  const listRef = useRef<T>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [swipe, setSwipe] = useState<SwipeState | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const swipeRef = useRef<SwipeState | null>(null);
  const gestureRef = useRef<Gesture | null>(null);
  const removeListenersRef = useRef<(() => void) | null>(null);
  const suppressClickUntilRef = useRef(0);
  const callbacksRef = useRef({ onMove, onSwipeDelete });
  const endRef = useRef<(commit: boolean) => void>(() => {});

  useEffect(() => {
    callbacksRef.current = { onMove, onSwipeDelete };
    endRef.current = end;
  });

  function updateDrag(next: DragState | null) {
    dragRef.current = next;
    setDrag(next);
  }

  function updateSwipe(next: SwipeState | null) {
    swipeRef.current = next;
    setSwipe(next);
  }

  function end(commit: boolean) {
    const gesture = gestureRef.current;
    gestureRef.current = null;
    removeListenersRef.current?.();
    removeListenersRef.current = null;
    if (gesture?.timer) clearTimeout(gesture.timer);
    // A gesture that never became a drag or swipe was a tap or a scroll.
    if (!gesture || gesture.mode === "pending") return;

    suppressClickUntilRef.current = performance.now() + SUPPRESS_CLICK_MS;
    if (gesture.mode === "drag") {
      const finished = dragRef.current;
      updateDrag(null);
      if (commit && finished && finished.to !== finished.from) {
        callbacksRef.current.onMove(finished.from, finished.to);
      }
    } else {
      const finished = swipeRef.current;
      updateSwipe(null);
      if (commit && finished?.armed) {
        callbacksRef.current.onSwipeDelete(finished.index, finished.offset);
      }
    }
  }

  useEffect(() => {
    if (!enabled) endRef.current(false);
  }, [enabled]);

  useEffect(() => () => endRef.current(false), []);

  // Once a row has lifted or a swipe has begun, stop the browser scrolling.
  // WebKit only honours preventDefault() from a non-passive touchmove
  // listener that was registered before the touch began, so this one stays
  // attached for the life of the list and only acts during a gesture.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const preventScrollDuringGesture = (event: TouchEvent) => {
      const mode = gestureRef.current?.mode;
      if ((mode === "drag" || mode === "swipe") && event.cancelable) {
        event.preventDefault();
      }
    };
    list.addEventListener("touchmove", preventScrollDuringGesture, {
      passive: false,
    });
    return () =>
      list.removeEventListener("touchmove", preventScrollDuringGesture);
  }, []);

  function lift(gesture: Gesture) {
    const list = listRef.current;
    if (!list) return end(false);
    gesture.boxes = [
      ...list.querySelectorAll<HTMLElement>(`[${ROW_ITEM_ATTRIBUTE}]`),
    ].map((item) => ({ top: item.offsetTop, height: item.offsetHeight }));
    const box = gesture.boxes[gesture.index];
    if (!box || gesture.boxes.length < 2) return end(false);

    gesture.mode = "drag";
    navigator.vibrate?.(10);
    updateDrag({
      from: gesture.index,
      to: gesture.index,
      offset: 0,
      height: box.height,
    });
  }

  function startSwipe(gesture: Gesture, event: PointerEvent) {
    if (gesture.timer) clearTimeout(gesture.timer);
    gesture.mode = "swipe";
    // Track from here, so the row does not jump by the slop distance.
    gesture.startX = event.clientX;
    updateSwipe({ index: gesture.index, offset: 0, armed: false });
  }

  function moveDrag(gesture: Gesture, dy: number) {
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

  function moveSwipe(gesture: Gesture, dx: number) {
    const offset = swipeOffset(dx, gesture.width);
    const armed = isDeleteArmed(offset, gesture.width);
    if (armed && !swipeRef.current?.armed) navigator.vibrate?.(10);
    updateSwipe({ index: gesture.index, offset, armed });
  }

  function handlePointerMove(event: PointerEvent) {
    const gesture = gestureRef.current;
    if (!gesture || event.pointerId !== gesture.pointerId) return;
    const dx = event.clientX - gesture.startX;
    const dy = event.clientY - gesture.startY;

    if (gesture.mode === "pending") {
      if (gesture.pointerType === "mouse") {
        if (Math.abs(dy) < MOUSE_SLOP_PX) return;
        lift(gesture);
      } else {
        const direction = lockDirection(dx, dy, TOUCH_SLOP_PX);
        if (!direction) return;
        if (direction === "horizontal" && dx < 0) {
          startSwipe(gesture, event);
        } else {
          // Scrolling, or a swipe to the right, which does nothing.
          end(false);
        }
        return;
      }
    }

    if (gesture.mode === "drag") moveDrag(gesture, dy);
    else if (gesture.mode === "swipe") moveSwipe(gesture, dx);
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
      mode: "pending",
      boxes: [],
      width: event.currentTarget.offsetWidth,
    };
    gestureRef.current = gesture;
    if (event.pointerType !== "mouse") {
      gesture.timer = setTimeout(() => {
        if (gestureRef.current === gesture && gesture.mode === "pending") {
          lift(gesture);
        }
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

  function itemState(index: number): RowGestureState {
    const swiping = swipe?.index === index;
    const swipeFields = {
      swiping,
      swipeOffset: swiping ? swipe.offset : 0,
      swipeArmed: swiping ? swipe.armed : false,
    };
    if (!drag) {
      return { lifted: false, dragging: false, offset: 0, ...swipeFields };
    }
    if (index === drag.from) {
      return {
        lifted: true,
        dragging: true,
        offset: drag.offset,
        ...swipeFields,
      };
    }
    return {
      lifted: false,
      dragging: true,
      offset: displacement(index, drag.from, drag.to, drag.height),
      ...swipeFields,
    };
  }

  return {
    listRef,
    itemState,
    onPointerDown: handlePointerDown,
    /** Whether a click is the tail end of a drag or swipe rather than a tap. */
    shouldSuppressClick: () =>
      performance.now() < suppressClickUntilRef.current,
  };
}
