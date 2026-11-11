/**
 * Currency signs encoded in Unicode 14 or later, from U+20C0 SOM SIGN onward.
 * Locale data already uses U+20C0 as the narrow symbol of the Kyrgyzstani som,
 * and U+20C1 SAUDI RIYAL SIGN is likely next, but system fonts lag years behind
 * Unicode, so on current phones these render as an empty box.
 */
const TOO_NEW_SIGN = /[⃀-⃏]/;

/**
 * Formats amounts of `currency` with the shortest symbol the device can show.
 *
 * The narrow symbol is preferred ("$" rather than "US$"). When it is a sign
 * that fonts lack, the locale's standard symbol is used instead, which is the
 * ISO code in most locales ("KGS") and the local abbreviation in some ("сом").
 */
export function createCurrencyFormatter(
  currency: string,
  locales?: Intl.LocalesArgument,
): Intl.NumberFormat {
  const create = (currencyDisplay: "narrowSymbol" | "symbol" | "code") =>
    new Intl.NumberFormat(locales, {
      style: "currency",
      currency,
      currencyDisplay,
      useGrouping: true,
    });

  for (const currencyDisplay of ["narrowSymbol", "symbol"] as const) {
    const formatter = create(currencyDisplay);
    if (!TOO_NEW_SIGN.test(currencySymbol(formatter))) return formatter;
  }
  // ISO 4217 codes are plain Latin letters, which every font has.
  return create("code");
}

function currencySymbol(formatter: Intl.NumberFormat): string {
  return (
    formatter.formatToParts(0).find((part) => part.type === "currency")
      ?.value ?? ""
  );
}
