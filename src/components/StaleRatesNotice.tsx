import styles from "./StaleRatesNotice.module.css";
import { ClockIcon, CloseIcon } from "./icons.tsx";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * A slim, dismissible bar noting that the rates in use are more than a day
 * old. It sits below the list rather than over it and never interrupts input.
 */
export function StaleRatesNotice({
  fetchedAt,
  now,
  onDismiss,
}: StaleRatesNoticeProps) {
  const fetchedDate = new Date(fetchedAt);
  const days = Math.max(
    1,
    Math.floor((now.getTime() - fetchedDate.getTime()) / DAY_MS),
  );
  const exactDate = fetchedDate.toLocaleString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={styles.notice} role="status">
      <ClockIcon size={18} className={styles.icon} />
      <p className={styles.text} title={exactDate}>
        Rates are {days === 1 ? "1 day" : `${days} days`} old and may be
        outdated
      </p>
      <button
        type="button"
        className={styles.dismiss}
        aria-label="Dismiss stale rates notice"
        onClick={onDismiss}
      >
        <CloseIcon size={18} />
      </button>
    </div>
  );
}

interface StaleRatesNoticeProps {
  fetchedAt: string;
  now: Date;
  onDismiss(): void;
}
