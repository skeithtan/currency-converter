import {
  Grid,
  IconButton,
  InputAdornment,
  ListItemButton,
  OutlinedInput,
  Skeleton,
  Typography,
} from "@mui/material";
import { ChangeEvent, KeyboardEvent, useRef, useState } from "react";
import { RemoveCircleOutline } from "@mui/icons-material";
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
      disableRipple={isEditing}
    >
      <Grid
        container
        width="100%"
        justifyContent="space-between"
        alignItems="center"
        wrap="nowrap"
      >
        <Grid container spacing={2} alignItems="center">
          {isEditing && (
            <DragIndicatorIcon color="action" sx={{ cursor: "grab" }} />
          )}
          <Typography
            variant="h6"
            mr={3}
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

        {isEditing && (
          <Grid>
            <IconButton
              color="error"
              onClick={onRemove}
            >
              <RemoveCircleOutline />
            </IconButton>
          </Grid>
        )}

        {!isLoading && !isEditing && (
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
              inputProps={{ inputMode: "decimal" }}
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
