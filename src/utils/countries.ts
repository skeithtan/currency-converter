import { TIME_ZONES_BY_COUNTRY } from "./timeZoneCountries.ts";

/**
 * Currencies in everyday use, keyed by ISO 3166 country code, the most common
 * first. Codes the currency list lacks (a recent ISO change, say) are dropped
 * wherever this is read.
 */
const CURRENCIES_BY_COUNTRY: Record<string, string> = {
  AD: "EUR",
  AE: "AED",
  AF: "AFN",
  AG: "XCD",
  AI: "XCD",
  AL: "ALL",
  AM: "AMD",
  AO: "AOA",
  AR: "ARS",
  AS: "USD",
  AT: "EUR",
  AU: "AUD",
  AW: "AWG",
  AX: "EUR",
  AZ: "AZN",
  BA: "BAM",
  BB: "BBD",
  BD: "BDT",
  BE: "EUR",
  BF: "XOF",
  BG: "EUR BGN",
  BH: "BHD",
  BI: "BIF",
  BJ: "XOF",
  BL: "EUR",
  BM: "BMD",
  BN: "BND",
  BO: "BOB",
  BQ: "USD",
  BR: "BRL",
  BS: "BSD",
  BT: "BTN INR",
  BV: "NOK",
  BW: "BWP",
  BY: "BYN",
  BZ: "BZD",
  CA: "CAD",
  CC: "AUD",
  CD: "CDF",
  CF: "XAF",
  CG: "XAF",
  CH: "CHF",
  CI: "XOF",
  CK: "NZD",
  CL: "CLP",
  CM: "XAF",
  CN: "CNY",
  CO: "COP",
  CR: "CRC",
  CU: "CUP",
  CV: "CVE",
  CW: "XCG ANG",
  CX: "AUD",
  CY: "EUR",
  CZ: "CZK",
  DE: "EUR",
  DJ: "DJF",
  DK: "DKK",
  DM: "XCD",
  DO: "DOP",
  DZ: "DZD",
  EC: "USD",
  EE: "EUR",
  EG: "EGP",
  EH: "MAD",
  ER: "ERN",
  ES: "EUR",
  ET: "ETB",
  FI: "EUR",
  FJ: "FJD",
  FK: "FKP",
  FM: "USD",
  FO: "DKK",
  FR: "EUR",
  GA: "XAF",
  GB: "GBP",
  GD: "XCD",
  GE: "GEL",
  GF: "EUR",
  GG: "GBP",
  GH: "GHS",
  GI: "GIP",
  GL: "DKK",
  GM: "GMD",
  GN: "GNF",
  GP: "EUR",
  GQ: "XAF",
  GR: "EUR",
  GS: "GBP",
  GT: "GTQ",
  GU: "USD",
  GW: "XOF",
  GY: "GYD",
  HK: "HKD",
  HM: "AUD",
  HN: "HNL",
  HR: "EUR",
  HT: "HTG USD",
  HU: "HUF",
  ID: "IDR",
  IE: "EUR",
  IL: "ILS",
  IM: "GBP",
  IN: "INR",
  IO: "USD",
  IQ: "IQD",
  IR: "IRR",
  IS: "ISK",
  IT: "EUR",
  JE: "GBP",
  JM: "JMD",
  JO: "JOD",
  JP: "JPY",
  KE: "KES",
  KG: "KGS",
  KH: "KHR USD",
  KI: "AUD",
  KM: "KMF",
  KN: "XCD",
  KP: "KPW",
  KR: "KRW",
  KW: "KWD",
  KY: "KYD",
  KZ: "KZT",
  LA: "LAK",
  LB: "LBP",
  LC: "XCD",
  LI: "CHF",
  LK: "LKR",
  LR: "LRD USD",
  LS: "LSL ZAR",
  LT: "EUR",
  LU: "EUR",
  LV: "EUR",
  LY: "LYD",
  MA: "MAD",
  MC: "EUR",
  MD: "MDL",
  ME: "EUR",
  MF: "EUR",
  MG: "MGA",
  MH: "USD",
  MK: "MKD",
  ML: "XOF",
  MM: "MMK",
  MN: "MNT",
  MO: "MOP",
  MP: "USD",
  MQ: "EUR",
  MR: "MRU",
  MS: "XCD",
  MT: "EUR",
  MU: "MUR",
  MV: "MVR",
  MW: "MWK",
  MX: "MXN",
  MY: "MYR",
  MZ: "MZN",
  NA: "NAD ZAR",
  NC: "XPF",
  NE: "XOF",
  NF: "AUD",
  NG: "NGN",
  NI: "NIO",
  NL: "EUR",
  NO: "NOK",
  NP: "NPR",
  NR: "AUD",
  NU: "NZD",
  NZ: "NZD",
  OM: "OMR",
  PA: "USD PAB",
  PE: "PEN",
  PF: "XPF",
  PG: "PGK",
  PH: "PHP",
  PK: "PKR",
  PL: "PLN",
  PM: "EUR",
  PN: "NZD",
  PR: "USD",
  PS: "ILS JOD",
  PT: "EUR",
  PW: "USD",
  PY: "PYG",
  QA: "QAR",
  RE: "EUR",
  RO: "RON",
  RS: "RSD",
  RU: "RUB",
  RW: "RWF",
  SA: "SAR",
  SB: "SBD",
  SC: "SCR",
  SD: "SDG",
  SE: "SEK",
  SG: "SGD",
  SH: "SHP",
  SI: "EUR",
  SJ: "NOK",
  SK: "EUR",
  SL: "SLE SLL",
  SM: "EUR",
  SN: "XOF",
  SO: "SOS",
  SR: "SRD",
  SS: "SSP",
  ST: "STN",
  SV: "USD",
  SX: "XCG ANG",
  SY: "SYP",
  SZ: "SZL ZAR",
  TC: "USD",
  TD: "XAF",
  TF: "EUR",
  TG: "XOF",
  TH: "THB",
  TJ: "TJS",
  TK: "NZD",
  TL: "USD",
  TM: "TMT",
  TN: "TND",
  TO: "TOP",
  TR: "TRY",
  TT: "TTD",
  TV: "AUD",
  TW: "TWD",
  TZ: "TZS",
  UA: "UAH",
  UG: "UGX",
  UM: "USD",
  US: "USD",
  UY: "UYU",
  UZ: "UZS",
  VA: "EUR",
  VC: "XCD",
  VE: "VES VED",
  VG: "USD",
  VI: "USD",
  VN: "VND",
  VU: "VUV",
  WF: "XPF",
  WS: "WST",
  XK: "EUR",
  YE: "YER",
  YT: "EUR",
  ZA: "ZAR",
  ZM: "ZMW",
  ZW: "USD ZWG ZWL",
};

export interface Country {
  code: string;
  /** Names to match searches against: localized first, then English. */
  names: string[];
  currencies: string[];
}

let countries: Country[] | undefined;
let countryByTimeZone: Map<string, string> | undefined;

/** Every country with the currencies it uses, as far as `knownCodes` has them. */
export function getCountries(knownCodes: ReadonlySet<string>): Country[] {
  if (countries) return countries;

  const languages = [...new Set([userLanguage(), "en"])];
  const displayNames = languages.flatMap((language) => {
    try {
      return [new Intl.DisplayNames([language], { type: "region" })];
    } catch {
      return [];
    }
  });

  countries = Object.entries(CURRENCIES_BY_COUNTRY).flatMap(
    ([code, currencyList]) => {
      const currencies = currencyList
        .split(" ")
        .filter((currency) => knownCodes.has(currency));
      if (currencies.length === 0) return [];

      const names = [
        ...new Set(
          displayNames
            .map((names) => regionName(names, code))
            .filter((name): name is string => name != null),
        ),
      ];
      return names.length > 0 ? [{ code, names, currencies }] : [];
    },
  );
  return countries;
}

/** The country's name in the user's language. */
export function getCountryName(countryCode: string): string | undefined {
  for (const language of [userLanguage(), "en"]) {
    try {
      const names = new Intl.DisplayNames([language], { type: "region" });
      const name = regionName(names, countryCode);
      if (name) return name;
    } catch {
      // Try the next language.
    }
  }
  return undefined;
}

/** The country an IANA time zone is in, e.g. "Asia/Saigon" → "VN". */
export function countryForTimeZone(timeZone: string): string | undefined {
  if (!countryByTimeZone) {
    countryByTimeZone = new Map();
    for (const [country, zones] of Object.entries(TIME_ZONES_BY_COUNTRY)) {
      for (const zone of zones.split(" ")) {
        countryByTimeZone.set(zone, country);
      }
    }
  }
  return countryByTimeZone.get(timeZone);
}

/** The currencies a country uses, the most common first. */
export function currenciesForCountry(
  countryCode: string,
  knownCodes: ReadonlySet<string>,
): string[] {
  return (CURRENCIES_BY_COUNTRY[countryCode] ?? "")
    .split(" ")
    .filter((code) => knownCodes.has(code));
}

function regionName(
  names: Intl.DisplayNames,
  code: string,
): string | undefined {
  try {
    const name = names.of(code);
    return name && name !== code ? name : undefined;
  } catch {
    return undefined;
  }
}

function userLanguage(): string {
  return typeof navigator !== "undefined" && navigator.language
    ? navigator.language
    : "en";
}
