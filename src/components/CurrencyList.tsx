import { Box, Button, Fade, Grid, Typography } from "@mui/material";
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
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)",
          borderBottom: "1px solid",
          borderColor: theme.palette.divider,
          background: theme.palette.primary.main,
          color: theme.palette.primary.light,
          flexShrink: 0,
        }}
      >
        <Box sx={{ position: "relative", minHeight: 40 }}>
          <Fade in={!isEditing}>
            <Grid
              container
              sx={{
                alignItems: "center",
                justifyContent: "space-between",
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
              }}
            >
              <Grid>
                <Button
                  disabled={currencyRows.length === 0}
                  onClick={() => setIsEditing(true)}
                  color="inherit"
                >
                  Modify
                </Button>
              </Grid>
              <Grid>
                <Button
                  endIcon={<AddIcon />}
                  onClick={onAddCurrencyClick}
                  color="inherit"
                >
                  Add
                </Button>
              </Grid>
            </Grid>
          </Fade>

          <Fade in={isEditing}>
            <Grid
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
              }}
            >
              <Button color="inherit" onClick={() => setIsEditing(false)}>
                Done
              </Button>
            </Grid>
          </Fade>
        </Box>

        <Typography
          variant="h4"
          sx={{
            px: 1,
            fontWeight: 600,
            color: theme.palette.primary.contrastText,
          }}
        >
          Currencies
        </Typography>
      </Box>
      <Box
        sx={{
          flex: 1,
          position: "relative",
          overflow: "hidden",
          minHeight: 0,
        }}
      >
        <Box
          sx={{
            overflow: "auto",
            height: "100%",
            WebkitOverflowScrolling: "touch",
            overscrollBehavior: "contain",
          }}
        >
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="currency-list">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps}>
                  {currencyRows.map((row, index) => (
                    <Draggable
                      key={row.code}
                      draggableId={row.code}
                      index={index}
                      isDragDisabled={!isEditing}
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
          {currencyRows.length === 0 && (
            <EmptyState
              icon={CurrencyExchangeIcon}
              emptyText="Add at least two currencies to see the conversion."
              buttonText="Add a currency"
              onButtonClick={onAddCurrencyClick}
            />
          )}
        </Box>
        {currencyRows.length > 0 && (
          <Box
            sx={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 32,
              background:
                `linear-gradient(to bottom, transparent, ${theme.palette.background.default})`,
              pointerEvents: "none",
            }}
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
