import { useEffect, useState } from "react";
import { Container, Paper, Snackbar, ThemeProvider } from "@mui/material";
import { Theme } from "@mui/material/styles";
import { useTheme } from "./theme.ts";
import { CurrencyList } from "./components/CurrencyList.tsx";
import { AddCurrencyView } from "./components/AddCurrencyView.tsx";
import { CurrencyRowData } from "./types/CurrencyRowData.ts";
import { SearchSuggestionData } from "./types/SearchSuggestionData.ts";
import { convert, loadRates, RatesUnavailableError } from "./utils/rates.ts";

export function App() {
  const [isAddingCurrency, setIsAddingCurrency] = useState(false);
  const [currencyRows, setCurrencyRows] = useState<CurrencyRowData[]>(() => {
    const localStorageState = localStorage.getItem(LOCALSTORAGE_KEY);
    if (!localStorageState) {
      return [];
    }

    try {
      return sanitizeCurrencyRows(JSON.parse(localStorageState));
    } catch {
      return [];
    }
  });
  const [convertingCode, setConvertingCode] = useState<string | null>(null);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

  const theme = useTheme();
  const showSearch = isAddingCurrency || currencyRows.length === 0;

  useEffect(() => {
    localStorage.removeItem("currencies");
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(currencyRows));
  }, [currencyRows]);

  async function handleAddRow({ code, emoji, symbol }: SearchSuggestionData) {
    if (currencyRows.length === 0) {
      const newRow: CurrencyRowData = {
        code,
        emoji,
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
    const newRow: CurrencyRowData = {
      code,
      emoji,
      symbol,
      value: undefined,
    };
    setCurrencyRows((rows) => [...rows, newRow]);
    setConvertingCode(baseRow.code);

    try {
      const rates = await loadRates();
      const value = convert(
        parseFloat(baseRow.value ?? "0"),
        baseRow.code,
        code,
        rates,
      );
      if (value != null) {
        setCurrencyRows((rows) =>
          rows.map((row) =>
            row.code === code ? { ...row, value: value.toFixed(2) } : row
          )
        );
      }
      if (rates.isStale) {
        setSnackbarMessage(
          `Offline — using saved rates from ${
            new Date(rates.fetchedAt).toLocaleDateString()
          }`,
        );
      }
    } catch (error) {
      setSnackbarMessage(
        error instanceof RatesUnavailableError
          ? "You're offline and no saved rates are available yet"
          : "Couldn't update rates",
      );
    } finally {
      setConvertingCode(null);
    }
  }

  async function handleRowValueChange(row: CurrencyRowData, newValue: number) {
    if (isNaN(newValue)) {
      return;
    }

    setCurrencyRows((rows) =>
      rows.map((r) =>
        r.code === row.code ? { ...r, value: newValue.toString() } : r
      )
    );
    setConvertingCode(row.code);

    try {
      const rates = await loadRates();
      setCurrencyRows((rows) =>
        rows.map((r) => {
          if (r.code === row.code) return r;
          const value = convert(newValue, row.code, r.code, rates);
          return value == null ? r : { ...r, value: value.toFixed(2) };
        })
      );
      if (rates.isStale) {
        setSnackbarMessage(
          `Offline — using saved rates from ${
            new Date(rates.fetchedAt).toLocaleDateString()
          }`,
        );
      }
    } catch (error) {
      setSnackbarMessage(
        error instanceof RatesUnavailableError
          ? "You're offline and no saved rates are available yet"
          : "Couldn't update rates",
      );
    } finally {
      setConvertingCode(null);
    }
  }

  function handleRemoveRow(row: CurrencyRowData) {
    setCurrencyRows((rows) => rows.filter((r) => r.code !== row.code));
  }

  return (
    <ThemeProvider theme={theme}>
      <Container
        maxWidth={false}
        sx={{
          background: theme.palette.background.default,
          padding: 0,
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: "hidden",
        }}
      >
        <Container
          maxWidth="sm"
          sx={(theme: Theme) => ({
            p: 0,
            height: "100%",
            display: "flex",
            flexDirection: "column",

            [theme.breakpoints.up("sm")]: {
              justifyContent: "center",
            },
          })}
        >
          <Paper
            sx={{
              display: "flex",
              flexDirection: "column",
              background: theme.palette.background.default,
              overflow: "hidden",

              [theme.breakpoints.up("sm")]: {
                maxHeight: "90vh",
              },

              [theme.breakpoints.down("sm")]: {
                boxShadow: "none",
                flex: 1,
              },
            }}
          >
            {!showSearch &&
              (
                <CurrencyList
                  currencyRows={currencyRows}
                  convertingCode={convertingCode}
                  onAddCurrencyClick={() => setIsAddingCurrency(true)}
                  onRowValueChange={handleRowValueChange}
                  onRemoveRow={handleRemoveRow}
                  onReorder={setCurrencyRows}
                />
              )}

            {showSearch &&
              (
                <AddCurrencyView
                  onFinish={() => setIsAddingCurrency(false)}
                  onAddRow={handleAddRow}
                  currencyRows={currencyRows}
                />
              )}
          </Paper>
        </Container>
      </Container>
      <Snackbar
        open={snackbarMessage != null}
        autoHideDuration={4000}
        onClose={() => setSnackbarMessage(null)}
        message={snackbarMessage}
      />
    </ThemeProvider>
  );
}

const LOCALSTORAGE_KEY = "currencyRows";
const CURRENCY_CODE_PATTERN = /^[A-Z]{3}$/;

function sanitizeCurrencyRows(value: unknown): CurrencyRowData[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry): CurrencyRowData[] => {
    if (
      typeof entry !== "object" || entry === null || Array.isArray(entry)
    ) {
      return [];
    }

    const storedRow = entry as Record<string, unknown>;
    if (
      typeof storedRow.code !== "string" ||
      !CURRENCY_CODE_PATTERN.test(storedRow.code)
    ) {
      return [];
    }

    const row: CurrencyRowData = { code: storedRow.code };
    if (typeof storedRow.emoji === "string") row.emoji = storedRow.emoji;
    if (typeof storedRow.symbol === "string") row.symbol = storedRow.symbol;
    if (typeof storedRow.value === "string") row.value = storedRow.value;
    return [row];
  });
}
