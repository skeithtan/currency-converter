export interface Conversion {
  rates: Record<string, number>; // Key = Currency code, Value = Reference from base
  base: string; // Base = Currency code
}
