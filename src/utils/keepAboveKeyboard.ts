/** Marks the element that scrolls the currency list. */
export const SCROLL_CONTAINER_ATTRIBUTE = "data-scroll-container";

const MARGIN_PX = 16;
// Before the on-screen keyboard has opened its size is unknown. Phone
// keyboards cover roughly the bottom half of the screen, so rows there are
// moved up straight away and the position is corrected once it has opened.
const ASSUMED_KEYBOARD_FRACTION = 0.5;
// The visual viewport also shrinks slightly for browser chrome; only a
// substantial reduction means the keyboard is open.
const KEYBOARD_OPEN_FRACTION = 0.85;

/**
 * Scrolls the list so `element` stays visible above the on-screen keyboard
 * while it is being edited, and keeps it there as the keyboard opens or
 * changes size. Returns a function that stops tracking and restores the list.
 *
 * Bottom padding is added to the list first so that even the last row of a
 * list too short to scroll on its own can be moved up.
 */
export function keepAboveKeyboard(element: HTMLElement): () => void {
  const container = element.closest<HTMLElement>(
    `[${SCROLL_CONTAINER_ATTRIBUTE}]`,
  );
  if (!container) return () => {};

  const viewport = globalThis.visualViewport;
  container.style.paddingBottom = `${container.clientHeight}px`;

  const visibleBottom = (): number =>
    viewport ? viewport.offsetTop + viewport.height : globalThis.innerHeight;

  function reveal(bottomEdge: number) {
    if (!container) return;
    const elementRect = element.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const limit = Math.min(containerRect.bottom, bottomEdge) - MARGIN_PX;
    // Move up just enough to clear the keyboard, but never past the top of
    // the list.
    const shift = Math.min(
      elementRect.bottom - limit,
      elementRect.top - containerRect.top,
    );
    if (shift > 0) {
      container.scrollTo({
        top: container.scrollTop + shift,
        behavior: "smooth",
      });
    }
  }

  const keyboardIsOpen = viewport != null &&
    viewport.height < globalThis.innerHeight * KEYBOARD_OPEN_FRACTION;
  if (keyboardIsOpen) {
    reveal(visibleBottom());
  } else if (globalThis.matchMedia?.("(pointer: coarse)").matches) {
    reveal(globalThis.innerHeight * (1 - ASSUMED_KEYBOARD_FRACTION));
  }

  const handleViewportChange = () => reveal(visibleBottom());
  viewport?.addEventListener("resize", handleViewportChange);
  viewport?.addEventListener("scroll", handleViewportChange);

  return () => {
    viewport?.removeEventListener("resize", handleViewportChange);
    viewport?.removeEventListener("scroll", handleViewportChange);
    container.style.paddingBottom = "";
  };
}
