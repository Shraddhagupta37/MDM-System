import React from 'react';
import { Box, Typography, Button, Paper, alpha } from '@mui/material';
import { motion } from 'framer-motion';
import AddIcon from '@mui/icons-material/Add';
import { useTheme } from '@mui/material/styles';

function EmptyState({ 
  icon, 
  title, 
  description, 
  actionText, 
  onAction,
  secondaryAction,
}) {
  const theme = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Paper
        sx={{
          p: 6,
          textAlign: 'center',
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
          border: '2px dashed',
          borderColor: alpha(theme.palette.primary.main, 0.2),
          borderRadius: 4,
        }}
      >
        <Box
          sx={{
            display: 'inline-flex',
            p: 3,
            borderRadius: '50%',
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            color: theme.palette.primary.main,
            mb: 3,
            border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          }}
        >
          {React.cloneElement(icon, { sx: { fontSize: 48 } })}
        </Box>
        
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: '#f1f5f9' }}>
          {title}
        </Typography>
        
        <Typography variant="body1" sx={{ color: alpha('#f1f5f9', 0.7), mb: 4, maxWidth: 400, mx: 'auto' }}>
          {description}
        </Typography>
        
        {actionText && onAction && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onAction}
            sx={{ mr: secondaryAction ? 1 : 0 }}
          >
            {actionText}
          </Button>
        )}
        
        {secondaryAction}
      </Paper>
    </motion.div>
  );
}

export default EmptyState;