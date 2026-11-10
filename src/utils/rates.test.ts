import assert from "node:assert/strict";
import { test } from "node:test";
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

test("readCachedRates keeps rates however old they are", () => {
  const storage = new FakeStorage([
    [CACHE_KEY, cacheAt("2023-06-01T00:00:00.000Z")],
  ]);

  const cached = readCachedRates({ storage, now: () => BASE_TIME });

  assert.deepEqual(
    cached,
    { ...CACHED_RATES, fetchedAt: "2023-06-01T00:00:00.000Z" },
    "months-old rates are still returned",
  );
  assert.equal(storage.removals, 0, "old rates must not be discarded");
});

test("readCachedRates returns undefined when nothing is saved", () => {
  const storage = new FakeStorage();
  assert.equal(
    readCachedRates({ storage, now: () => BASE_TIME }),
    undefined,
    "empty storage",
  );
});

test("readCachedRates discards a corrupt cache", () => {
  const storage = new FakeStorage([
    [CACHE_KEY, JSON.stringify({ fetchedAt: "2024-01-01T00:00:00Z" })],
  ]);

  assert.equal(
    readCachedRates({ storage, now: () => BASE_TIME }),
    undefined,
    "corrupt cache must not be returned",
  );
  assert.equal(storage.removals, 1, "corrupt cache must be removed");
});

test("readCachedRates discards a cache timestamped in the future", () => {
  const storage = new FakeStorage([
    [CACHE_KEY, cacheAt("2024-01-03T00:00:00.000Z")],
  ]);

  assert.equal(
    readCachedRates({ storage, now: () => BASE_TIME }),
    undefined,
    "future cache must not be returned",
  );
  assert.equal(storage.removals, 1, "future cache must be removed");
});

test("needsRefresh and isStale use 12 and 24 hour thresholds", () => {
  const at = (fetchedAt: string): LoadedRates => ({
    ...CACHED_RATES,
    fetchedAt,
  });

  // BASE_TIME is 2024-01-02T00:00Z.
  const elevenHours = at("2024-01-01T13:00:00.000Z");
  const thirteenHours = at("2024-01-01T11:00:00.000Z");
  const exactlyOneDay = at("2024-01-01T00:00:00.000Z");
  const overOneDay = at("2023-12-31T23:59:00.000Z");

  assert.equal(needsRefresh(elevenHours, BASE_TIME), false, "11 h: no refresh");
  assert.equal(needsRefresh(thirteenHours, BASE_TIME), true, "13 h: refresh");
  assert.equal(isStale(thirteenHours, BASE_TIME), false, "13 h: not stale");
  assert.equal(isStale(exactlyOneDay, BASE_TIME), false, "24 h: not stale");
  assert.equal(isStale(overOneDay, BASE_TIME), true, "over 24 h: stale");
});

test("fetchRates saves validated rates with a new timestamp", async () => {
  const storage = new FakeStorage([
    [CACHE_KEY, cacheAt("2024-01-01T00:00:00.000Z")],
  ]);
  const refreshed = { base: "EUR", rates: { USD: 1.25, JPY: 200 } };
  const fetchFn = (() => Promise.resolve(response(refreshed))) as typeof fetch;

  const fetched = await fetchRates({ storage, fetchFn, now: () => BASE_TIME });

  const expected = { ...refreshed, fetchedAt: BASE_TIME.toISOString() };
  assert.deepEqual(fetched, expected, "fetched rates");
  assert.equal(storage.writes, 1, "successful fetch must write once");
  assert.deepEqual(
    JSON.parse(storage.getItem(CACHE_KEY) ?? "null"),
    expected,
    "stored rates",
  );
});

test("fetchRates leaves saved rates untouched when offline", async () => {
  const saved = cacheAt("2023-06-01T00:00:00.000Z");
  const storage = new FakeStorage([[CACHE_KEY, saved]]);
  const fetchFn = (() => Promise.reject(new Error("offline"))) as typeof fetch;

  await assert.rejects(
    fetchRates({ storage, fetchFn, now: () => BASE_TIME }),
    Error,
    "offline fetch must reject",
  );
  assert.equal(storage.writes, 0, "cache must not be written");
  assert.equal(storage.removals, 0, "cache must not be removed");
  assert.equal(storage.getItem(CACHE_KEY), saved, "saved rates kept");
});

test("fetchRates rejects error responses and invalid data", async () => {
  const storage = new FakeStorage();
  const errorResponse = (() =>
    Promise.resolve(response({ error: "quota" }, 429))) as typeof fetch;
  const invalidData = (() =>
    Promise.resolve(
      response({ base: "USD", rates: { EUR: -1 } }),
    )) as typeof fetch;

  for (const fetchFn of [errorResponse, invalidData]) {
    await assert.rejects(
      fetchRates({ storage, fetchFn, now: () => BASE_TIME }),
      Error,
      "bad response must reject",
    );
  }
  assert.equal(storage.writes, 0, "bad responses must not be cached");
});

test("fetchRates gives up on a request that never answers", async () => {
  const storage = new FakeStorage();
  const fetchFn = ((_input: unknown, init?: RequestInit) =>
    new Promise((_resolve, reject) => {
      // A real pending request holds a socket open. Without an equivalent
      // handle Node would exit before AbortSignal.timeout(), whose timer
      // does not keep the process alive, gets to fire.
      const pending = setInterval(() => {}, 1_000);
      init?.signal?.addEventListener("abort", () => {
        clearInterval(pending);
        reject(init.signal?.reason);
      });
    })) as typeof fetch;

  await assert.rejects(
    fetchRates({ storage, fetchFn, now: () => BASE_TIME, timeoutMs: 10 }),
    Error,
    "hung request must time out",
  );
});

test("convert handles identity, base, cross-rate, and missing currencies", () => {
  assert.equal(convert(10, "EUR", "EUR", CACHED_RATES), 10, "identity");
  assert.equal(convert(10, "USD", "EUR", CACHED_RATES), 8, "base conversion");
  assert.equal(
    convert(10, "EUR", "JPY", CACHED_RATES),
    2000,
    "cross-rate conversion",
  );
  assert.equal(
    convert(10, "USD", "GBP", CACHED_RATES),
    undefined,
    "missing currency",
  );
});
