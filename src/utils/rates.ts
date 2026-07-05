/// <reference path="../vite-env.d.ts" />

import type { Conversion } from "../types/Conversion.ts";

const RATES_URL = "https://openexchangerates.org/api/latest.json";
const CACHE_KEY = "fxConversion";
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const CURRENCY_CODE_PATTERN = /^[A-Z]{3}$/;

type RatesStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

interface CachedRates extends Conversion {
  fetchedAt: string;
}

export class RatesUnavailableError extends Error {
  constructor(message = "No conversion rates are available offline") {
    super(message);
    this.name = "RatesUnavailableError";
  }
}

export interface LoadedRates extends Conversion {
  fetchedAt: string;
  isStale: boolean;
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
    !Number.isFinite(value) || !isFinitePositiveNumber(fromRate) ||
    !isFinitePositiveNumber(toRate)
  ) {
    return undefined;
  }

  const result = value * toRate / fromRate;
  return Number.isFinite(result) ? result : undefined;
}

export async function loadRates(
  deps: {
    storage?: RatesStorage;
    fetchFn?: typeof fetch;
    now?: () => Date;
  } = {},
): Promise<LoadedRates> {
  const storage = deps.storage ?? localStorage;
  const fetchFn = deps.fetchFn ?? fetch;
  const now = deps.now ?? (() => new Date());
  const currentTime = now();
  const cache = readCache(storage, currentTime);

  if (
    cache && currentTime.getTime() - Date.parse(cache.fetchedAt) <= CACHE_TTL_MS
  ) {
    return { ...cache, isStale: false };
  }

  let conversion: Conversion;
  try {
    const appId = typeof OPEN_EXCHANGE_APP_ID === "undefined"
      ? ""
      : OPEN_EXCHANGE_APP_ID;
    const response = await fetchFn(RATES_URL, {
      headers: { Authorization: `Token ${appId}` },
    });

    if (!response.ok) {
      throw new Error(`Rates request failed with status ${response.status}`);
    }

    const payload: unknown = await response.json();
    if (!isConversion(payload)) {
      throw new Error("Rates response has an invalid shape");
    }
    conversion = payload;
  } catch {
    if (cache) {
      return { ...cache, isStale: true };
    }
    throw new RatesUnavailableError();
  }

  const fetchedAt = now().toISOString();
  const storedRates: CachedRates = {
    base: conversion.base,
    rates: conversion.rates,
    fetchedAt,
  };
  storage.setItem(CACHE_KEY, JSON.stringify(storedRates));
  return { ...storedRates, isStale: false };
}

function readCache(storage: RatesStorage, now: Date): CachedRates | undefined {
  const serialized = storage.getItem(CACHE_KEY);
  if (serialized === null) return undefined;

  try {
    const cache: unknown = JSON.parse(serialized);
    if (!isCachedRates(cache, now)) throw new Error("Invalid rates cache");
    return cache;
  } catch {
    storage.removeItem(CACHE_KEY);
    return undefined;
  }
}

function isCachedRates(value: unknown, now: Date): value is CachedRates {
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
  return rates.length > 0 &&
    rates.every(([code, rate]) =>
      CURRENCY_CODE_PATTERN.test(code) && isFinitePositiveNumber(rate)
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
