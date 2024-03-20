import React, { useEffect, useState } from "react";
import { Container, Paper, ThemeProvider } from "@mui/material";
import { theme } from "./theme";
import { CurrencyDisplay } from "./components/CurrencyDisplay";
import { AddCurrencyView } from "./components/AddCurrencyView";
import { CurrencyRowData } from "./types/CurrencyRowData";
import { fetchConversion } from "./utils/fetchConversion";
import fx from "money";
import { SearchSuggestionData } from "./types/SearchSuggestionData";

export function App() {
  const [isAddingCurrency, setIsAddingCurrency] = useState(false);
  const [currencyRows, setCurrencyRows] = useState<CurrencyRowData[]>(() => {
    const localStorageState = localStorage.getItem(LOCALSTORAGE_KEY);
    if (!localStorageState) {
      return [];
    }

    try {
      const parsedState = JSON.parse(localStorageState);
      return Array.isArray(parsedState) ? parsedState : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(currencyRows));
  }, [currencyRows]);

  async function handleAddRow({ code, emoji, symbol }: SearchSuggestionData) {
    if (currencyRows.length === 0) {
      const newRow = {
        code,
        emoji,
        isLoading: false,
        value: "0",
        symbol,
      };

      setCurrencyRows((rows) => [...rows, newRow]);
      return;
    }

    if (currencyRows.some((row) => row.code === code)) {
      // No duplicate codes
      return;
    }

    const baseRow = currencyRows[0];
    await fetchConversion();

    const value = Number(
      fx.convert(parseFloat(baseRow.value?.toString() ?? "0"), { from: baseRow.code, to: code }),
    ).toFixed(2);
    const newRow = { code, emoji, isLoading: false, value, symbol };

    setCurrencyRows(rows => [...rows, newRow]);
  }

  async function handleRowValueChange(row: CurrencyRowData, newValue: number) {
    if (isNaN(newValue)) {
      return;
    }

    setCurrencyRows((rows) =>
      rows.map((r) => {
        if (r.code === row.code) {
          return { ...r, value: newValue.toString() };
        }

        return { ...r, isLoading: true };
      }),
    );

    await fetchConversion();

    setCurrencyRows((currencyRows) =>
      currencyRows.map((r) => {
        if (r.code === row.code) {
          return r;
        }

        const value = Number(
          fx.convert(newValue, { from: row.code, to: r.code }),
        ).toFixed(2);
        return { ...r, value, isLoading: false };
      }),
    );
  }

  function handleRemoveRow(row: CurrencyRowData) {
    setCurrencyRows((rows) => rows.filter((r) => r !== row));
  }

  return (
    <ThemeProvider theme={theme}>
      <Container
        maxWidth="sm"
        sx={(theme) => ({
          p: 0,

          [theme.breakpoints.up("sm")]: {
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          },
        })}
      >
        <Paper
          sx={{
            my: "auto",
            display: "flex",
            flexDirection: "column",

            [theme.breakpoints.up("sm")]: {
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              overflow: "hidden",
            },
          }}
        >
          {!isAddingCurrency &&
            <CurrencyDisplay
              onAddCurrencyClick={() => setIsAddingCurrency(true)}
              currencyRows={currencyRows}
              onRowValueChange={handleRowValueChange}
              onRemoveRow={handleRemoveRow}
            />
          }

          {isAddingCurrency &&
            <AddCurrencyView
              onFinish={() => setIsAddingCurrency(false)}
              onAddRow={handleAddRow}
              currencyRows={currencyRows}
            />
          }
        </Paper>
      </Container>
    </ThemeProvider>
  );
}

const LOCALSTORAGE_KEY = "currencyRows";

