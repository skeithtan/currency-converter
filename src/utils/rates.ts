/// <reference path="../vite-env.d.ts" />

import type { Conversion } from "../types/Conversion.ts";

const RATES_URL = "https://openexchangerates.org/api/latest.json";
const CACHE_KEY = "fxConversion";
const CURRENCY_CODE_PATTERN = /^[A-Z]{3}$/;
const HOUR_MS = 60 * 60 * 1000;

/** Cached rates older than this are refreshed in the background. */
export const REFRESH_AFTER_MS = 12 * HOUR_MS;
/** Cached rates older than this are still used, but flagged as stale. */
export const STALE_AFTER_MS = 24 * HOUR_MS;
const FETCH_TIMEOUT_MS = 10_000;

type RatesStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export interface LoadedRates extends Conversion {
  fetchedAt: string;
}

export function convert(
  value: number,
  from: string,
  to: string,
  conversion: Conversion,
): number | undefined {
  const rateOf = (code: string): number | undefined =>
    code === conversion.base ? 1 : conversion.rates[code];
  const fromRate = rateOf(from);
  const toRate = rateOf(to);

  if (
    !Number.isFinite(value) ||
    !isFinitePositiveNumber(fromRate) ||
    !isFinitePositiveNumber(toRate)
  ) {
    return undefined;
  }

  const result = (value * toRate) / fromRate;
  return Number.isFinite(result) ? result : undefined;
}

export function ratesAgeMs(rates: LoadedRates, now: Date = new Date()): number {
  return now.getTime() - Date.parse(rates.fetchedAt);
}

export function needsRefresh(
  rates: LoadedRates,
  now: Date = new Date(),
): boolean {
  return ratesAgeMs(rates, now) > REFRESH_AFTER_MS;
}

export function isStale(rates: LoadedRates, now: Date = new Date()): boolean {
  return ratesAgeMs(rates, now) > STALE_AFTER_MS;
}

/**
 * Returns the saved rates, however old they are. Rates are never discarded
 * for age, only when the saved data is corrupt or timestamped in the future.
 */
export function readCachedRates(
  deps: { storage?: RatesStorage; now?: () => Date } = {},
): LoadedRates | undefined {
  const storage = deps.storage ?? localStorage;
  const now = deps.now?.() ?? new Date();
  const serialized = storage.getItem(CACHE_KEY);
  if (serialized === null) return undefined;

  try {
    const cache: unknown = JSON.parse(serialized);
    if (!isCachedRates(cache, now)) throw new Error("Invalid rates cache");
    return { base: cache.base, rates: cache.rates, fetchedAt: cache.fetchedAt };
  } catch {
    storage.removeItem(CACHE_KEY);
    return undefined;
  }
}

/**
 * Downloads the latest rates and saves them. Rejects on any network, HTTP, or
 * validation failure (or after a timeout), leaving the saved rates untouched.
 */
export async function fetchRates(
  deps: {
    storage?: RatesStorage;
    fetchFn?: typeof fetch;
    now?: () => Date;
    timeoutMs?: number;
  } = {},
): Promise<LoadedRates> {
  const storage = deps.storage ?? localStorage;
  const fetchFn = deps.fetchFn ?? fetch;
  const now = deps.now ?? (() => new Date());
  const appId =
    typeof OPEN_EXCHANGE_APP_ID === "undefined" ? "" : OPEN_EXCHANGE_APP_ID;

  const response = await fetchFn(RATES_URL, {
    headers: { Authorization: `Token ${appId}` },
    signal: AbortSignal.timeout(deps.timeoutMs ?? FETCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Rates request failed with status ${response.status}`);
  }

  const payload: unknown = await response.json();
  if (!isConversion(payload)) {
    throw new Error("Rates response has an invalid shape");
  }

  const fetched: LoadedRates = {
    base: payload.base,
    rates: payload.rates,
    fetchedAt: now().toISOString(),
  };
  storage.setItem(CACHE_KEY, JSON.stringify(fetched));
  return fetched;
}

function isCachedRates(value: unknown, now: Date): value is LoadedRates {
  if (!isPlainObject(value) || !isConversion(value)) return false;

  const fetchedAt = value.fetchedAt;
  if (typeof fetchedAt !== "string") return false;

  const timestamp = Date.parse(fetchedAt);
  return Number.isFinite(timestamp) && timestamp <= now.getTime();
}

function isConversion(value: unknown): value is Conversion {
  if (!isPlainObject(value)) return false;
  if (
    typeof value.base !== "string" ||
    !CURRENCY_CODE_PATTERN.test(value.base) ||
    !isPlainObject(value.rates)
  ) {
    return false;
  }

  const rates = Object.entries(value.rates);
  return (
    rates.length > 0 &&
    rates.every(
      ([code, rate]) =>
        CURRENCY_CODE_PATTERN.test(code) && isFinitePositiveNumber(rate),
    )
  );
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isFinitePositiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}
