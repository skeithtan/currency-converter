import { Button, Grid, Typography, useTheme } from "@mui/material";
import SvgIcon from "@mui/material/SvgIcon";

export function EmptyState(
  { icon: Icon, emptyText, buttonText, onButtonClick }: EmptyStateProps,
) {
  const theme = useTheme();

  return (
    <Grid
      container
      direction="column"
      sx={{ p: 8 }}
      spacing={2}
      alignItems="center"
      justifyContent="center"
    >
      {Icon &&
        (
          <Grid>
            <Icon
              fontSize="large"
              sx={{ color: theme.palette.text.secondary }}
            />
          </Grid>
        )}

      <Grid size={{ xs: 10, sm: 8 }}>
        <Typography
          variant="h6"
          align="center"
          color={theme.palette.text.secondary}
        >
          {emptyText}
        </Typography>
      </Grid>

      {buttonText &&
        (
          <Grid>
            <Button onClick={onButtonClick}>Add a currency</Button>
          </Grid>
        )}
    </Grid>
  );
}

interface EmptyStateProps {
  emptyText: string;
  icon?: typeof SvgIcon;
  buttonText?: string;

  onButtonClick?(): void;
}
