import {
  type ChangeEvent,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReorderItemState } from "../hooks/useReorder.ts";
import { REORDER_ITEM_ATTRIBUTE } from "../hooks/useReorder.ts";
import {
  draftToNumber,
  formatDraft,
  getNumberSymbols,
  parseDraft,
  positionAfterSignificant,
  shiftDecimal,
  significantBefore,
} from "../utils/amountInput.ts";
import type { AmountFormatter } from "../utils/currencyFormat.ts";
import { openKeyboardNear } from "../utils/focusAndOpenKeyboard.ts";
import { keepAboveKeyboard } from "../utils/keepAboveKeyboard.ts";
import styles from "./CurrencyRow.module.css";

// Long enough for a tap on a k/M chip to land before the blur commits.
const COMMIT_DELAY_MS = 150;

const MULTIPLIERS = [
  { label: "k", word: "thousand", places: 3, description: "times 1,000" },
  { label: "M", word: "million", places: 6, description: "times 1,000,000" },
] as const;

export function CurrencyRow({
  code,
  emoji,
  name,
  value,
  subtitle,
  formatter,
  wholeUnits,
  offerMultipliers,
  isPending,
  isEditing,
  reorder,
  onPointerDown,
  shouldSuppressClick,
  onStartEditing,
  onFinishEditing,
  onMoveBy,
}: CurrencyRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const handOffRef = useRef<((input: HTMLInputElement | null) => void) | null>(
    null,
  );
  const commitTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const finishedRef = useRef(false);
  const caretRef = useRef<number | null>(null);
  const [draft, setDraft] = useState("");
  const symbols = useMemo(() => getNumberSymbols(), []);

  const numericValue = value == null ? Number.NaN : Number.parseFloat(value);
  const hasValue = Number.isFinite(numericValue);
  const formatted = hasValue ? formatter.format(numericValue) : "";
  const display = formatDraft(draft, symbols);
  const placeholder = hasValue
    ? formatDraft(
        parseDraft(
          wholeUnits ? String(Math.round(numericValue)) : String(numericValue),
          symbols,
        ),
        symbols,
      )
    : "0";

  // Move focus into the field once it has rendered, keeping the keyboard that
  // the tap opened, and keep the row above the keyboard while editing.
  useLayoutEffect(() => {
    if (!isEditing) return;
    const input = inputRef.current;
    if (handOffRef.current) {
      handOffRef.current(input);
      handOffRef.current = null;
    } else {
      input?.focus({ preventScroll: true });
    }
    const stopKeepingAboveKeyboard = rowRef.current
      ? keepAboveKeyboard(rowRef.current)
      : undefined;
    // A commit still pending here (the user tapped another row) must run, so
    // the timer is left alone.
    return () => stopKeepingAboveKeyboard?.();
  }, [isEditing]);

  // Restore the caret after the draft is regrouped.
  useLayoutEffect(() => {
    const caret = caretRef.current;
    const input = inputRef.current;
    if (caret === null || !input) return;
    caretRef.current = null;
    if (document.activeElement === input) input.setSelectionRange(caret, caret);
  });

  useEffect(() => () => clearTimeout(commitTimerRef.current), []);

  function startEditing() {
    if (shouldSuppressClick()) return;
    if (buttonRef.current) {
      handOffRef.current = openKeyboardNear(buttonRef.current);
    }
    finishedRef.current = false;
    setDraft("");
    onStartEditing();
  }

  // Each edit ends exactly once, whether by Enter, Escape or blur, even if
  // the field also reports a blur as it goes away.
  function finish(value: number | undefined) {
    clearTimeout(commitTimerRef.current);
    if (finishedRef.current) return;
    finishedRef.current = true;
    onFinishEditing(value);
  }

  function commit() {
    finish(draftToNumber(draft));
  }

  function cancel() {
    finish(undefined);
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    const next = parseDraft(input.value, symbols);
    const before = significantBefore(
      input.value,
      input.selectionStart ?? input.value.length,
      symbols,
    );
    caretRef.current = positionAfterSignificant(
      formatDraft(next, symbols),
      before,
      symbols,
    );
    setDraft(next);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      commit();
    } else if (event.key === "Escape") {
      event.preventDefault();
      cancel();
    }
  }

  function multiply(places: number) {
    clearTimeout(commitTimerRef.current);
    if (draft === "") return;
    const next = shiftDecimal(draft, places);
    caretRef.current = formatDraft(next, symbols).length;
    setDraft(next);
    inputRef.current?.focus({ preventScroll: true });
  }

  function handleButtonKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (!event.altKey) return;
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      onMoveBy(event.key === "ArrowUp" ? -1 : 1);
    }
  }

  const itemClassName = [
    styles.item,
    reorder.dragging && !reorder.lifted && styles.shifting,
    reorder.lifted && styles.lifted,
  ]
    .filter(Boolean)
    .join(" ");
  const itemStyle: CSSProperties | undefined = reorder.offset
    ? { transform: `translateY(${reorder.offset}px)` }
    : undefined;

  if (isEditing) {
    return (
      <li className={styles.item} {...{ [REORDER_ITEM_ATTRIBUTE]: "" }}>
        <div ref={rowRef} className={styles.editing}>
          <div className={styles.editTop}>
            <span className={styles.flag} aria-hidden="true">
              {emoji ?? "💰"}
            </span>
            <span className={`${styles.label} ${styles.editLabel}`}>
              <span className={styles.code}>{code}</span>
              <span className={styles.subtitle}>{name}</span>
            </span>
            <label className={styles.field}>
              <span className="visually-hidden">Amount in {name}</span>
              {formatter.symbol && (
                <span className={styles.symbol} aria-hidden="true">
                  {formatter.symbol}
                </span>
              )}
              <input
                ref={inputRef}
                className={styles.input}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="done"
                value={display}
                placeholder={placeholder}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onFocus={() => clearTimeout(commitTimerRef.current)}
                onBlur={() => {
                  if (finishedRef.current) return;
                  commitTimerRef.current = setTimeout(commit, COMMIT_DELAY_MS);
                }}
              />
            </label>
          </div>
          {offerMultipliers && (
            <div className={styles.chips}>
              {MULTIPLIERS.map(({ label, word, places, description }) => (
                <button
                  key={label}
                  type="button"
                  className={styles.chip}
                  aria-label={`${word}, ${description}`}
                  aria-disabled={draft === ""}
                  // Keep focus, and the keyboard, in the amount field.
                  onPointerDown={(event) => event.preventDefault()}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => multiply(places)}
                >
                  {label} <span className={styles.chipWord}>{word}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </li>
    );
  }

  return (
    <li
      className={itemClassName}
      style={itemStyle}
      onPointerDown={onPointerDown}
      {...{ [REORDER_ITEM_ATTRIBUTE]: "" }}
    >
      <button
        ref={buttonRef}
        type="button"
        className={styles.row}
        data-code={code}
        aria-label={[
          name,
          formatted || "no amount",
          subtitle !== name && subtitle,
        ]
          .filter(Boolean)
          .join(", ")}
        onClick={startEditing}
        onKeyDown={handleButtonKeyDown}
      >
        <span className={styles.flag} aria-hidden="true">
          {emoji ?? "💰"}
        </span>
        <span className={styles.label}>
          <span className={styles.code}>{code}</span>
          <span className={styles.subtitle}>{subtitle}</span>
        </span>
        <span className={`${styles.amount} ${isPending ? styles.pending : ""}`}>
          {formatted}
        </span>
      </button>
    </li>
  );
}

interface CurrencyRowProps {
  code: string;
  emoji?: string;
  name: string;
  value?: string;
  /** The rate against the row last typed into, or the currency's name. */
  subtitle: string;
  formatter: AmountFormatter;
  wholeUnits: boolean;
  offerMultipliers: boolean;
  /** Another row's amount is being converted into this one. */
  isPending: boolean;
  isEditing: boolean;
  reorder: ReorderItemState;
  onPointerDown(event: PointerEvent<HTMLElement>): void;
  shouldSuppressClick(): boolean;
  onStartEditing(): void;
  /** Called with the new amount, or undefined when nothing was entered. */
  onFinishEditing(value: number | undefined): void;
  onMoveBy(delta: -1 | 1): void;
}
