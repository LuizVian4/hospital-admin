import { createTheme } from '@mui/material/styles';
import { brandColors } from './brand';

export const muiTheme = createTheme({
  palette: {
    primary: {
      main: brandColors.darkBlue,
      light: brandColors.mint,
      dark: brandColors.darkBlueDark,
      contrastText: '#ffffff',
    },
    secondary: {
      main: brandColors.mint,
      dark: brandColors.mintDark,
      contrastText: brandColors.darkBlue,
    },
    warning: {
      main: '#d97706',
      light: '#f59e0b',
    },
    success: {
      main: '#16a34a',
    },
    background: {
      default: brandColors.lightGray,
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: [
      'system-ui',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      'sans-serif',
    ].join(','),
    h4: { fontWeight: 700 },
    h6: { fontWeight: 600 },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          border: '1px solid #e2e8f0',
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          border: '1px solid #e2e8f0',
        },
      },
    },
  },
});
