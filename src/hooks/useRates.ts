import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchRates,
  type LoadedRates,
  needsRefresh,
  readCachedRates,
} from "../utils/rates.ts";

/**
 * Offline-first exchange rates.
 *
 * Saved rates are available synchronously from the first render, so the app
 * converts instantly even with no connection. They are refreshed in the
 * background on launch, when the app returns to the foreground, and when the
 * device reconnects. A failed refresh keeps the saved rates, however old.
 */
export function useRates() {
  const [rates, setRates] = useState<LoadedRates | undefined>(() =>
    readCachedRates(),
  );
  // Re-evaluated on resume so staleness is noticed in a long-lived session.
  const [now, setNow] = useState(() => new Date());
  const inFlight = useRef<Promise<LoadedRates> | null>(null);

  const refresh = useCallback((): Promise<LoadedRates> => {
    inFlight.current ??= fetchRates()
      .then((fetched) => {
        setRates(fetched);
        setNow(new Date());
        return fetched;
      })
      .finally(() => {
        inFlight.current = null;
      });
    return inFlight.current;
  }, []);

  const refreshIfDue = useCallback(() => {
    setNow(new Date());
    const cached = readCachedRates();
    if (!cached || needsRefresh(cached)) {
      refresh().catch(() => {});
    }
  }, [refresh]);

  /**
   * Rates to convert with right now: the saved ones if there are any (kicking
   * off a background refresh when they are due), otherwise a network fetch.
   */
  const getRates = useCallback((): Promise<LoadedRates> => {
    const cached = readCachedRates();
    if (!cached) return refresh();
    if (needsRefresh(cached)) refresh().catch(() => {});
    return Promise.resolve(cached);
  }, [refresh]);

  useEffect(() => {
    refreshIfDue();

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") refreshIfDue();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    globalThis.addEventListener("online", refreshIfDue);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      globalThis.removeEventListener("online", refreshIfDue);
    };
  }, [refreshIfDue]);

  return { rates, now, getRates };
}
