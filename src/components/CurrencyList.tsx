import { Box, Button, Grid, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { CurrencyRow } from "./CurrencyRow.tsx";
import { useEffect, useState } from "react";
import { CurrencyRowData } from "../types/CurrencyRowData.ts";
import { EmptyState } from "./EmptyState.tsx";
import CurrencyExchangeIcon from "@mui/icons-material/CurrencyExchange";
import { useTheme } from "../theme.ts";
import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from "@hello-pangea/dnd";

export function CurrencyList({
  onAddCurrencyClick,
  currencyRows,
  onRowValueChange,
  onRemoveRow,
  onReorder,
}: CurrencyDisplayProps & {
  onReorder?: (newRows: CurrencyRowData[]) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    if (currencyRows.length === 0 && isEditing) {
      setIsEditing(false);
    }
  }, [currencyRows.length, isEditing]);

  function handleDragEnd(result: DropResult) {
    if (
      !result.destination || result.destination.index === result.source.index
    ) return;
    const newRows = Array.from(currencyRows);
    const [removed] = newRows.splice(result.source.index, 1);
    newRows.splice(result.destination.index, 0, removed);
    onReorder && onReorder(newRows);
  }

  return (
    <>
      <Box
        sx={{
          px: 1,
          py: 2,
          borderBottom: "1px solid",
          borderColor: theme.palette.divider,
          background: theme.palette.primary.main,
          color: theme.palette.primary.light,

          [theme.breakpoints.down("sm")]: {
            position: "sticky",
            top: 0,
            zIndex: 1000,
          },
        }}
      >
        <Grid
          container
          alignItems="center"
          justifyContent="space-between"
        >
          {!isEditing && (
            <Grid>
              <Button
                disabled={currencyRows.length === 0}
                onClick={() => setIsEditing(true)}
                color="inherit"
              >
                Modify
              </Button>
            </Grid>
          )}

          {!isEditing && (
            <Grid>
              <Button
                endIcon={<AddIcon />}
                onClick={onAddCurrencyClick}
                color="inherit"
              >
                Add
              </Button>
            </Grid>
          )}

          {isEditing && (
            <Grid>
              <Button color="inherit" onClick={() => setIsEditing(false)}>
                Done
              </Button>
            </Grid>
          )}
        </Grid>

        <Typography
          variant="h4"
          sx={{ px: 1 }}
          fontWeight={600}
          color={theme.palette.primary.contrastText}
        >
          Currencies
        </Typography>
      </Box>
      <Box sx={{ overflow: "auto" }}>
        {isEditing
          ? (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="currency-list">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}>
                    {currencyRows.map((row, index) => (
                      <Draggable
                        key={row.code}
                        draggableId={row.code}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              ...provided.draggableProps.style,
                              opacity: snapshot.isDragging ? 0.7 : 1,
                            }}
                          >
                            <CurrencyRow
                              code={row.code}
                              emoji={row.emoji}
                              symbol={row.symbol}
                              value={row.value}
                              isLoading={row.isLoading}
                              isEditing={isEditing}
                              onValueChange={(newValue) =>
                                onRowValueChange(row, newValue)}
                              onRemove={() => onRemoveRow(row)}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )
          : (
            currencyRows.map((row) => (
              <CurrencyRow
                key={row.code}
                code={row.code}
                emoji={row.emoji}
                symbol={row.symbol}
                value={row.value}
                isLoading={row.isLoading}
                isEditing={isEditing}
                onValueChange={(newValue) => onRowValueChange(row, newValue)}
                onRemove={() => onRemoveRow(row)}
              />
            ))
          )}
        {currencyRows.length === 0 && (
          <EmptyState
            icon={CurrencyExchangeIcon}
            emptyText="Add at least two currencies to see the conversion."
            buttonText="Add a currency"
            onButtonClick={onAddCurrencyClick}
          />
        )}
      </Box>
    </>
  );
}

interface CurrencyDisplayProps {
  currencyRows: CurrencyRowData[];
  onAddCurrencyClick(): void;
  onRowValueChange(row: CurrencyRowData, newValue: number): void;
  onRemoveRow(row: CurrencyRowData): void;
  // onReorder is optional and added for drag-and-drop
  onReorder?: (newRows: CurrencyRowData[]) => void;
}
