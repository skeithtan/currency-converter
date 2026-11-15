import assert from "node:assert/strict";
import { test } from "node:test";
import { getAllCurrencies } from "./currencies.ts";
import { countryForTimeZone, currenciesForCountry } from "./countries.ts";
import { getLocalCurrency, searchCurrencies } from "./currencySearch.ts";

const codes = (query: string) =>
  searchCurrencies(query).map(({ code }) => code);

test("currency codes and names still match first", () => {
  assert.equal(codes("vnd")[0], "VND");
  assert.equal(codes("euro")[0], "EUR");
  assert.equal(codes("yen")[0], "JPY");
});

test("countries find the currencies they use", () => {
  assert.equal(codes("vietnam")[0], "VND");
  assert.equal(codes("uzbekistan")[0], "UZS");

  const germany = searchCurrencies("germany");
  assert.equal(germany[0]?.code, "EUR");
  assert.equal(germany[0]?.matchedCountry, "Germany");

  const panama = searchCurrencies("panama");
  assert.deepEqual(
    panama.slice(0, 2).map(({ code }) => code),
    ["PAB", "USD"],
  );
  assert.equal(panama[1]?.matchedCountry, "Panama");
  // The balboa matched by its own name, so no country is shown for it.
  assert.equal(panama[0]?.matchedCountry, undefined);
});

test("search ignores accents and case", () => {
  const ivoryCoast = searchCurrencies("cote d'ivoire");
  assert.equal(ivoryCoast[0]?.code, "XOF");
  assert.equal(codes("CURACAO")[0], codes("Curaçao")[0]);
});

test("every country in the table uses at least one known currency", () => {
  const known = new Set(getAllCurrencies().map(({ code }) => code));
  for (const country of ["US", "DE", "VN", "UZ", "BG", "CW", "SL", "ZW"]) {
    assert.ok(
      currenciesForCountry(country, known).length > 0,
      `${country} has no known currency`,
    );
  }
});

test("every time zone the platform knows maps to a country", () => {
  const unmapped = Intl.supportedValuesOf("timeZone").filter(
    (zone) => !zone.startsWith("Etc/") && !countryForTimeZone(zone),
  );
  assert.deepEqual(unmapped, []);
});

test("the time zone suggests the local currency, legacy names included", () => {
  const saigon = getLocalCurrency("Asia/Saigon");
  assert.equal(saigon?.currency.code, "VND");
  assert.equal(saigon?.countryName, "Vietnam");
  assert.equal(getLocalCurrency("Asia/Ho_Chi_Minh")?.currency.code, "VND");
  assert.equal(getLocalCurrency("Asia/Calcutta")?.currency.code, "INR");
  assert.equal(getLocalCurrency("Europe/Kiev")?.currency.code, "UAH");
  assert.equal(getLocalCurrency("America/Panama")?.currency.code, "USD");
  assert.equal(getLocalCurrency("Etc/UTC"), undefined);
  assert.equal(getLocalCurrency("Not/A_Zone"), undefined);
});
