import {
  Box,
  Fade,
  Grid,
  IconButton,
  InputAdornment,
  ListItemButton,
  OutlinedInput,
  Skeleton,
  Typography,
} from "@mui/material";
import { ChangeEvent, KeyboardEvent, useRef, useState } from "react";
import { RemoveCircleOutlined } from "@mui/icons-material";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { focusAndOpenKeyboard } from "../utils/focusAndOpenKeyboard.ts";

export function CurrencyRow({
  code,
  emoji,
  symbol,
  value,
  isLoading,
  isEditing,
  onValueChange,
  onRemove,
}: CurrencyRowProps) {
  const inputRef = useRef<HTMLInputElement>(undefined);
  const rowRef = useRef<HTMLDivElement>(undefined);
  const [isUpdatingValue, setIsUpdatingValue] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const formatter = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: code,
    currencyDisplay: "narrowSymbol",
    useGrouping: true,
  });
  const formattedNumber = value
    ? formatter.format(parseFloat(value))
    : undefined;

  function findScrollParent(el: HTMLElement | null): HTMLElement | null {
    let parent = el?.parentElement ?? null;
    while (parent && parent.scrollHeight <= parent.clientHeight) {
      parent = parent.parentElement;
    }
    return parent;
  }

  function handleClick() {
    if (isLoading || isEditing) {
      return;
    }

    setIsUpdatingValue(true);
    if (inputRef.current) {
      focusAndOpenKeyboard(inputRef.current);
      const row = rowRef.current;
      if (row) {
        const scrollParent = findScrollParent(row);
        if (scrollParent) {
          const halfHeight = scrollParent.clientHeight / 2;
          scrollParent.style.paddingBottom = `${halfHeight}px`;
          const rowRect = row.getBoundingClientRect();
          const containerRect = scrollParent.getBoundingClientRect();
          const rowTop = rowRect.top - containerRect.top +
            scrollParent.scrollTop;
          const targetScroll = rowTop - scrollParent.clientHeight / 3;
          scrollParent.scrollTo({
            top: Math.max(0, targetScroll),
            behavior: "smooth",
          });
        }
      }
    }
  }

  function endUpdatingValue() {
    setIsUpdatingValue(false);
    // Remove the extra padding added for centering
    const scrollParent = findScrollParent(rowRef.current);
    if (scrollParent) {
      scrollParent.style.paddingBottom = "";
    }
    const newValue = inputRef.current?.valueAsNumber;
    if (newValue == null) {
      return;
    }

    onValueChange(newValue);
    setInputValue("");
  }

  return (
    <ListItemButton
      ref={rowRef}
      onClick={handleClick}
      sx={{ minHeight: 72, position: "relative" }}
      disabled={isLoading}
      divider
      disableRipple={isEditing}
    >
      <Grid
        container
        sx={{
          width: "100%",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "nowrap",
        }}
      >
        <Grid
          container
          sx={{ alignItems: "center", flexWrap: "nowrap" }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              width: isEditing ? 32 : 0,
              opacity: isEditing ? 1 : 0,
              overflow: "hidden",
              flexShrink: 0,
              transition: "width 0.15s ease, opacity 0.15s ease",
            }}
          >
            <DragIndicatorIcon color="action" sx={{ cursor: "grab" }} />
          </Box>
          <Typography
            variant="h6"
            sx={{ mr: 3, whiteSpace: "nowrap" }}
          >
            {emoji ?? "💰"} {code}
          </Typography>
        </Grid>

        {isLoading && (
          <Grid size={{ xs: 6 }}>
            <Skeleton
              variant="text"
              sx={{ fontSize: "2rem" }}
            />
          </Grid>
        )}

        <Fade in={isEditing} unmountOnExit>
          <IconButton
            color="error"
            onClick={onRemove}
            sx={{ position: "absolute", right: 16 }}
          >
            <RemoveCircleOutlined />
          </IconButton>
        </Fade>

        <Fade in={!isLoading && !isEditing} unmountOnExit>
          <Grid size={{ xs: 8 }}>
            {!isUpdatingValue && (
              <Typography
                variant="h5"
                align="right"
              >
                {formattedNumber}
              </Typography>
            )}

            <OutlinedInput
              fullWidth
              type="number"
              sx={{ ...(isUpdatingValue ? {} : { display: "none" }) }}
              slotProps={{ input: { inputMode: "decimal" } }}
              inputRef={inputRef}
              value={inputValue}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setInputValue(event.target.value)}
              onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                if (event.key === "Enter") {
                  endUpdatingValue();
                }
              }}
              onBlur={endUpdatingValue}
              startAdornment={
                <InputAdornment position="start">{symbol}</InputAdornment>
              }
            />
          </Grid>
        </Fade>
      </Grid>
    </ListItemButton>
  );
}

interface CurrencyRowProps {
  code: string;
  symbol: string;
  isLoading: boolean;
  isEditing: boolean;
  emoji?: string;
  value?: string;

  onValueChange(newValue: number): void;

  onRemove(): void;
}
