import { useEffect, useMemo, useRef, useState } from "react";
import { useRowGestures } from "../hooks/useRowGestures.ts";
import type { CurrencyRowData } from "../types/CurrencyRowData.ts";
import { describeCrossRate } from "../utils/crossRate.ts";
import { createAmountFormatter } from "../utils/currencyFormat.ts";
import { showsWholeUnits, usesLargeAmounts } from "../utils/currencyScale.ts";
import { getCurrency } from "../utils/currencySearch.ts";
import { SCROLL_CONTAINER_ATTRIBUTE } from "../utils/keepAboveKeyboard.ts";
import type { LoadedRates } from "../utils/rates.ts";
import { moveItem } from "../utils/reorder.ts";
import styles from "./CurrencyList.module.css";
import { CurrencyRow } from "./CurrencyRow.tsx";
import { PlusIcon } from "./icons.tsx";

export function CurrencyList({
  currencyRows,
  anchorCode,
  rates,
  convertingCode,
  onCommitValue,
  onReorder,
  onRemove,
  onManageCurrencies,
}: CurrencyListProps) {
  const [editingCode, setEditingCode] = useState<string | null>(null);
  // The row playing its delete animation, and where that starts from.
  const [removing, setRemoving] = useState<{
    code: string;
    from: number;
  } | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const focusCodeRef = useRef<string | null>(null);
  const gestures = useRowGestures<HTMLUListElement>({
    enabled: editingCode === null && removing === null,
    onMove: move,
    onSwipeDelete: (index, offset) => {
      const row = currencyRows[index];
      if (row) setRemoving({ code: row.code, from: offset });
    },
  });

  // After a keyboard reorder or delete, keep focus where the user was.
  useEffect(() => {
    const code = focusCodeRef.current;
    if (!code) return;
    focusCodeRef.current = null;
    gestures.listRef.current
      ?.querySelector<HTMLButtonElement>(`[data-code="${code}"]`)
      ?.focus();
  });

  const display = useMemo(
    () =>
      currencyRows.map((row) => {
        const name = getCurrency(row.code)?.name ?? row.code;
        const wholeUnits = showsWholeUnits(row.code, rates);
        const crossRate =
          rates && anchorCode && row.code !== anchorCode
            ? describeCrossRate(row.code, anchorCode, rates)
            : undefined;
        return {
          name,
          wholeUnits,
          subtitle: crossRate ?? name,
          formatter: createAmountFormatter(row.code, { wholeUnits }),
          offerMultipliers: usesLargeAmounts(row.code, rates),
        };
      }),
    [currencyRows, rates, anchorCode],
  );

  function move(from: number, to: number) {
    const row = currencyRows[from];
    if (!row || to < 0 || to >= currencyRows.length) return;
    onReorder(moveItem(currencyRows, from, to));
    setAnnouncement(
      `${row.code} moved to position ${to + 1} of ${currencyRows.length}`,
    );
  }

  return (
    <>
      <header className={styles.header}>
        <div className={styles.headerBar}>
          <h1 className={styles.title}>Currencies</h1>
          <button
            type="button"
            className={styles.addButton}
            aria-label="Add or remove currencies"
            onClick={onManageCurrencies}
          >
            <PlusIcon size={22} />
          </button>
        </div>
      </header>
      <div className={styles.listArea}>
        <div
          className={styles.scroller}
          {...{ [SCROLL_CONTAINER_ATTRIBUTE]: "" }}
        >
          <ul ref={gestures.listRef} className={styles.list}>
            {currencyRows.map((row, index) => (
              <CurrencyRow
                key={row.code}
                code={row.code}
                emoji={row.emoji}
                value={row.value}
                {...display[index]}
                isPending={
                  convertingCode !== null && convertingCode !== row.code
                }
                isEditing={editingCode === row.code}
                gesture={gestures.itemState(index)}
                removeFrom={
                  removing?.code === row.code ? removing.from : undefined
                }
                onPointerDown={(event) => gestures.onPointerDown(index, event)}
                shouldSuppressClick={gestures.shouldSuppressClick}
                onStartEditing={() => setEditingCode(row.code)}
                onFinishEditing={(value) => {
                  setEditingCode((code) => (code === row.code ? null : code));
                  if (value !== undefined) onCommitValue(row.code, value);
                }}
                onMoveBy={(delta) => {
                  focusCodeRef.current = row.code;
                  move(index, index + delta);
                }}
                onRequestRemove={() => {
                  if (removing) return;
                  const neighbour =
                    currencyRows[index + 1] ?? currencyRows[index - 1];
                  focusCodeRef.current = neighbour?.code ?? null;
                  setRemoving({ code: row.code, from: 0 });
                }}
                onRemoved={() => {
                  setRemoving(null);
                  onRemove(row.code);
                }}
              />
            ))}
          </ul>
          <p className={styles.hint}>
            Tap an amount to change it. Hold and drag to reorder, or swipe left
            to delete.
          </p>
        </div>
        <div className={styles.fade} />
      </div>
      <div className="visually-hidden" aria-live="polite">
        {announcement}
      </div>
    </>
  );
}

interface CurrencyListProps {
  currencyRows: CurrencyRowData[];
  /** The row the other amounts are converted from. */
  anchorCode: string | undefined;
  rates: LoadedRates | undefined;
  convertingCode: string | null;
  onCommitValue(code: string, value: number): void;
  onReorder(rows: CurrencyRowData[]): void;
  onRemove(code: string): void;
  onManageCurrencies(): void;
}
