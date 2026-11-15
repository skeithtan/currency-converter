import type { Conversion } from "../types/Conversion.ts";
import { convert } from "./rates.ts";

/** Below this, a currency's cents are not worth showing. */
const NEGLIGIBLE_MINOR_UNIT_USD = 0.01;
/** Below this, everyday amounts run into thousands. */
const LARGE_AMOUNTS_UNIT_USD = 0.05;

/** What one unit of `code` is worth in US dollars. */
export function unitValueInUsd(
  code: string,
  rates: Conversion | undefined,
): number | undefined {
  return rates ? convert(1, code, "USD", rates) : undefined;
}

/**
 * Whether amounts are better shown without decimals: true for currencies like
 * the Uzbek som or the Hungarian forint, whose minor units are worth so little
 * that they have dropped out of use.
 */
export function showsWholeUnits(
  code: string,
  rates: Conversion | undefined,
): boolean {
  const value = unitValueInUsd(code, rates);
  return value !== undefined && value < NEGLIGIBLE_MINOR_UNIT_USD;
}

/**
 * Whether typical amounts run into thousands or millions, as with the
 * Vietnamese dong, so typing them deserves k and M shortcuts. Without rates
 * this errs towards offering them.
 */
export function usesLargeAmounts(
  code: string,
  rates: Conversion | undefined,
): boolean {
  const value = unitValueInUsd(code, rates);
  return value === undefined || value < LARGE_AMOUNTS_UNIT_USD;
}
