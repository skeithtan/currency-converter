import currencyEmojiFlags from "country-currency-emoji-flags";
import currencySymbolMap from "currency-symbol-map/map.js";

export interface CurrencyInfo {
  code: string;
  name: string;
  emoji?: string;
  symbol?: string;
}

const CURRENCY_CODE_PATTERN = /^[A-Z]{3}$/;
const emojis = currencyEmojiFlags.currencyData;
const symbols = currencySymbolMap;
const displayNames = createDisplayNames();
let currencies: CurrencyInfo[] | undefined;

export function getAllCurrencies(): CurrencyInfo[] {
  if (currencies) return currencies;

  const codes = new Set([...Object.keys(emojis), ...Object.keys(symbols)]);
  currencies = [...codes]
    .filter((code) => CURRENCY_CODE_PATTERN.test(code))
    .sort()
    .map((code) => ({
      code,
      name: getCurrencyName(code),
      emoji: emojis[code],
      symbol: symbols[code],
    }));

  return currencies;
}

function createDisplayNames(): Intl.DisplayNames {
  const language = typeof navigator !== "undefined" ? navigator.language : "en";
  try {
    return new Intl.DisplayNames([language], { type: "currency" });
  } catch {
    return new Intl.DisplayNames(["en"], { type: "currency" });
  }
}

function getCurrencyName(code: string): string {
  try {
    const name = displayNames.of(code);
    return name && name !== code ? name : code;
  } catch {
    return code;
  }
}
