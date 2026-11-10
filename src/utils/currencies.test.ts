import assert from "node:assert/strict";
import { test } from "node:test";
import { getAllCurrencies } from "./currencies.ts";

test("getAllCurrencies returns valid memoized currency metadata", () => {
  const currencies = getAllCurrencies();
  const secondResult = getAllCurrencies();

  assert.ok(currencies.length > 0, "currency list must not be empty");
  assert.ok(
    currencies.every(({ code }) => /^[A-Z]{3}$/.test(code)),
    "all currency codes must be three uppercase letters",
  );

  const usd = currencies.find(({ code }) => code === "USD");
  const eur = currencies.find(({ code }) => code === "EUR");
  assert.ok(usd !== undefined, "currency list must contain USD");
  assert.ok(eur !== undefined, "currency list must contain EUR");
  assert.ok(usd.name.length > 0, "USD must have a non-empty name");
  assert.ok(
    typeof usd.symbol === "string" && usd.symbol.length > 0,
    "USD must have a symbol",
  );
  assert.equal(currencies, secondResult, "currency list must be memoized");
});
