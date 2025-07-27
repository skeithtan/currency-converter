import { CurrencyRecord } from "../types/Conversion.ts";

const CURRENCY_KEY = "currencies";
const OPEN_EXCHANGE_RATES_URL =
  "https://openexchangerates.org/api/currencies.json";

export async function loadCurrencies(): Promise<CurrencyRecord> {
  const cache = tryGetCurrenciesCache();
  if (cache) {
    return cache;
  }

  const response = await fetch(OPEN_EXCHANGE_RATES_URL, {
    headers: {
      "Authorization": `Token ${OPEN_EXCHANGE_APP_ID}`,
    },
  });

  const currencies = await response.json();
  localStorage.setItem(CURRENCY_KEY, JSON.stringify(currencies));

  return currencies;
}

function tryGetCurrenciesCache() {
  const currenciesCache = localStorage.getItem(CURRENCY_KEY);
  if (currenciesCache) {
    try {
      const data: CurrencyRecord = JSON.parse(currenciesCache);

      if (typeof data !== "object") {
        throw new Error("Found unexpected type for currencies.");
      }

      return data;
    } catch {
      localStorage.removeItem(CURRENCY_KEY); // Possibly corrupt
      return undefined;
    }
  }
}
