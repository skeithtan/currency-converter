import { Grid, IconButton, InputAdornment, ListItemButton, OutlinedInput, Skeleton, Typography } from "@mui/material";
import React, { useRef, useState } from "react";
import { RemoveCircleOutline } from "@mui/icons-material";

const DEFAULT_CURRENCY_EMOJI = `P`;

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
  const inputRef = useRef<HTMLInputElement>();
  const [isUpdatingValue, setIsUpdatingValue] = useState(false);
  const [inputValue, setInputValue] = useState("");

  function handleClick() {
    if (isLoading || isEditing) {
      return;
    }

    setIsUpdatingValue(true);
    if (inputRef.current) {
      focusAndOpenKeyboard(inputRef.current);
    }
  }

  function handleBlur() {
    setIsUpdatingValue(false);
    const newValue = inputRef.current?.valueAsNumber;
    if (newValue == null) {
      return;
    }

    onValueChange(newValue);
    setInputValue("");
  }

  return (
    <ListItemButton
      onClick={handleClick}
      sx={{ minHeight: 72 }}
      disabled={isLoading}
      divider
    >
      <Grid
        container
        justifyContent="space-between"
        alignItems="center"
      >
        <Grid item>
          <Typography
            variant="h5"
            mr={3}
          >
            {emoji ?? DEFAULT_CURRENCY_EMOJI} {code}
          </Typography>
        </Grid>

        {isLoading && (
          <Grid
            item
            xs
          >
            <Skeleton
              variant="text"
              sx={{ fontSize: "2rem" }}
            />
          </Grid>
        )}

        {isEditing && (
          <Grid item>
            <IconButton
              color="error"
              onClick={onRemove}
            >
              <RemoveCircleOutline />
            </IconButton>
          </Grid>
        )}

        {!isLoading && !isEditing && (
          <Grid
            item
            xs
          >
            {!isUpdatingValue && (
              <Typography
                variant="h5"
                align="right"
              >
                {symbol} {value}
              </Typography>
            )}

            <OutlinedInput
              fullWidth
              type="number"
              sx={{ ...(isUpdatingValue ? {} : { display: "none" }) }}
              inputProps={{ inputMode: "decimal" }}
              inputRef={inputRef}
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onBlur={handleBlur}
              startAdornment={
                <InputAdornment position="start">{symbol}</InputAdornment>
              }
            />
          </Grid>
        )}
      </Grid>
    </ListItemButton>
  );
}

/**
 * Opens the keyboard in iOS
 * @see https://stackoverflow.com/a/55425845
 */
function focusAndOpenKeyboard(element: HTMLInputElement) {
  const timeout = 100;
  // Align temp input element approximately where the input element is
  // so the cursor doesn't jump around
  const __tempEl__ = document.createElement("input");
  __tempEl__.style.position = "absolute";
  __tempEl__.style.top = element.offsetTop + 7 + "px";
  __tempEl__.style.left = element.offsetLeft + "px";
  __tempEl__.style.height = "0";
  __tempEl__.style.opacity = "0";
  __tempEl__.type = "number";
  __tempEl__.inputMode = "decimal";
  // Put this temp element as a child of the page <body> and focus on it
  document.body.appendChild(__tempEl__);
  __tempEl__.focus();

  // The keyboard is open. Now do a delayed focus on the target element
  setTimeout(function() {
    element.focus();
    // Remove the temp element
    document.body.removeChild(__tempEl__);
  }, timeout);
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

// export function CurrencyRow(props: CurrencyRowProps) {
//   return <div></div>
// }
