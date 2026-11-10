import { Box, Collapse, IconButton, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import ScheduleIcon from "@mui/icons-material/Schedule";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * A slim, dismissible bar noting that the rates in use are more than a day
 * old. It sits below the list rather than over it and never interrupts input.
 */
export function StaleRatesNotice(
  { open, fetchedAt, now, onDismiss }: StaleRatesNoticeProps,
) {
  const theme = useTheme();
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
    <Collapse in={open} sx={{ flexShrink: 0 }} unmountOnExit>
      <Box
        role="status"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          pl: 2,
          pr: 0.5,
          pt: 0.5,
          pb: "calc(env(safe-area-inset-bottom, 0px) + 4px)",
          borderTop: "1px solid",
          borderColor: theme.palette.divider,
          background: alpha(
            theme.palette.warning.main,
            theme.palette.mode === "dark" ? 0.16 : 0.1,
          ),
          color: theme.palette.text.secondary,
        }}
      >
        <ScheduleIcon
          fontSize="small"
          sx={{ color: theme.palette.warning.main }}
        />
        <Typography variant="body2" sx={{ flex: 1 }} title={exactDate}>
          Rates are {days === 1 ? "1 day" : `${days} days`}{" "}
          old and may be outdated
        </Typography>
        <IconButton
          size="small"
          aria-label="Dismiss stale rates notice"
          onClick={onDismiss}
          color="inherit"
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
    </Collapse>
  );
}

interface StaleRatesNoticeProps {
  open: boolean;
  fetchedAt: string;
  now: Date;
  onDismiss(): void;
}
