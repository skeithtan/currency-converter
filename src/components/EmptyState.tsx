import { Button, Grid, Typography } from "@mui/material";
import SvgIcon from "@mui/material/SvgIcon/SvgIcon";

export function EmptyState({ icon: Icon, emptyText, buttonText, onButtonClick }: EmptyStateProps) {
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
        <Grid item>
          <Icon fontSize="large" />
        </Grid>
      }

      <Grid item>
        <Typography
          variant="h6"
          align="center"
        >
          {emptyText}
        </Typography>
      </Grid>

      {buttonText &&
        <Grid item>
          <Button onClick={onButtonClick}>Add a currency</Button>
        </Grid>
      }
    </Grid>
  );
}

interface EmptyStateProps {
  emptyText: string;
  icon?: typeof SvgIcon;
  buttonText?: string;

  onButtonClick?(): void;
}