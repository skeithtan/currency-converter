import { Box, Button, Grid, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { CurrencyRow } from "./CurrencyRow";
import React, { useState } from "react";
import { CurrencyRowData } from "../types/CurrencyRowData";


export function CurrencyDisplay({
                                  onAddCurrencyClick,
                                  currencyRows,
                                  onRowValueChange,
                                  onRemoveRow,
                                }: CurrencyDisplayProps) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <>
      <Box sx={{ px: 1, py: 2, borderBottom: "1px #ddd solid" }}>
        <Grid
          container
          alignItems="center"
          justifyContent="space-between"
        >
          {!isEditing && (
            <Grid item>
              <Button onClick={() => setIsEditing(true)}>Modify</Button>
            </Grid>
          )}

          {!isEditing && (
            <Grid item>
              <Button
                endIcon={<AddIcon />}
                onClick={onAddCurrencyClick}
              >
                Add
              </Button>
            </Grid>
          )}

          {isEditing && (
            <Grid item>
              <Button onClick={() => setIsEditing(false)}>Done</Button>
            </Grid>
          )}
        </Grid>

        <Typography
          variant="h4"
          sx={{ px: 1, pt: 1 }}
        >
          Currencies
        </Typography>
      </Box>
      <Box sx={{ overflow: "auto" }}>
        {currencyRows.map((row) => (
          <CurrencyRow
            key={row.code}
            code={row.code}
            emoji={row.emoji}
            symbol={row.symbol}
            value={row.value}
            isLoading={row.isLoading}
            isEditing={isEditing}
            onValueChange={(newValue) =>
              onRowValueChange(row, newValue)
            }
            onRemove={() => onRemoveRow(row)}
          />
        ))}
      </Box>
    </>
  );
}

interface CurrencyDisplayProps {
  currencyRows: CurrencyRowData[];

  onAddCurrencyClick(): void;

  onRowValueChange(row: CurrencyRowData, newValue: number): void;

  onRemoveRow(row: CurrencyRowData): void;
}

