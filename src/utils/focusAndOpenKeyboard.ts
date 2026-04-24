/**
 * Opens the keyboard in iOS
 * @see https://stackoverflow.com/a/55425845
 */
export function focusAndOpenKeyboard(element: HTMLInputElement) {
  const timeout = 100;
  const __tempEl__ = document.createElement("input");
  __tempEl__.style.position = "absolute";
  __tempEl__.style.top = element.offsetTop + 7 + "px";
  __tempEl__.style.left = element.offsetLeft + "px";
  __tempEl__.style.height = "0";
  __tempEl__.style.opacity = "0";
  __tempEl__.type = "number";
  __tempEl__.inputMode = "decimal";
  document.body.appendChild(__tempEl__);
  __tempEl__.focus({ preventScroll: true });

  setTimeout(function () {
    element.focus({ preventScroll: true });
    __tempEl__.remove();
  }, timeout);
}
