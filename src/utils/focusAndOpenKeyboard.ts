/**
 * iOS only opens the on-screen keyboard for a focus() made during a user
 * gesture, but the field to type into often only renders after the tap. This
 * focuses an invisible stand-in input at once, inside the gesture, and returns
 * a function that moves focus to the real input once it exists. The keyboard
 * stays open across the hand-off.
 *
 * @see https://stackoverflow.com/a/55425845
 */
export function openKeyboardNear(
  anchor: HTMLElement,
  inputMode: "decimal" | "text" = "decimal",
): (input: HTMLInputElement | null) => void {
  const standIn = document.createElement("input");
  const { top, left } = anchor.getBoundingClientRect();
  Object.assign(standIn.style, {
    position: "fixed",
    top: `${top}px`,
    left: `${left}px`,
    width: "1px",
    height: "1px",
    padding: "0",
    border: "0",
    opacity: "0",
    // 16px or more stops iOS zooming in on focus.
    fontSize: "16px",
  });
  standIn.inputMode = inputMode;
  standIn.tabIndex = -1;
  standIn.setAttribute("aria-hidden", "true");
  document.body.appendChild(standIn);
  standIn.focus({ preventScroll: true });

  let handedOff = false;
  const handOff = (input: HTMLInputElement | null) => {
    if (handedOff) return;
    handedOff = true;
    input?.focus({ preventScroll: true });
    standIn.remove();
  };
  // Never leave the stand-in behind if the real input fails to appear.
  setTimeout(() => handOff(null), 1000);
  return handOff;
}
