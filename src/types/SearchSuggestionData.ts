export interface SearchSuggestionData {
  code: string;
  name: string;
  emoji?: string;
  symbol?: string;
  /** The country that matched the search, when the currency's name did not. */
  matchedCountry?: string;
}
