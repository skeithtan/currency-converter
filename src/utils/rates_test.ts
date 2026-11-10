/// <reference lib="deno.ns" />

import {
  convert,
  fetchRates,
  isStale,
  type LoadedRates,
  needsRefresh,
  readCachedRates,
} from "./rates.ts";

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

async function rejection(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error("expected promise to reject");
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

Deno.test("readCachedRates keeps rates however old they are", () => {
  const storage = new FakeStorage([
    [CACHE_KEY, cacheAt("2023-06-01T00:00:00.000Z")],
  ]);

  const cached = readCachedRates({ storage, now: () => BASE_TIME });

  assertEquals(cached, {
    ...CACHED_RATES,
    fetchedAt: "2023-06-01T00:00:00.000Z",
  }, "months-old rates are still returned");
  assert(storage.removals === 0, "old rates must not be discarded");
});

Deno.test("readCachedRates returns undefined when nothing is saved", () => {
  const storage = new FakeStorage();
  assert(
    readCachedRates({ storage, now: () => BASE_TIME }) === undefined,
    "empty storage",
  );
});

Deno.test("readCachedRates discards a corrupt cache", () => {
  const storage = new FakeStorage([
    [CACHE_KEY, JSON.stringify({ fetchedAt: "2024-01-01T00:00:00Z" })],
  ]);

  assert(
    readCachedRates({ storage, now: () => BASE_TIME }) === undefined,
    "corrupt cache must not be returned",
  );
  assert(storage.removals === 1, "corrupt cache must be removed");
});

Deno.test("readCachedRates discards a cache timestamped in the future", () => {
  const storage = new FakeStorage([
    [CACHE_KEY, cacheAt("2024-01-03T00:00:00.000Z")],
  ]);

  assert(
    readCachedRates({ storage, now: () => BASE_TIME }) === undefined,
    "future cache must not be returned",
  );
  assert(storage.removals === 1, "future cache must be removed");
});

Deno.test("needsRefresh and isStale use 12 and 24 hour thresholds", () => {
  const at = (fetchedAt: string): LoadedRates => ({
    ...CACHED_RATES,
    fetchedAt,
  });

  // BASE_TIME is 2024-01-02T00:00Z.
  const elevenHours = at("2024-01-01T13:00:00.000Z");
  const thirteenHours = at("2024-01-01T11:00:00.000Z");
  const exactlyOneDay = at("2024-01-01T00:00:00.000Z");
  const overOneDay = at("2023-12-31T23:59:00.000Z");

  assert(!needsRefresh(elevenHours, BASE_TIME), "11 h: no refresh");
  assert(needsRefresh(thirteenHours, BASE_TIME), "13 h: refresh");
  assert(!isStale(thirteenHours, BASE_TIME), "13 h: not stale");
  assert(!isStale(exactlyOneDay, BASE_TIME), "24 h: not yet stale");
  assert(isStale(overOneDay, BASE_TIME), "over 24 h: stale");
});

Deno.test("fetchRates saves validated rates with a new timestamp", async () => {
  const storage = new FakeStorage([
    [CACHE_KEY, cacheAt("2024-01-01T00:00:00.000Z")],
  ]);
  const refreshed = { base: "EUR", rates: { USD: 1.25, JPY: 200 } };
  const fetchFn = (() => Promise.resolve(response(refreshed))) as typeof fetch;

  const fetched = await fetchRates({ storage, fetchFn, now: () => BASE_TIME });

  assertEquals(fetched, {
    ...refreshed,
    fetchedAt: BASE_TIME.toISOString(),
  }, "fetched rates");
  assert(storage.writes === 1, "successful fetch must write once");
  assertEquals(
    JSON.parse(storage.getItem(CACHE_KEY) ?? "null"),
    { ...refreshed, fetchedAt: BASE_TIME.toISOString() },
    "stored rates",
  );
});

Deno.test("fetchRates leaves saved rates untouched when offline", async () => {
  const saved = cacheAt("2023-06-01T00:00:00.000Z");
  const storage = new FakeStorage([[CACHE_KEY, saved]]);
  const fetchFn = (() => Promise.reject(new Error("offline"))) as typeof fetch;

  const error = await rejection(
    fetchRates({ storage, fetchFn, now: () => BASE_TIME }),
  );

  assert(error instanceof Error, "offline fetch must reject");
  assert(storage.writes === 0 && storage.removals === 0, "cache untouched");
  assert(storage.getItem(CACHE_KEY) === saved, "saved rates kept");
});

Deno.test("fetchRates rejects error responses and invalid data", async () => {
  const storage = new FakeStorage();
  const errorResponse =
    (() => Promise.resolve(response({ error: "quota" }, 429))) as typeof fetch;
  const invalidData = (() =>
    Promise.resolve(
      response({ base: "USD", rates: { EUR: -1 } }),
    )) as typeof fetch;

  for (const fetchFn of [errorResponse, invalidData]) {
    const error = await rejection(
      fetchRates({ storage, fetchFn, now: () => BASE_TIME }),
    );
    assert(error instanceof Error, "bad response must reject");
  }
  assert(storage.writes === 0, "bad responses must not be cached");
});

Deno.test("fetchRates gives up on a request that never answers", async () => {
  const storage = new FakeStorage();
  const fetchFn =
    ((_input: unknown, init?: RequestInit) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener(
          "abort",
          () => reject(init.signal?.reason),
        );
      })) as typeof fetch;

  const error = await rejection(
    fetchRates({ storage, fetchFn, now: () => BASE_TIME, timeoutMs: 10 }),
  );

  assert(error instanceof Error, "hung request must time out");
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
