/// <reference lib="deno.ns" />

import { getAllCurrencies } from "./currencies.ts";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

Deno.test("getAllCurrencies returns valid memoized currency metadata", () => {
  const currencies = getAllCurrencies();
  const secondResult = getAllCurrencies();

  assert(currencies.length > 0, "currency list must not be empty");
  assert(
    currencies.every(({ code }) => /^[A-Z]{3}$/.test(code)),
    "all currency codes must be three uppercase letters",
  );

  const usd = currencies.find(({ code }) => code === "USD");
  const eur = currencies.find(({ code }) => code === "EUR");
  assert(usd !== undefined, "currency list must contain USD");
  assert(eur !== undefined, "currency list must contain EUR");
  assert(usd.name.length > 0, "USD must have a non-empty name");
  assert(
    typeof usd.symbol === "string" && usd.symbol.length > 0,
    "USD must have a symbol",
  );
  assert(currencies === secondResult, "currency list must be memoized");
});
