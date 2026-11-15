import assert from "node:assert/strict";
import { test } from "node:test";
import { showsWholeUnits, usesLargeAmounts } from "./currencyScale.ts";

const rates = {
  base: "USD",
  rates: {
    EUR: 0.862,
    VND: 25862,
    UZS: 12500,
    HUF: 330,
    JPY: 151.3,
    PHP: 58.1,
    INR: 88,
  },
};

test("currencies worth under a cent are shown in whole units", () => {
  assert.equal(showsWholeUnits("UZS", rates), true);
  assert.equal(showsWholeUnits("HUF", rates), true);
  assert.equal(showsWholeUnits("VND", rates), true);
  assert.equal(showsWholeUnits("EUR", rates), false);
  assert.equal(showsWholeUnits("PHP", rates), false);
  assert.equal(showsWholeUnits("UZS", undefined), false);
});

test("k and M shortcuts are offered where amounts run large", () => {
  assert.equal(usesLargeAmounts("VND", rates), true);
  assert.equal(usesLargeAmounts("JPY", rates), true);
  assert.equal(usesLargeAmounts("PHP", rates), true);
  assert.equal(usesLargeAmounts("INR", rates), true);
  assert.equal(usesLargeAmounts("EUR", rates), false);
  assert.equal(usesLargeAmounts("USD", rates), false);
  // Without rates there is no telling, so the shortcuts stay available.
  assert.equal(usesLargeAmounts("EUR", undefined), true);
});
