import fx from "money";
import { Conversion } from "../types/Conversion.ts";

const CONVERSION_KEY = "fxConversion";
const CACHE_TIME_TO_LIVE_HOURS = 6;
const OPEN_EXCHANGE_RATES_URL = "https://openexchangerates.org/api/latest.json";

interface ConversionCache extends Conversion {
  fetchedAt: Date;
}

export async function loadConversionRates() {
  const conversion = await getConversion();
  setConversionCache(conversion);

  if (fx.rates) {
    fx.rates = conversion.rates;
    fx.base = conversion.base;
  }
}

async function getConversion(): Promise<Conversion> {
  const cache = tryGetConversionCache();
  if (cache) {
    return cache;
  }

  const response = await fetch(OPEN_EXCHANGE_RATES_URL, {
    headers: {
      "Authorization": `Token ${OPEN_EXCHANGE_APP_ID}`,
    },
  });

  return await response.json();
}

function setConversionCache(
  { rates, base }: Conversion,
  fetchedAt = new Date(),
) {
  localStorage.setItem(
    CONVERSION_KEY,
    JSON.stringify({
      rates,
      base,
      fetchedAt: fetchedAt.toISOString(),
    }),
  );
}

function tryGetConversionCache() {
  const conversionCache = localStorage.getItem(CONVERSION_KEY);
  if (conversionCache) {
    try {
      const data: ConversionCache = JSON.parse(conversionCache);
      const lastFetchedAt = new Date(data.fetchedAt);
      const timeDifference = new Date().getTime() - lastFetchedAt.getTime();
      const hoursDifference = Math.abs(timeDifference / (1000 * 3600));

      if (hoursDifference > CACHE_TIME_TO_LIVE_HOURS) {
        return undefined;
      }

      return data;
    } catch {
      localStorage.removeItem(CONVERSION_KEY); // Possibly corrupt
      return undefined;
    }
  }
}
