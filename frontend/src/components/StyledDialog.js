import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  alpha,
} from '@mui/material';

function StyledDialog({
  open,
  onClose,
  title,
  children,
  onConfirm,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor = 'primary',
  loading = false,
  maxWidth = 'sm',
  fullWidth = true,
  showConfirm = true,
  showCancel = true,
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      PaperProps={{
        sx: {
          bgcolor: '#111111',
          border: '1px solid #27272a',
          borderRadius: 2,
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
        }
      }}
    >
      {title && (
        <DialogTitle sx={{ 
          color: '#ffffff', 
          borderBottom: '1px solid #27272a',
          pb: 2,
          fontWeight: 600,
        }}>
          {title}
        </DialogTitle>
      )}
      
      <DialogContent sx={{ pt: title ? 3 : 3 }}>
        {children}
      </DialogContent>
      
      {(showCancel || showConfirm) && (
        <DialogActions sx={{ 
          p: 3, 
          borderTop: '1px solid #27272a',
          bgcolor: '#0a0a0a',
        }}>
          {showCancel && (
            <Button 
              onClick={onClose} 
              disabled={loading}
              sx={{ 
                color: '#a1a1aa',
                '&:hover': { 
                  color: '#ffffff',
                  bgcolor: 'rgba(255,255,255,0.05)',
                },
                '&:disabled': {
                  color: '#52525b',
                },
              }}
            >
              {cancelText}
            </Button>
          )}
          
          {showConfirm && (
            <Button 
              onClick={onConfirm} 
              variant="contained"
              disabled={loading}
              sx={{
                bgcolor: confirmColor === 'error' ? '#ef4444' : 
                        confirmColor === 'success' ? '#22c55e' : 
                        confirmColor === 'warning' ? '#f59e0b' : '#60a5fa',
                '&:hover': { 
                  bgcolor: confirmColor === 'error' ? '#dc2626' : 
                          confirmColor === 'success' ? '#16a34a' : 
                          confirmColor === 'warning' ? '#d97706' : '#3b82f6',
                },
                '&:disabled': {
                  bgcolor: '#27272a',
                  color: '#71717a',
                },
              }}
            >
              {loading ? <CircularProgress size={24} sx={{ color: '#ffffff' }} /> : confirmText}
            </Button>
          )}
        </DialogActions>
      )}
    </Dialog>
  );
}

export default StyledDialog;