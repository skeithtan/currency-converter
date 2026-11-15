import { useEffect } from "react";
import styles from "./Toast.module.css";

const VISIBLE_MS = 4000;

/** A brief message at the bottom of the screen that clears itself. */
export function Toast({ message, onDismiss }: ToastProps) {
  useEffect(() => {
    if (message === null) return;
    const timer = setTimeout(onDismiss, VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  return (
    <div className={styles.region} role="status" aria-live="polite">
      {message !== null && <p className={styles.toast}>{message}</p>}
    </div>
  );
}

interface ToastProps {
  message: string | null;
  onDismiss(): void;
}
