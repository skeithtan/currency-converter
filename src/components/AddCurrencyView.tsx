import { Box, Button, InputAdornment, InputBase, Typography } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import SearchIcon from "@mui/icons-material/Search";
import { currencyData } from "country-currency-emoji-flags";
import { CurrencyRowData } from "../types/CurrencyRowData";
import { SearchSuggestionRow } from "./SearchSuggestionRow";
import currencyToSymbolMap from "currency-symbol-map/map";
import { SearchSuggestionData } from "../types/SearchSuggestionData";
import { focusAndOpenKeyboard } from "../utils/focusAndOpenKeyboard";
import EuroSymbolIcon from "@mui/icons-material/EuroSymbol";
import { EmptyState } from "./EmptyState";
import { useTheme } from "../theme";

export function AddCurrencyView({ onFinish, onAddRow, currencyRows }: AddCurrencyViewProps) {
  const [searchValue, setSearchValue] = useState("");
  const [suggestions, setSearchSuggestions] = useState<SearchSuggestionData[]>([]);
  const inputRef = useRef<HTMLInputElement>();
  const theme = useTheme();

  function handleFinish() {
    setSearchValue("");
    onFinish();
  }

  useEffect(() => {
    if (inputRef.current) {
      focusAndOpenKeyboard(inputRef.current);
    }
  }, []);

  useEffect(() => {
    const searchTerm = searchValue.trim().toUpperCase();
    if (searchTerm.length === 0) {
      if (suggestions.length > 0) {
        setSearchSuggestions([]);
      }

      return;
    }

    const newSuggestions: SearchSuggestionData[] = Object.entries(currencyData).filter(([code]) => code.startsWith(searchTerm)).map(([code, emoji]) => ({
      code, emoji: emoji as string, symbol: currencyToSymbolMap[code],
    }));

    setSearchSuggestions(newSuggestions);
  }, [searchValue, suggestions.length]);

  return (
    <>
      <Box sx={{ px: 1, py: 2, borderBottom: "1px solid", borderColor: theme.palette.divider }}>
        <Button onClick={handleFinish}>Cancel</Button>
        <Typography
          variant="h4"
          sx={{ px: 1, pt: 1 }}
        >
          Add currency
        </Typography>
      </Box>
      <InputBase
        sx={{ p: 1, pl: 2, flex: 1, borderBottom: "1px solid", borderColor: theme.palette.divider }}
        inputRef={inputRef}
        placeholder="Search currency codes"
        value={searchValue}
        onChange={(event) => setSearchValue(event.target.value)}
        startAdornment={<InputAdornment position="start"><SearchIcon /></InputAdornment>}
      />
      <Box sx={{ overflow: "auto" }}>
        {suggestions.map((suggestion) => (
          <SearchSuggestionRow
            key={suggestion.code}
            suggestion={suggestion}
            alreadyAdded={currencyRows.some((row) => row.code === suggestion.code)}
            onClick={() => {
              onAddRow(suggestion);
              onFinish();
            }}
          />
        ))}

        {suggestions.length === 0 && (
          <EmptyState
            icon={EuroSymbolIcon}
            emptyText="Type a currency code to see the search results"
          />
        )}

      </Box>
    </>
  )
    ;
}

interface AddCurrencyViewProps {
  currencyRows: CurrencyRowData[];

  onFinish(): void;

  onAddRow(searchSuggestion: SearchSuggestionData): void;
}