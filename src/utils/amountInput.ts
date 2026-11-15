/**
 * Helpers for the amount field, which groups digits as they are typed
 * ("1,200,000") so long amounts can be read back at a glance.
 *
 * A draft is kept in canonical form: ASCII digits with an optional "." and
 * fraction digits ("1200000", "0.5", "12."). It is only localized for display.
 */

export interface NumberSymbols {
  group: string;
  decimal: string;
}

const MAX_INTEGER_DIGITS = 15;
const MAX_FRACTION_DIGITS = 8;
const SIGNIFICANT = /[0-9.]/;

export function getNumberSymbols(locale?: string): NumberSymbols {
  const parts = new Intl.NumberFormat(locale, {
    numberingSystem: "latn",
  }).formatToParts(1234567.5);
  return {
    group: parts.find((part) => part.type === "group")?.value ?? ",",
    decimal: parts.find((part) => part.type === "decimal")?.value ?? ".",
  };
}

/**
 * Turns whatever is in the field into a canonical draft. Group separators are
 * dropped and the first "." or "," left is the decimal point, so either works
 * whatever the locale's own decimal separator is.
 */
export function parseDraft(text: string, symbols: NumberSymbols): string {
  const withoutGroups = toLatinDigits(text).split(symbols.group).join("");
  let integer = "";
  let fraction = "";
  let hasPoint = false;

  for (const char of withoutGroups) {
    if (char >= "0" && char <= "9") {
      if (!hasPoint && integer.length < MAX_INTEGER_DIGITS) integer += char;
      else if (hasPoint && fraction.length < MAX_FRACTION_DIGITS) {
        fraction += char;
      }
    } else if (
      (char === "." || char === "," || char === symbols.decimal) &&
      !hasPoint
    ) {
      hasPoint = true;
    }
  }

  integer = integer.replace(/^0+(?=\d)/, "");
  if (hasPoint) return `${integer || "0"}.${fraction}`;
  return integer;
}

/** Localizes a canonical draft for display, grouping the integer digits. */
export function formatDraft(
  draft: string,
  symbols: NumberSymbols,
  locale?: string,
): string {
  if (draft === "") return "";
  const [integer, fraction] = draft.split(".");
  const grouped = new Intl.NumberFormat(locale, {
    numberingSystem: "latn",
    useGrouping: true,
  }).format(BigInt(integer || "0"));
  return fraction === undefined
    ? grouped
    : `${grouped}${symbols.decimal}${fraction}`;
}

/**
 * Multiplies a draft by a power of ten by moving its decimal point, which is
 * exact where floating point would turn 1.1 × 1000 into 1100.0000000000002.
 */
export function shiftDecimal(draft: string, places: number): string {
  if (draft === "") return "";
  const [integer, fraction = ""] = draft.split(".");
  const digits = integer + fraction.padEnd(places, "0");
  const pointAt = integer.length + places;
  const newInteger = digits.slice(0, pointAt).replace(/^0+(?=\d)/, "") || "0";
  const newFraction = digits.slice(pointAt).replace(/0+$/, "");

  // Too large to represent exactly: leave the amount as it was.
  if (newInteger.length > MAX_INTEGER_DIGITS) return draft;
  return newFraction ? `${newInteger}.${newFraction}` : newInteger;
}

export function draftToNumber(draft: string): number | undefined {
  if (draft === "" || draft === ".") return undefined;
  const value = Number(draft);
  return Number.isFinite(value) ? value : undefined;
}

/** Counts the digits and decimal point before `position` in the field. */
export function significantBefore(
  text: string,
  position: number,
  symbols: NumberSymbols,
): number {
  let count = 0;
  for (const char of toLatinDigits(text.slice(0, position))) {
    if (char === symbols.group) continue;
    if (SIGNIFICANT.test(char) || char === "," || char === symbols.decimal) {
      count++;
    }
  }
  return count;
}

/** Where to put the caret so `count` digits and points come before it. */
export function positionAfterSignificant(
  formatted: string,
  count: number,
  symbols: NumberSymbols,
): number {
  if (count <= 0) return 0;
  let seen = 0;
  for (let index = 0; index < formatted.length; index++) {
    const char = formatted[index];
    if (/[0-9]/.test(char) || char === symbols.decimal) seen++;
    if (seen === count) return index + 1;
  }
  return formatted.length;
}

/** Converts Arabic-Indic and Persian digits, which some keyboards type. */
function toLatinDigits(text: string): string {
  return text.replace(/[٠-٩۰-۹]/g, (digit) =>
    String((digit.charCodeAt(0) & 0xf) % 10),
  );
}
