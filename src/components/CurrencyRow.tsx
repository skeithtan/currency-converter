import { Grid, IconButton, InputAdornment, ListItemButton, OutlinedInput, Skeleton, Typography } from "@mui/material";
import React, { useRef, useState } from "react";
import { RemoveCircleOutline } from "@mui/icons-material";
import { focusAndOpenKeyboard } from "../utils/focusAndOpenKeyboard";

export function CurrencyRow({
                              code,
                              emoji,
                              symbol,
                              value,
                              isLoading,
                              isEditing,
                              onValueChange,
                              onRemove
                            }: CurrencyRowProps) {
  const inputRef = useRef<HTMLInputElement>();
  const [isUpdatingValue, setIsUpdatingValue] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const formatter = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: code,
    currencyDisplay: "narrowSymbol",
    useGrouping: true
  });
  const formattedNumber = value ? formatter.format(parseFloat(value)) : undefined;

  function handleClick() {
    if (isLoading || isEditing) {
      return;
    }

    setIsUpdatingValue(true);
    if (inputRef.current) {
      focusAndOpenKeyboard(inputRef.current);
    }
  }

  function endUpdatingValue() {
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
            variant="h6"
            mr={3}
          >
            {emoji ?? "💰"} {code}
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
                {formattedNumber}
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
              onKeyDown={(event) => {
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
        )}
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

