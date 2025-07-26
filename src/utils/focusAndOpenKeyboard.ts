/**
 * Opens the keyboard in iOS
 * @see https://stackoverflow.com/a/55425845
 */
export function focusAndOpenKeyboard(element: HTMLInputElement) {
    const timeout = 100;
    // Align temp input element approximately where the input element is
    // so the cursor doesn't jump around
    const __tempEl__ = document.createElement("input");
    __tempEl__.style.position = "absolute";
    __tempEl__.style.top = element.offsetTop + 7 + "px";
    __tempEl__.style.left = element.offsetLeft + "px";
    __tempEl__.style.height = "0";
    __tempEl__.style.opacity = "0";
    __tempEl__.type = "number";
    __tempEl__.inputMode = "decimal";
    // Put this temp element as a child of the page <body> and focus on it
    document.body.appendChild(__tempEl__);
    __tempEl__.focus();

    // The keyboard is open. Now do a delayed focus on the target element
    setTimeout(function () {
        element.focus();
        // Remove the temp element
        document.body.removeChild(__tempEl__);
    }, timeout);
}
