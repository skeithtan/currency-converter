import type { SearchSuggestionData } from "../types/SearchSuggestionData.ts";
import { getAllCurrencies } from "./currencies.ts";
import {
  countryForTimeZone,
  currenciesForCountry,
  getCountries,
  getCountryName,
} from "./countries.ts";

interface SearchKey {
  /** Upper case, without accents. */
  full: string;
  words: string[];
}

interface IndexedCountry extends SearchKey {
  name: string;
}

interface IndexedCurrency {
  code: string;
  name: string;
  nameKey: SearchKey;
  countries: IndexedCountry[];
  emoji?: string;
  symbol?: string;
}

interface Match {
  score: number;
  country?: string;
}

const POPULAR_CODES = [
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "CAD",
  "AUD",
  "CHF",
  "CNY",
  "KRW",
  "PHP",
  "SGD",
  "HKD",
  "INR",
  "MXN",
  "BRL",
  "THB",
];

let indexedCurrencies: IndexedCurrency[] | undefined;
let currencyByCode: Map<string, IndexedCurrency> | undefined;

export function getPopularCurrencies(): SearchSuggestionData[] {
  return POPULAR_CODES.flatMap((code) => {
    const currency = getCurrency(code);
    return currency ? [currency] : [];
  });
}

/** Every currency, ordered by code. */
export function getAllSuggestions(): SearchSuggestionData[] {
  return getIndexedCurrencies().map((currency) => toSuggestion(currency));
}

export function getCurrency(code: string): SearchSuggestionData | undefined {
  getIndexedCurrencies();
  const currency = currencyByCode?.get(code);
  return currency ? toSuggestion(currency) : undefined;
}

/**
 * Matches currencies by code, by name and by the countries that use them, so
 * "vietnam" finds VND and "panama" finds the US dollar as well as the balboa.
 */
export function searchCurrencies(query: string): SearchSuggestionData[] {
  const term = normalize(query.trim());
  if (term.length === 0) return getPopularCurrencies();

  const matches: { currency: IndexedCurrency; match: Match }[] = [];
  for (const currency of getIndexedCurrencies()) {
    const match = scoreCurrency(currency, term);
    if (match.score > 0) matches.push({ currency, match });
  }

  // Best score first, then alphabetically by code for stability.
  matches.sort(
    (a, b) =>
      b.match.score - a.match.score ||
      a.currency.code.localeCompare(b.currency.code),
  );

  return matches.map(({ currency, match }) =>
    toSuggestion(currency, match.country),
  );
}

export interface LocalCurrency {
  countryName: string;
  currency: SearchSuggestionData;
}

/**
 * The currency of the country the device's time zone is in. Phones switch
 * time zone on arrival, so this follows a traveller without asking for
 * location access.
 */
export function getLocalCurrency(timeZone?: string): LocalCurrency | undefined {
  const zone = timeZone ?? currentTimeZone();
  if (!zone) return undefined;

  const country = countryForTimeZone(zone);
  if (!country) return undefined;

  getIndexedCurrencies();
  const knownCodes = new Set(currencyByCode?.keys());
  const [code] = currenciesForCountry(country, knownCodes);
  const currency = code ? getCurrency(code) : undefined;
  const countryName = getCountryName(country);
  return currency && countryName ? { countryName, currency } : undefined;
}

function getIndexedCurrencies(): IndexedCurrency[] {
  if (indexedCurrencies) return indexedCurrencies;

  const currencies = getAllCurrencies();
  const knownCodes = new Set(currencies.map(({ code }) => code));
  const countriesByCurrency = new Map<string, IndexedCountry[]>();
  for (const country of getCountries(knownCodes)) {
    for (const code of country.currencies) {
      const list = countriesByCurrency.get(code) ?? [];
      for (const name of country.names) {
        list.push({ name, ...searchKey(name) });
      }
      countriesByCurrency.set(code, list);
    }
  }

  indexedCurrencies = currencies.map(({ code, name, emoji, symbol }) => ({
    code,
    name,
    nameKey: searchKey(name),
    countries: countriesByCurrency.get(code) ?? [],
    emoji,
    symbol,
  }));
  currencyByCode = new Map(
    indexedCurrencies.map((currency) => [currency.code, currency]),
  );
  return indexedCurrencies;
}

function scoreCurrency(currency: IndexedCurrency, term: string): Match {
  const { code, nameKey, countries } = currency;

  if (code === term) return { score: 100 };
  if (code.startsWith(term)) return { score: 80 };
  // "Euro" before "WIR Euro": a name that starts with the query beats one
  // with a later word that does.
  if (nameKey.full.startsWith(term)) return { score: 65 };
  if (startsWithWord(nameKey, term)) return { score: 60 };

  const countryStart =
    countries.find((country) => country.full.startsWith(term)) ??
    countries.find((country) => startsWithWord(country, term));
  if (countryStart) return { score: 55, country: countryStart.name };

  if (code.includes(term)) return { score: 40 };
  if (nameKey.full.includes(term)) return { score: 30 };

  const countryContains = countries.find((country) =>
    country.full.includes(term),
  );
  if (countryContains) return { score: 25, country: countryContains.name };

  // Fuzzy: every character of the query appears in order.
  if (fuzzyMatch(code, term)) return { score: 15 };
  if (fuzzyMatch(nameKey.full, term)) return { score: 10 };

  return { score: 0 };
}

function startsWithWord(key: SearchKey, term: string): boolean {
  return (
    key.full.startsWith(term) || key.words.some((word) => word.startsWith(term))
  );
}

function fuzzyMatch(text: string, query: string): boolean {
  let qi = 0;
  for (let i = 0; i < text.length && qi < query.length; i++) {
    if (text[i] === query[qi]) qi++;
  }
  return qi === query.length;
}

function searchKey(text: string): SearchKey {
  const full = normalize(text);
  return { full, words: full.split(/[\s\-‐(),.]+/).filter(Boolean) };
}

/**
 * Upper case without accents or apostrophes, so "cote divoire" and
 * "côte d'ivoire" both find "Côte d’Ivoire", and "paanga" the paʻanga.
 */
function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\p{M}'’‘ʼʻ`]/gu, "")
    .toUpperCase();
}

function currentTimeZone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
}

function toSuggestion(
  currency: IndexedCurrency,
  matchedCountry?: string,
): SearchSuggestionData {
  return {
    code: currency.code,
    name: currency.name,
    emoji: currency.emoji,
    symbol: currency.symbol,
    ...(matchedCountry && { matchedCountry }),
  };
}
