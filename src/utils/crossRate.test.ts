import assert from "node:assert/strict";
import { test } from "node:test";
import { describeCrossRate } from "./crossRate.ts";

const rates = {
  base: "USD",
  rates: { EUR: 0.862, VND: 25862, JPY: 151.3, UZS: 12500, BHD: 0.376 },
};

test("the more valuable currency is quoted first", () => {
  assert.equal(
    describeCrossRate("VND", "EUR", rates, "en-US"),
    "1 EUR = 30,002 VND",
  );
  assert.equal(
    describeCrossRate("EUR", "VND", rates, "en-US"),
    "1 EUR = 30,002 VND",
  );
  assert.equal(
    describeCrossRate("USD", "EUR", rates, "en-US"),
    "1 EUR = 1.16 USD",
  );
});

test("rates under a thousand keep four significant digits", () => {
  assert.equal(
    describeCrossRate("JPY", "USD", rates, "en-US"),
    "1 USD = 151.3 JPY",
  );
  assert.equal(
    describeCrossRate("BHD", "USD", rates, "en-US"),
    "1 BHD = 2.66 USD",
  );
});

test("unknown currencies have no rate", () => {
  assert.equal(describeCrossRate("XXX", "USD", rates, "en-US"), undefined);
});
