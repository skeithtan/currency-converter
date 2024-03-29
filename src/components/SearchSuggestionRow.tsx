import { Grid, ListItemButton, ListItemText, Typography } from "@mui/material";
import React from "react";
import { SearchSuggestionData } from "../types/SearchSuggestionData";

export function SearchSuggestionRow({ suggestion, alreadyAdded, onClick }: SearchSuggestionRowProps) {
  const { emoji, symbol, code } = suggestion;
  return (
    <ListItemButton
      divider
      onClick={onClick}
      disabled={alreadyAdded}
    >
      <Grid
        container
        justifyContent="space-between"
        alignItems="center"
      >
        <Grid item>
          <ListItemText
            primary={`${emoji ?? "💰"} ${code}`}
            secondary={alreadyAdded ? "Already added" : undefined}
          />
        </Grid>

        <Grid item>
          <Typography variant="subtitle1">{symbol}</Typography>
        </Grid>
      </Grid>
    </ListItemButton>
  );
}

interface SearchSuggestionRowProps {
  suggestion: SearchSuggestionData;
  alreadyAdded: boolean;

  onClick(): void;
}