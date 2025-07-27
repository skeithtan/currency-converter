export interface Conversion {
  rates: Record<string, number>; // Key = Currency code, Value = Reference from base
  base: string; // Base = Currency code
}

export type CurrencyRecord = Record<string, string>; // Key = Currency code, Value = full name
