import {
  Box,
  Button,
  InputAdornment,
  InputBase,
  LinearProgress,
  Typography,
} from "@mui/material";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import SearchIcon from "@mui/icons-material/Search";
import { currencyData } from "country-currency-emoji-flags";
import { CurrencyRowData } from "../types/CurrencyRowData.ts";
import { SearchSuggestionRow } from "./SearchSuggestionRow.tsx";
import currencyToSymbolMap from "currency-symbol-map/map";
import { SearchSuggestionData } from "../types/SearchSuggestionData.ts";
import { focusAndOpenKeyboard } from "../utils/focusAndOpenKeyboard.ts";
import EuroSymbolIcon from "@mui/icons-material/EuroSymbol";
import { EmptyState } from "./EmptyState.tsx";
import { useTheme } from "../theme.ts";
import { KeyboardEvent } from "npm:@types/react@19.1.8";
import { CurrencyRecord } from "../types/Conversion.ts";
import { loadCurrencies } from "../utils/loadCurrencies.ts";

export function AddCurrencyView(
  { onFinish, onAddRow, currencyRows }: AddCurrencyViewProps,
) {
  const [searchValue, setSearchValue] = useState("");
  const [suggestions, setSearchSuggestions] = useState<SearchSuggestionData[]>(
    [],
  );
  const [currencyRecords, setCurrencyRecords] = useState<
    CurrencyRecord | undefined
  >(
    undefined,
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
    loadCurrencies()
      .then((data) => setCurrencyRecords(data));
  }, []);

  useEffect(() => {
    if (!currencyRecords) {
      setSearchSuggestions([]);
      return;
    }

    const searchTerm = searchValue.trim().toUpperCase();
    if (searchTerm.length === 0) {
      setSearchSuggestions([]);
      return;
    }

    const newSuggestions: SearchSuggestionData[] = Object.entries(
      currencyRecords,
    )
      .filter(([code, name]) =>
        code.toUpperCase().includes(searchTerm) ||
        name.toUpperCase().includes(searchTerm)
      )
      .map(([code, name]) => ({
        code,
        emoji: currencyData[code] as string,
        symbol: currencyToSymbolMap[code],
        name,
      }));

    setSearchSuggestions(newSuggestions);
  }, [searchValue, currencyRecords]);

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
          background: theme.palette.primary.main,
          color: theme.palette.primary.light,

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
          <Button onClick={handleFinish} color="inherit">Cancel</Button>
          <Typography
            variant="h4"
            sx={{ px: 1, color: theme.palette.primary.contrastText }}
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
            background: theme.palette.primary.dark,
            color: theme.palette.primary.contrastText,
          }}
          inputRef={inputRef}
          placeholder="Search currency codes"
          value={searchValue}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setSearchValue(event.target.value)}
          onKeyDown={handleSearchBarKeyDown}
          startAdornment={
            <InputAdornment position="start">
              <SearchIcon sx={{ color: theme.palette.primary.light }} />
            </InputAdornment>
          }
        />
        {currencyRecords == null && <LinearProgress />}
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
            icon={searchValue.length === 0 ? EuroSymbolIcon : SearchIcon}
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
