import {
  Box,
  Button,
  InputAdornment,
  InputBase,
  Typography,
} from "@mui/material";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import SearchIcon from "@mui/icons-material/Search";
import { currencyData } from "country-currency-emoji-flags";
import { countries } from "countries-list";
import { CurrencyRowData } from "../types/CurrencyRowData.ts";
import { SearchSuggestionRow } from "./SearchSuggestionRow.tsx";
import currencyToSymbolMap from "currency-symbol-map/map";
import { SearchSuggestionData } from "../types/SearchSuggestionData.ts";
import { focusAndOpenKeyboard } from "../utils/focusAndOpenKeyboard.ts";
import EuroSymbolIcon from "@mui/icons-material/EuroSymbol";
import { EmptyState } from "./EmptyState.tsx";
import { useTheme } from "../theme.ts";
import { KeyboardEvent } from "npm:@types/react@19.1.8";

export function AddCurrencyView(
  { onFinish, onAddRow, currencyRows }: AddCurrencyViewProps,
) {
  const [searchValue, setSearchValue] = useState("");
  const [suggestions, setSearchSuggestions] = useState<SearchSuggestionData[]>(
    [],
  );
  const inputRef = useRef<HTMLInputElement>(undefined);
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

    const newSuggestions: SearchSuggestionData[] = Object.entries(currencyData)
      .filter(([code]) => code.startsWith(searchTerm)).map(([code, emoji]) => ({
        code,
        emoji: emoji as string,
        symbol: currencyToSymbolMap[code],
      }));

    // Add search by country
    for (const { name, currency: currencies } of Object.values(countries)) {
      if (!name.toUpperCase().includes(searchTerm)) {
        continue;
      }

      for (const currency of currencies) {
        // Don't duplicate existing results
        if (newSuggestions.some(({ code }) => code === currency)) {
          continue;
        }

        newSuggestions.push({
          code: currency,
          emoji: currencyData[currency] as string,
          symbol: currencyToSymbolMap[currency],
        });
      }
    }

    setSearchSuggestions(newSuggestions);
  }, [searchValue, suggestions.length]);

  function handleSearchBarKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") {
      return;
    }

    if (suggestions.length !== 1) {
      return;
    }

    const suggestion = suggestions[0];
    const alreadyAdded = currencyRows.some((row) =>
      row.code === suggestion.code
    );

    if (alreadyAdded) {
      return;
    }

    // If only one result, add the only result
    onAddRow(suggestions[0]);
    onFinish();
  }

  return (
    <>
      <Box
        sx={{
          background: theme.palette.background.paper,

          [theme.breakpoints.down("sm")]: {
            position: "sticky",
            top: 0,
            zIndex: 1000,
          },
        }}
      >
        <Box
          sx={{
            px: 1,
            py: 2,
            borderBottom: "1px solid",
            borderColor: theme.palette.divider,
          }}
        >
          <Button onClick={handleFinish}>Cancel</Button>
          <Typography
            variant="h4"
            sx={{ px: 1, pt: 1 }}
            fontWeight={600}
          >
            Add currency
          </Typography>
        </Box>
        <InputBase
          sx={{
            p: 1,
            pl: 2,
            flex: 1,
            width: "100%",
            borderBottom: "1px solid",
            borderColor: theme.palette.divider,
          }}
          inputRef={inputRef}
          placeholder="Search currency codes"
          value={searchValue}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setSearchValue(event.target.value)}
          onKeyDown={handleSearchBarKeyDown}
          startAdornment={
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          }
        />
      </Box>
      <Box sx={{ overflow: "auto" }}>
        {suggestions.map((suggestion) => (
          <SearchSuggestionRow
            key={suggestion.code}
            suggestion={suggestion}
            alreadyAdded={currencyRows.some((row) =>
              row.code === suggestion.code
            )}
            onClick={() => {
              onAddRow(suggestion);
              onFinish();
            }}
          />
        ))}

        {suggestions.length === 0 && (
          <EmptyState
            icon={searchValue.length === 0 ? EuroSymbolIcon : undefined}
            emptyText={searchValue.length === 0
              ? "Type a currency code to see the search results"
              : `No results for "${searchValue}"`}
          />
        )}
      </Box>
    </>
  );
}

interface AddCurrencyViewProps {
  currencyRows: CurrencyRowData[];

  onFinish(): void;

  onAddRow(searchSuggestion: SearchSuggestionData): void;
}
