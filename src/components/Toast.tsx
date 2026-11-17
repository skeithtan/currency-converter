import { useEffect } from "react";
import styles from "./Toast.module.css";

const VISIBLE_MS = 4000;
// Long enough to reach for an Undo button.
const VISIBLE_WITH_ACTION_MS = 6000;

export interface ToastData {
  message: string;
  action?: { label: string; onAction(): void };
}

/** A brief message at the bottom of the screen that clears itself. */
export function Toast({ toast, onDismiss }: ToastProps) {
  useEffect(() => {
    if (toast === null) return;
    const timer = setTimeout(
      onDismiss,
      toast.action ? VISIBLE_WITH_ACTION_MS : VISIBLE_MS,
    );
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  return (
    <div className={styles.region} role="status" aria-live="polite">
      {toast !== null && (
        <div className={styles.toast}>
          <p className={styles.message}>{toast.message}</p>
          {toast.action && (
            <button
              type="button"
              className={styles.action}
              onClick={toast.action.onAction}
            >
              {toast.action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface ToastProps {
  toast: ToastData | null;
  onDismiss(): void;
}
