import assert from "node:assert/strict";
import { test } from "node:test";
import { getAllCurrencies } from "./currencies.ts";
import { createCurrencyFormatter } from "./currencyFormat.ts";

const LOCALES = [
  undefined,
  "en-US",
  "en-GB",
  "fr-FR",
  "de-DE",
  "ru-RU",
  "ky-KG",
  "kk-KZ",
  "uz-UZ",
  "tr-TR",
  "ar-SA",
  "fil-PH",
  "ja-JP",
];

// Currency signs encoded in Unicode 14 or later (U+20C0 SOM SIGN onwards).
const TOO_NEW_SIGN = /[⃀-⃏]/;

/** Replaces the locale's non-breaking spaces so expectations stay readable. */
function format(code: string, locale: string | undefined, value: number) {
  return createCurrencyFormatter(code, locale)
    .format(value)
    .replace(/[  ]/g, " ");
}

test("no currency is formatted with a sign that fonts lack", () => {
  for (const { code } of getAllCurrencies()) {
    for (const locale of LOCALES) {
      const formatted = format(code, locale, 1234.5);
      assert.doesNotMatch(
        formatted,
        TOO_NEW_SIGN,
        `${code} in ${locale ?? "the default locale"}: ${formatted}`,
      );
    }
  }
});

test("the Kyrgyzstani som falls back to the locale's standard symbol", () => {
  assert.equal(format("KGS", "en-US", 2441.11), "KGS 2,441.11");
  assert.equal(format("KGS", "fr-FR", 2441.11), "2 441,11 KGS");
  assert.equal(format("KGS", "ky-KG", 2441.11), "2 441,11 сом");
});

test("other currencies keep their narrow symbol", () => {
  assert.equal(format("USD", "en-US", 27.91), "$27.91");
  assert.equal(format("USD", "fr-FR", 27.91), "27,91 $");
  assert.equal(format("EUR", "fr-FR", 25), "25,00 €");
  assert.equal(format("PHP", "fr-FR", 1762.68), "1 762,68 ₱");
  assert.equal(format("TRY", "fr-FR", 1402.38), "1 402,38 ₺");
  assert.equal(format("GBP", "en-US", 20.91), "£20.91");
  assert.equal(format("UZS", "fr-FR", 335726.19), "335 726,19 UZS");
});
