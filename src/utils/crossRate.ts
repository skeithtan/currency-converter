import type { Conversion } from "../types/Conversion.ts";
import { convert } from "./rates.ts";

/**
 * Describes the exchange rate between two currencies the way people quote it,
 * with the more valuable currency on the left: "1 EUR = 30,000 VND" rather
 * than "1 VND = 0.0000333 EUR".
 */
export function describeCrossRate(
  code: string,
  otherCode: string,
  rates: Conversion,
  locales?: Intl.LocalesArgument,
): string | undefined {
  const rate = convert(1, code, otherCode, rates);
  if (rate === undefined || rate <= 0) return undefined;

  const [from, to, value] =
    rate >= 1 ? [code, otherCode, rate] : [otherCode, code, 1 / rate];
  return `1 ${from} = ${formatRate(value, locales)} ${to}`;
}

function formatRate(value: number, locales?: Intl.LocalesArgument): string {
  // Four significant digits are plenty for a rate; large ones are shown whole
  // rather than rounded to "25,860".
  const options: Intl.NumberFormatOptions =
    value >= 1000
      ? { maximumFractionDigits: 0 }
      : { maximumSignificantDigits: 4 };
  return new Intl.NumberFormat(locales, options).format(value);
}
