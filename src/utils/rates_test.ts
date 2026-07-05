/// <reference lib="deno.ns" />

import { convert, loadRates, RatesUnavailableError } from "./rates.ts";

const CACHE_KEY = "fxConversion";
const BASE_TIME = new Date("2024-01-02T00:00:00.000Z");
const CACHED_RATES = {
  base: "USD",
  rates: { EUR: 0.8, JPY: 160 },
};

class FakeStorage {
  readonly values: Map<string, string>;
  writes = 0;
  removals = 0;

  constructor(entries: [string, string][] = []) {
    this.values = new Map(entries);
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.writes++;
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.removals++;
    this.values.delete(key);
  }
}

function cacheAt(fetchedAt: string): string {
  return JSON.stringify({ ...CACHED_RATES, fetchedAt });
}

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEquals(
  actual: unknown,
  expected: unknown,
  message: string,
): void {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(`${message}: expected ${expectedJson}, got ${actualJson}`);
  }
}

Deno.test("loadRates returns a fresh cache without fetching or writing", async () => {
  const storage = new FakeStorage([
    [CACHE_KEY, cacheAt("2024-01-01T18:00:00.000Z")],
  ]);
  let fetchCalls = 0;
  const fetchFn = (() => {
    fetchCalls++;
    return Promise.resolve(response(CACHED_RATES));
  }) as typeof fetch;

  const loaded = await loadRates({ storage, fetchFn, now: () => BASE_TIME });

  assertEquals(loaded, {
    ...CACHED_RATES,
    fetchedAt: "2024-01-01T18:00:00.000Z",
    isStale: false,
  }, "fresh cache result");
  assert(fetchCalls === 0, "fresh cache must not fetch");
  assert(storage.writes === 0, "fresh cache must not be rewritten");
});

Deno.test("loadRates refreshes an expired cache and writes a new timestamp", async () => {
  const storage = new FakeStorage([
    [CACHE_KEY, cacheAt("2024-01-01T00:00:00.000Z")],
  ]);
  const refreshed = { base: "EUR", rates: { USD: 1.25, JPY: 200 } };
  const fetchFn = (() => Promise.resolve(response(refreshed))) as typeof fetch;

  const loaded = await loadRates({ storage, fetchFn, now: () => BASE_TIME });

  assertEquals(loaded, {
    ...refreshed,
    fetchedAt: BASE_TIME.toISOString(),
    isStale: false,
  }, "refreshed rates");
  assert(storage.writes === 1, "successful refresh must write once");
  assertEquals(
    JSON.parse(storage.getItem(CACHE_KEY) ?? "null"),
    { ...refreshed, fetchedAt: BASE_TIME.toISOString() },
    "stored refresh",
  );
});

Deno.test("loadRates returns expired cache as stale after a network error", async () => {
  const storage = new FakeStorage([
    [CACHE_KEY, cacheAt("2024-01-01T00:00:00.000Z")],
  ]);
  const fetchFn = (() => Promise.reject(new Error("offline"))) as typeof fetch;

  const loaded = await loadRates({ storage, fetchFn, now: () => BASE_TIME });

  assert(loaded.isStale, "expired fallback must be marked stale");
  assertEquals(loaded.rates, CACHED_RATES.rates, "stale rates");
  assert(storage.writes === 0, "stale fallback must not be rewritten");
});

Deno.test("loadRates throws RatesUnavailableError when offline without cache", async () => {
  const storage = new FakeStorage();
  const fetchFn = (() => Promise.reject(new Error("offline"))) as typeof fetch;
  let error: unknown;

  try {
    await loadRates({ storage, fetchFn, now: () => BASE_TIME });
  } catch (caught) {
    error = caught;
  }

  assert(
    error instanceof RatesUnavailableError,
    "expected RatesUnavailableError",
  );
});

Deno.test("loadRates discards poisoned cache and rejects non-ok response data", async () => {
  const storage = new FakeStorage([
    [CACHE_KEY, JSON.stringify({ fetchedAt: "2024-01-01T00:00:00Z" })],
  ]);
  const fetchFn =
    (() =>
      Promise.resolve(response({ error: "offline" }, 503))) as typeof fetch;
  let error: unknown;

  try {
    await loadRates({ storage, fetchFn, now: () => BASE_TIME });
  } catch (caught) {
    error = caught;
  }

  assert(error instanceof RatesUnavailableError, "non-ok response must fail");
  assert(storage.removals === 1, "poisoned cache must be removed");
  assert(storage.writes === 0, "error response must not be cached");
  assert(
    storage.getItem(CACHE_KEY) === null,
    "error data must not be returned",
  );
});

Deno.test("loadRates rejects a cache timestamp from the future", async () => {
  const storage = new FakeStorage([
    [CACHE_KEY, cacheAt("2024-01-03T00:00:00.000Z")],
  ]);
  const fetched = { base: "GBP", rates: { USD: 1.3 } };
  const fetchFn = (() => Promise.resolve(response(fetched))) as typeof fetch;

  const loaded = await loadRates({ storage, fetchFn, now: () => BASE_TIME });

  assertEquals(loaded.base, "GBP", "future cache must not be used");
  assert(storage.removals === 1, "future cache must be removed");
  assert(storage.writes === 1, "replacement rates must be cached");
});

Deno.test("convert handles identity, base, cross-rate, and missing currencies", () => {
  assert(convert(10, "EUR", "EUR", CACHED_RATES) === 10, "identity");
  assert(convert(10, "USD", "EUR", CACHED_RATES) === 8, "base conversion");
  assert(
    convert(10, "EUR", "JPY", CACHED_RATES) === 2000,
    "cross-rate conversion",
  );
  assert(
    convert(10, "USD", "GBP", CACHED_RATES) === undefined,
    "missing currency",
  );
});
