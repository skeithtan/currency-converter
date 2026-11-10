// Type declarations for untyped CommonJS dependencies.

declare module "country-currency-emoji-flags" {
  const currencyEmojiFlags: {
    /** Flag emoji keyed by ISO 4217 currency code. */
    readonly currencyData: Record<string, string | undefined>;
  };
  export default currencyEmojiFlags;
}

declare module "currency-symbol-map/map.js" {
  /** Currency symbol keyed by ISO 4217 currency code. */
  const currencySymbolMap: Record<string, string | undefined>;
  export default currencySymbolMap;
}
