import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./App.module.css";
import { CurrencyList } from "./components/CurrencyList.tsx";
import { CurrencyPicker } from "./components/CurrencyPicker.tsx";
import { StaleRatesNotice } from "./components/StaleRatesNotice.tsx";
import { Toast, type ToastData } from "./components/Toast.tsx";
import { useRates } from "./hooks/useRates.ts";
import type { CurrencyRowData } from "./types/CurrencyRowData.ts";
import { getCurrency } from "./utils/currencySearch.ts";
import { convert, isStale, type LoadedRates } from "./utils/rates.ts";

const LOCALSTORAGE_KEY = "currencyRows";
const ANCHOR_KEY = "anchorCode";
const NO_RATES_MESSAGE =
  "Couldn't load exchange rates. Connect to the internet and try again.";
const CURRENCY_CODE_PATTERN = /^[A-Z]{3}$/;
/** What the first currency chosen starts at, so conversions show at once. */
const FIRST_AMOUNT = "100";

export function App() {
  const [currencyRows, setCurrencyRows] = useState<CurrencyRowData[]>(() =>
    sanitizeCurrencyRows(readJson(LOCALSTORAGE_KEY)),
  );
  // The row the user last typed into; the others are converted from it.
  const [anchorCode, setAnchorCode] = useState<string | null>(() => {
    const stored = readString(ANCHOR_KEY);
    return stored && CURRENCY_CODE_PATTERN.test(stored) ? stored : null;
  });
  const [isPicking, setIsPicking] = useState(false);
  const [convertingCode, setConvertingCode] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [dismissedStaleFetchedAt, setDismissedStaleFetchedAt] = useState<
    string | null
  >(null);

  const { rates, now, getRates } = useRates();
  const effectiveAnchor = currencyRows.some((row) => row.code === anchorCode)
    ? (anchorCode ?? undefined)
    : currencyRows[0]?.code;
  const showStaleNotice =
    rates != null &&
    isStale(rates, now) &&
    dismissedStaleFetchedAt !== rates.fetchedAt;

  const anchorRef = useRef(effectiveAnchor);
  const ratesRef = useRef(rates);
  useEffect(() => {
    anchorRef.current = effectiveAnchor;
    ratesRef.current = rates;
  });

  // When fresh rates arrive in the background, update the displayed values.
  const appliedFetchedAtRef = useRef(rates?.fetchedAt);
  useEffect(() => {
    if (!rates || rates.fetchedAt === appliedFetchedAtRef.current) return;
    appliedFetchedAtRef.current = rates.fetchedAt;
    setCurrencyRows((rows) =>
      reconvertFromAnchor(rows, anchorRef.current, rates),
    );
  }, [rates]);

  useEffect(() => {
    localStorage.removeItem("currencies");
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(currencyRows));
  }, [currencyRows]);

  useEffect(() => {
    if (anchorCode) localStorage.setItem(ANCHOR_KEY, anchorCode);
    else localStorage.removeItem(ANCHOR_KEY);
  }, [anchorCode]);

  const dismissToast = useCallback(() => setToast(null), []);

  async function convertFrom(code: string) {
    setConvertingCode(code);
    try {
      const loaded = await getRates();
      setCurrencyRows((rows) => reconvertFromAnchor(rows, code, loaded));
    } catch {
      setToast({ message: NO_RATES_MESSAGE });
    } finally {
      setConvertingCode(null);
    }
  }

  function handleCommitValue(code: string, value: number) {
    if (!Number.isFinite(value)) return;
    setCurrencyRows((rows) =>
      rows.map((row) =>
        row.code === code ? { ...row, value: value.toString() } : row,
      ),
    );
    setAnchorCode(code);
    void convertFrom(code);
  }

  function handleRemove(code: string) {
    const index = currencyRows.findIndex((row) => row.code === code);
    const removed = currencyRows[index];
    if (!removed) return;
    setCurrencyRows((rows) => rows.filter((row) => row.code !== code));
    setToast({
      message: `Removed ${getCurrency(code)?.name ?? code}`,
      action: {
        label: "Undo",
        onAction: () => {
          setToast(null);
          setCurrencyRows((rows) => {
            if (rows.some((row) => row.code === code)) return rows;
            const restored = [
              ...rows.slice(0, index),
              removed,
              ...rows.slice(index),
            ];
            // Amounts may have changed since; bring the row back up to date.
            const latestRates = ratesRef.current;
            return latestRates
              ? reconvertFromAnchor(restored, anchorRef.current, latestRates)
              : restored;
          });
        },
      },
    });
  }

  function handlePickerDone(codes: string[]) {
    setIsPicking(false);
    const existing = new Map(currencyRows.map((row) => [row.code, row]));
    const isFirstRun = currencyRows.length === 0;
    const nextRows = codes.map(
      (code, index): CurrencyRowData =>
        existing.get(code) ??
        newRow(code, isFirstRun && index === 0 ? FIRST_AMOUNT : undefined),
    );
    setCurrencyRows(nextRows);

    const anchor = nextRows.some((row) => row.code === anchorCode)
      ? anchorCode
      : (nextRows[0]?.code ?? null);
    setAnchorCode(anchor);
    if (anchor && nextRows.some((row) => row.value === undefined)) {
      void convertFrom(anchor);
    }
  }

  const hasCurrencies = currencyRows.length > 0;

  return (
    <div className={styles.viewport}>
      <main className={styles.app}>
        {hasCurrencies ? (
          <div className={styles.content} inert={isPicking}>
            <CurrencyList
              currencyRows={currencyRows}
              anchorCode={effectiveAnchor}
              rates={rates}
              convertingCode={convertingCode}
              onCommitValue={handleCommitValue}
              onReorder={setCurrencyRows}
              onRemove={handleRemove}
              onManageCurrencies={() => setIsPicking(true)}
            />
            {rates != null && showStaleNotice && (
              <StaleRatesNotice
                fetchedAt={rates.fetchedAt}
                now={now}
                onDismiss={() => setDismissedStaleFetchedAt(rates.fetchedAt)}
              />
            )}
          </div>
        ) : (
          <CurrencyPicker
            variant="page"
            selectedCodes={[]}
            onDone={handlePickerDone}
          />
        )}
        {hasCurrencies && isPicking && (
          <CurrencyPicker
            variant="sheet"
            selectedCodes={currencyRows.map((row) => row.code)}
            onDone={handlePickerDone}
            onCancel={() => setIsPicking(false)}
          />
        )}
      </main>
      <Toast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}

function newRow(code: string, value?: string): CurrencyRowData {
  const currency = getCurrency(code);
  return {
    code,
    ...(currency?.emoji && { emoji: currency.emoji }),
    ...(currency?.symbol && { symbol: currency.symbol }),
    ...(value !== undefined && { value }),
  };
}

function readString(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function readJson(key: string): unknown {
  const stored = readString(key);
  if (!stored) return undefined;
  try {
    return JSON.parse(stored);
  } catch {
    return undefined;
  }
}

function sanitizeCurrencyRows(value: unknown): CurrencyRowData[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry): CurrencyRowData[] => {
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
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

/**
 * Recomputes every row from the anchor row (the one last typed into, else the
 * first row), leaving the anchor's own value untouched.
 */
function reconvertFromAnchor(
  rows: CurrencyRowData[],
  anchorCode: string | null | undefined,
  rates: LoadedRates,
): CurrencyRowData[] {
  const anchor = rows.find((row) => row.code === anchorCode) ?? rows[0];
  if (!anchor) return rows;

  const anchorValue = Number.parseFloat(anchor.value ?? "");
  if (!Number.isFinite(anchorValue)) return rows;

  return rows.map((row) => {
    if (row.code === anchor.code) return row;
    const value = convert(anchorValue, anchor.code, row.code, rates);
    return value == null ? row : { ...row, value: value.toFixed(2) };
  });
}
