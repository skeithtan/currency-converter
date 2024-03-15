import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Container,
  Dialog,
  Grid,
  IconButton,
  InputAdornment,
  InputBase,
  Paper,
  ThemeProvider,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { theme } from "./theme";
import fx from "money";
import { CurrencyRow } from "./components/CurrencyRow";
import currencyToSymbolMap from "currency-symbol-map/map";
import { getEmojiByCurrencyCode } from "country-currency-emoji-flags";
import { fetchConversion } from "./utils/fetchConversion";

const LOCALSTORAGE_KEY = "currencyRows";

export function App() {
  const [isEditing, setIsEditing] = useState(false);
  const [dialogIsOpen, setDialogIsOpen] = useState(false);
  const [currencyCodeInput, setCurrencyCodeInput] = useState("");
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

  function handleDialogDismiss() {
    setDialogIsOpen(false);
    setCurrencyCodeInput("");
  }

  function handleCurrencyAdd() {
    setDialogIsOpen(false);
    setCurrencyCodeInput("");

    const newCurrencyCode = currencyCodeInput.toUpperCase();
    if (currencyRows.some((row) => row.code === newCurrencyCode)) {
      return;
    }

    setCurrencyRows([
      ...currencyRows,
      {
        isLoading: false,
        symbol: currencyToSymbolMap[newCurrencyCode],
        emoji: getEmojiByCurrencyCode(newCurrencyCode),
        code: newCurrencyCode,
        value: "0",
      },
    ]);
  }

  function handleRemoveRow(row: CurrencyRowData) {
    setCurrencyRows((rows) => rows.filter((r) => r !== row));
  }

  return (
    <ThemeProvider theme={theme}>
      <Container
        maxWidth="sm"
        sx={{
          p: 0,
          display: "flex",
          height: "100vh",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Paper>
          <Box sx={{ px: 1, py: 2, borderBottom: "1px #ddd solid" }}>
            <Grid
              container
              alignItems="center"
              justifyContent="space-between"
            >
              {!isEditing && (
                <Grid item>
                  <Button onClick={() => setIsEditing(true)}>Modify</Button>
                </Grid>
              )}

              {!isEditing && (
                <Grid item>
                  <Button
                    endIcon={<AddIcon />}
                    onClick={() => setDialogIsOpen(true)}
                  >
                    Add
                  </Button>
                </Grid>
              )}

              {isEditing && (
                <Grid item>
                  <Button onClick={() => setIsEditing(false)}>Done</Button>
                </Grid>
              )}
            </Grid>

            <Typography
              variant="h4"
              sx={{ px: 1, pt: 1 }}
            >
              Currencies
            </Typography>
          </Box>
          <Box sx={{ overflow: "auto" }}>
            {currencyRows.map((row) => (
              <CurrencyRow
                key={row.code}
                code={row.code}
                emoji={row.emoji}
                symbol={row.symbol}
                value={row.value}
                isLoading={row.isLoading}
                isEditing={isEditing}
                onValueChange={(newValue) =>
                  handleRowValueChange(row, newValue)
                }
                onRemove={() => handleRemoveRow(row)}
              />
            ))}
          </Box>
        </Paper>
      </Container>

      <Dialog
        disablePortal
        open={dialogIsOpen}
        onClose={handleDialogDismiss}
      >
        <Typography
          variant="h6"
          sx={{ px: 1, pt: 1 }}
        >
          Add currency by code
        </Typography>

        <Box sx={{ display: "flex" }}>
          <InputBase
            sx={{ ml: 1 }}
            onChange={(event) => setCurrencyCodeInput(event.target.value)}
            startAdornment={
              getEmojiByCurrencyCode(currencyCodeInput) && (
                <InputAdornment position="start">
                  {getEmojiByCurrencyCode(currencyCodeInput)}
                </InputAdornment>
              )
            }
            inputRef={(inputRef) => {
              if (!inputRef) {
                return;
              }

              // Focus when the dialog has been shown
              setTimeout(() => {
                inputRef.focus();
              }, 100);
            }}
          />

          <IconButton
            type="button"
            size="large"
            disabled={getEmojiByCurrencyCode(currencyCodeInput) == null}
            onClick={handleCurrencyAdd}
          >
            <AddIcon />
          </IconButton>
        </Box>
      </Dialog>
    </ThemeProvider>
  );
}

interface CurrencyRowData {
  code: string;
  emoji?: string;
  symbol: string;
  value?: string;
  isLoading: boolean;
}
