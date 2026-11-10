import type { SearchSuggestionData } from "../types/SearchSuggestionData.ts";
import { getAllCurrencies } from "./currencies.ts";

interface IndexedCurrency {
  code: string;
  name: string;
  nameUpper: string;
  nameWords: string[];
  emoji?: string;
  symbol?: string;
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

export function getPopularCurrencies(): SearchSuggestionData[] {
  const currencies = getIndexedCurrencies();
  return POPULAR_CODES
    .map((code) => currencies.find((c) => c.code === code))
    .filter((c): c is IndexedCurrency => c != null)
    .map(toSuggestion);
}

export function searchCurrencies(query: string): SearchSuggestionData[] {
  const currencies = getIndexedCurrencies();
  const term = query.trim().toUpperCase();
  if (term.length === 0) return getPopularCurrencies();

  const scored: { currency: IndexedCurrency; score: number }[] = [];

  for (const currency of currencies) {
    const score = scoreCurrency(currency, term);
    if (score > 0) {
      scored.push({ currency, score });
    }
  }

  // Sort by score desc, then alphabetically by code for stability
  scored.sort((a, b) =>
    b.score - a.score || a.currency.code.localeCompare(b.currency.code)
  );

  return scored.map(({ currency }) => toSuggestion(currency));
}

function getIndexedCurrencies(): IndexedCurrency[] {
  if (indexedCurrencies) return indexedCurrencies;

  indexedCurrencies = getAllCurrencies().map(
    ({ code, name, emoji, symbol }) => ({
      code,
      name,
      nameUpper: name.toUpperCase(),
      nameWords: name.toUpperCase().split(/\s+/),
      emoji,
      symbol,
    }),
  );
  return indexedCurrencies;
}

function scoreCurrency(currency: IndexedCurrency, term: string): number {
  const { code, nameUpper, nameWords } = currency;

  // Exact code match
  if (code === term) return 100;

  // Code starts with query
  if (code.startsWith(term)) return 80;

  // Name word starts with query (word boundary match)
  if (nameWords.some((word) => word.startsWith(term))) return 60;

  // Code contains query
  if (code.includes(term)) return 40;

  // Name contains query
  if (nameUpper.includes(term)) return 30;

  // Fuzzy: all characters of query appear in order in code or name
  if (fuzzyMatch(code, term)) return 15;
  if (fuzzyMatch(nameUpper, term)) return 10;

  return 0;
}

function fuzzyMatch(text: string, query: string): boolean {
  let qi = 0;
  for (let i = 0; i < text.length && qi < query.length; i++) {
    if (text[i] === query[qi]) qi++;
  }
  return qi === query.length;
}

function toSuggestion(c: IndexedCurrency): SearchSuggestionData {
  return {
    code: c.code,
    emoji: c.emoji,
    symbol: c.symbol,
    name: c.name,
  };
}
