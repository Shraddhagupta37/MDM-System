import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#60a5fa', // Soft blue
      light: '#93c5fd',
      dark: '#3b82f6',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#c084fc', // Soft purple
      light: '#d8b4fe',
      dark: '#a855f7',
      contrastText: '#ffffff',
    },
    success: {
      main: '#4ade80', // Soft green
      light: '#86efac',
      dark: '#22c55e',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#fbbf24', // Soft amber
      light: '#fcd34d',
      dark: '#f59e0b',
      contrastText: '#000000',
    },
    error: {
      main: '#f87171', // Soft red
      light: '#fca5a5',
      dark: '#ef4444',
      contrastText: '#ffffff',
    },
    info: {
      main: '#38bdf8', // Sky blue
      light: '#7dd3fc',
      dark: '#0284c7',
      contrastText: '#ffffff',
    },
    background: {
      default: '#0a0a0f', // Deep space
      paper: 'rgba(18, 18, 24, 0.8)', // Glass effect base
      elevated: 'rgba(24, 24, 32, 0.9)',
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)',
      disabled: 'rgba(255, 255, 255, 0.3)',
    },
    divider: 'rgba(255, 255, 255, 0.1)',
    action: {
      active: 'rgba(255, 255, 255, 0.8)',
      hover: 'rgba(96, 165, 250, 0.1)',
      selected: 'rgba(96, 165, 250, 0.2)',
      disabled: 'rgba(255, 255, 255, 0.2)',
      disabledBackground: 'rgba(255, 255, 255, 0.05)',
    },
  },
  typography: {
    fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: {
      fontWeight: 600,
      fontSize: '2.5rem',
      letterSpacing: '-0.02em',
      background: 'linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.8) 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
      letterSpacing: '-0.01em',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.25rem',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.125rem',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 500,
      color: 'rgba(255, 255, 255, 0.7)',
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
      color: 'rgba(255, 255, 255, 0.6)',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
      color: 'rgba(255, 255, 255, 0.8)',
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
      fontSize: '0.875rem',
      letterSpacing: '0.01em',
    },
    caption: {
      fontSize: '0.75rem',
      color: 'rgba(255, 255, 255, 0.5)',
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1)',
    '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
    '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
    ...Array(20).fill('0 25px 50px -12px rgba(0, 0, 0, 0.4)'),
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: "rgba(255, 255, 255, 0.2) rgba(255, 255, 255, 0.05)",
          "&::-webkit-scrollbar, & *::-webkit-scrollbar": {
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            width: 8,
            height: 8,
          },
          "&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb": {
            borderRadius: 8,
            backgroundColor: "rgba(255, 255, 255, 0.2)",
            minHeight: 24,
            border: "2px solid transparent",
          },
          "&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus": {
            backgroundColor: "rgba(96, 165, 250, 0.5)",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: 'transparent',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.36)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(18, 18, 24, 0.8)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 16,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-4px)',
            border: '1px solid rgba(96, 165, 250, 0.3)',
            boxShadow: '0 20px 40px -12px rgba(96, 165, 250, 0.3)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(10, 10, 15, 0.8)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: 'none',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: 'rgba(10, 10, 15, 0.9)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderRight: '1px solid rgba(255, 255, 255, 0.1)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          fontSize: '0.875rem',
          fontWeight: 500,
          textTransform: 'none',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-1px)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 4px 12px rgba(96, 165, 250, 0.3)',
          '&:hover': {
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            boxShadow: '0 6px 16px rgba(96, 165, 250, 0.4)',
          },
        },
        containedSecondary: {
          background: 'linear-gradient(135deg, #c084fc 0%, #a855f7 100%)',
          boxShadow: '0 4px 12px rgba(192, 132, 252, 0.3)',
          '&:hover': {
            background: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
          },
        },
        outlined: {
          borderColor: 'rgba(255, 255, 255, 0.2)',
          color: 'rgba(255, 255, 255, 0.9)',
          '&:hover': {
            borderColor: '#60a5fa',
            backgroundColor: 'rgba(96, 165, 250, 0.1)',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '16px',
          fontSize: '0.875rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          color: 'rgba(255, 255, 255, 0.9)',
        },
        head: {
          fontWeight: 600,
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.2s',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 500,
          fontSize: '0.75rem',
          height: 24,
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        },
        filled: {
          '&.MuiChip-colorSuccess': {
            backgroundColor: 'rgba(74, 222, 128, 0.15)',
            color: '#4ade80',
            border: '1px solid rgba(74, 222, 128, 0.3)',
          },
          '&.MuiChip-colorWarning': {
            backgroundColor: 'rgba(251, 191, 36, 0.15)',
            color: '#fbbf24',
            border: '1px solid rgba(251, 191, 36, 0.3)',
          },
          '&.MuiChip-colorError': {
            backgroundColor: 'rgba(248, 113, 113, 0.15)',
            color: '#f87171',
            border: '1px solid rgba(248, 113, 113, 0.3)',
          },
          '&.MuiChip-colorPrimary': {
            backgroundColor: 'rgba(96, 165, 250, 0.15)',
            color: '#60a5fa',
            border: '1px solid rgba(96, 165, 250, 0.3)',
          },
          '&.MuiChip-colorSecondary': {
            backgroundColor: 'rgba(192, 132, 252, 0.15)',
            color: '#c084fc',
            border: '1px solid rgba(192, 132, 252, 0.3)',
          },
        },
        outlined: {
          borderColor: 'rgba(255, 255, 255, 0.2)',
          color: 'rgba(255, 255, 255, 0.8)',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(4px)',
        },
        bar: {
          borderRadius: 4,
          background: 'linear-gradient(90deg, #60a5fa, #c084fc)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backdropFilter: 'blur(4px)',
            '& fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.1)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(96, 165, 250, 0.5)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#60a5fa',
            },
          },
          '& .MuiInputLabel-root': {
            color: 'rgba(255, 255, 255, 0.5)',
            '&.Mui-focused': {
              color: '#60a5fa',
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(4px)',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255, 255, 255, 0.1)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(96, 165, 250, 0.5)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#60a5fa',
          },
        },
        icon: {
          color: 'rgba(255, 255, 255, 0.5)',
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: 'rgba(18, 18, 24, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          color: 'rgba(255, 255, 255, 0.9)',
          '&:hover': {
            backgroundColor: 'rgba(96, 165, 250, 0.1)',
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(96, 165, 250, 0.2)',
            '&:hover': {
              backgroundColor: 'rgba(96, 165, 250, 0.3)',
            },
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: 'rgba(18, 18, 24, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(4px)',
          border: '1px solid',
        },
        standardSuccess: {
          backgroundColor: 'rgba(74, 222, 128, 0.1)',
          color: '#4ade80',
          borderColor: 'rgba(74, 222, 128, 0.2)',
        },
        standardError: {
          backgroundColor: 'rgba(248, 113, 113, 0.1)',
          color: '#f87171',
          borderColor: 'rgba(248, 113, 113, 0.2)',
        },
        standardWarning: {
          backgroundColor: 'rgba(251, 191, 36, 0.1)',
          color: '#fbbf24',
          borderColor: 'rgba(251, 191, 36, 0.2)',
        },
        standardInfo: {
          backgroundColor: 'rgba(96, 165, 250, 0.1)',
          color: '#60a5fa',
          borderColor: 'rgba(96, 165, 250, 0.2)',
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(255, 255, 255, 0.1)',
          color: 'rgba(255, 255, 255, 0.7)',
          '&.Mui-selected': {
            backgroundColor: 'rgba(96, 165, 250, 0.2)',
            color: '#60a5fa',
            borderColor: '#60a5fa',
          },
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          color: 'rgba(255, 255, 255, 0.7)',
          '&.Mui-selected': {
            color: '#60a5fa',
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: 'rgba(18, 18, 24, 0.9)',
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          fontSize: '0.75rem',
          padding: '8px 12px',
        },
      },
    },
  },
});

export default theme;