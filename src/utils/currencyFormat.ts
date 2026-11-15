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
  { wholeUnits = false }: { wholeUnits?: boolean } = {},
): Intl.NumberFormat {
  const create = (currencyDisplay: "narrowSymbol" | "symbol" | "code") =>
    new Intl.NumberFormat(locales, {
      style: "currency",
      currency,
      currencyDisplay,
      useGrouping: true,
      ...(wholeUnits && { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
    });

  for (const currencyDisplay of ["narrowSymbol", "symbol"] as const) {
    const formatter = create(currencyDisplay);
    if (!TOO_NEW_SIGN.test(currencySymbol(formatter))) return formatter;
  }
  // ISO 4217 codes are plain Latin letters, which every font has.
  return create("code");
}

export interface AmountFormatter {
  format(value: number): string;
  /** The sign shown with amounts, or undefined when only the code exists. */
  symbol: string | undefined;
}

/**
 * Formats amounts for a row that already names its currency. Where the only
 * sign available is the ISO code itself ("UZS 580,000"), the amount is shown
 * bare ("580,000") rather than repeating the code beside it.
 *
 * `wholeUnits` drops the minor unit, for currencies whose cents are worth too
 * little to matter (the Uzbek tiyin, the Hungarian fillér).
 */
export function createAmountFormatter(
  currency: string,
  {
    locales,
    wholeUnits = false,
  }: { locales?: Intl.LocalesArgument; wholeUnits?: boolean } = {},
): AmountFormatter {
  const formatter = createCurrencyFormatter(currency, locales, { wholeUnits });
  const symbol = currencySymbol(formatter);
  if (symbol !== currency) {
    return { format: (value) => formatter.format(value), symbol };
  }

  const { minimumFractionDigits, maximumFractionDigits } =
    formatter.resolvedOptions();
  const numberFormatter = new Intl.NumberFormat(locales, {
    minimumFractionDigits,
    maximumFractionDigits,
    useGrouping: true,
  });
  return {
    format: (value) => numberFormatter.format(value),
    symbol: undefined,
  };
}

function currencySymbol(formatter: Intl.NumberFormat): string {
  return (
    formatter.formatToParts(0).find((part) => part.type === "currency")
      ?.value ?? ""
  );
}
