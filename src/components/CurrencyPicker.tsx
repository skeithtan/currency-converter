import {
  type ChangeEvent,
  type KeyboardEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import type { SearchSuggestionData } from "../types/SearchSuggestionData.ts";
import {
  getAllSuggestions,
  getCurrency,
  getLocalCurrency,
  getPopularCurrencies,
  searchCurrencies,
} from "../utils/currencySearch.ts";
import styles from "./CurrencyPicker.module.css";
import { CheckIcon, CloseIcon, SearchIcon } from "./icons.tsx";

const CLOSE_ANIMATION_MS = 200;

interface Section {
  title?: string;
  items: SearchSuggestionData[];
}

/**
 * Chooses which currencies to show: check to add, uncheck to remove. As a
 * sheet over the list it edits the current selection; as a page it is the
 * first thing a new user sees.
 */
export function CurrencyPicker({
  variant,
  selectedCodes,
  onDone,
  onCancel,
}: CurrencyPickerProps) {
  const [query, setQuery] = useState("");
  const [selection, setSelection] = useState<string[]>(selectedCodes);
  const [isClosing, setIsClosing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const isSheet = variant === "sheet";

  // Sections are laid out from the selection the picker opened with, so
  // unchecking a currency does not make it jump away from under the finger.
  const [initialCodes] = useState(selectedCodes);
  const sections = useMemo(
    () => buildSections(query, initialCodes),
    [query, initialCodes],
  );

  useEffect(() => {
    // Only where no on-screen keyboard would cover the suggestions.
    if (globalThis.matchMedia?.("(pointer: fine)").matches) {
      inputRef.current?.focus({ preventScroll: true });
    }
  }, []);

  function close(callback: () => void) {
    const reduceMotion = globalThis.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (!isSheet || reduceMotion) return callback();
    setIsClosing(true);
    setTimeout(callback, CLOSE_ANIMATION_MS);
  }

  function finish() {
    if (selection.length === 0 || isClosing) return;
    close(() => onDone(orderedSelection(initialCodes, selection)));
  }

  function cancel() {
    if (!onCancel || isClosing) return;
    close(onCancel);
  }

  function toggle(code: string) {
    setSelection((codes) =>
      codes.includes(code)
        ? codes.filter((selected) => selected !== code)
        : [...codes, code],
    );
  }

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    const results = query.trim() ? sections.flatMap(({ items }) => items) : [];
    if (results.length === 1) {
      const [{ code }] = results;
      if (!selection.includes(code)) toggle(code);
      setQuery("");
    } else if (query.trim() === "") {
      finish();
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      if (query) setQuery("");
      else cancel();
    }
  }

  const className = [
    isSheet ? styles.overlay : styles.page,
    isClosing && styles.closing,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className}>
      {isSheet && (
        // Tapping outside the sheet is a quick way out, not the only one.
        // biome-ignore lint/a11y/noStaticElementInteractions: Cancel and Escape are the accessible equivalents
        // biome-ignore lint/a11y/useKeyWithClickEvents: Cancel and Escape are the accessible equivalents
        <div className={styles.backdrop} onClick={cancel} />
      )}
      <section
        className={styles.sheet}
        {...(isSheet && { role: "dialog", "aria-modal": true })}
        aria-labelledby={titleId}
        onKeyDown={handleKeyDown}
      >
        <header className={styles.header}>
          <div className={styles.bar}>
            <div>
              {onCancel && (
                <button
                  type="button"
                  className={styles.textButton}
                  onClick={cancel}
                >
                  Cancel
                </button>
              )}
            </div>
            <h2 id={titleId} className={styles.title}>
              {isSheet ? "Currencies" : "Choose currencies"}
            </h2>
            <div className={styles.barEnd}>
              <button
                type="button"
                className={`${styles.textButton} ${styles.done}`}
                disabled={selection.length === 0}
                onClick={finish}
              >
                Done
              </button>
            </div>
          </div>
          {!isSheet && (
            <p className={styles.intro}>
              Pick the currencies you want to compare. You can change them any
              time.
            </p>
          )}
          <label className={styles.search}>
            <SearchIcon size={18} />
            <span className="visually-hidden">Search currency or country</span>
            <input
              ref={inputRef}
              className={styles.searchInput}
              type="search"
              placeholder="Search currency or country"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="search"
              value={query}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setQuery(event.target.value)
              }
              onKeyDown={handleSearchKeyDown}
            />
            {query && (
              <button
                type="button"
                className={styles.clear}
                aria-label="Clear search"
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
              >
                <CloseIcon size={18} />
              </button>
            )}
          </label>
        </header>

        <div className={styles.results}>
          {sections.map((section) => (
            <div key={section.title ?? "results"}>
              {section.title && (
                <h3 className={styles.sectionTitle}>{section.title}</h3>
              )}
              <ul className={styles.list}>
                {section.items.map((item) => (
                  <li key={item.code}>
                    <Option
                      item={item}
                      selected={selection.includes(item.code)}
                      onToggle={() => toggle(item.code)}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {sections.length === 0 && (
            <p className={styles.empty}>
              No currency or country matches “{query.trim()}”.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function Option({
  item,
  selected,
  onToggle,
}: {
  item: SearchSuggestionData;
  selected: boolean;
  onToggle(): void;
}) {
  const detail = item.matchedCountry
    ? `${item.name} · ${item.matchedCountry}`
    : item.name;
  return (
    <button
      type="button"
      className={styles.option}
      aria-pressed={selected}
      aria-label={`${item.code}, ${detail}`}
      onClick={onToggle}
    >
      <span className={styles.flag} aria-hidden="true">
        {item.emoji ?? "💰"}
      </span>
      <span className={styles.label}>
        <span className={styles.code}>{item.code}</span>
        <span className={styles.detail}>{detail}</span>
      </span>
      <span className={styles.check} aria-hidden="true">
        {selected && <CheckIcon size={16} />}
      </span>
    </button>
  );
}

function buildSections(query: string, initialCodes: string[]): Section[] {
  if (query.trim()) {
    const results = searchCurrencies(query);
    return results.length > 0 ? [{ items: results }] : [];
  }

  const sections: Section[] = [];
  const shown = new Set<string>();
  const add = (title: string, items: SearchSuggestionData[]) => {
    const fresh = items.filter(({ code }) => !shown.has(code));
    for (const { code } of fresh) shown.add(code);
    if (fresh.length > 0) sections.push({ title, items: fresh });
  };

  const local = getLocalCurrency();
  if (local && !initialCodes.includes(local.currency.code)) {
    add(`You're in ${local.countryName}`, [local.currency]);
  }
  add(
    "Your currencies",
    initialCodes.flatMap((code) => {
      const currency = getCurrency(code);
      return currency ? [currency] : [];
    }),
  );
  add("Popular", getPopularCurrencies());
  add("All currencies", getAllSuggestions());
  return sections;
}

/** Keeps existing currencies in place and appends new ones in tap order. */
function orderedSelection(initialCodes: string[], selection: string[]) {
  return [
    ...initialCodes.filter((code) => selection.includes(code)),
    ...selection.filter((code) => !initialCodes.includes(code)),
  ];
}

interface CurrencyPickerProps {
  variant: "sheet" | "page";
  selectedCodes: string[];
  onDone(codes: string[]): void;
  onCancel?(): void;
}
