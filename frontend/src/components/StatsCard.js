import React from 'react';
import { Card, CardContent, Typography, Box, Skeleton } from '@mui/material';
import { motion } from 'framer-motion';

function StatsCard({ title, value, icon, color, subtitle, loading, onClick }) {
  if (loading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Skeleton variant="text" width="60%" height={20} sx={{ bgcolor: '#1a1a1a' }} />
          <Skeleton variant="text" width="40%" height={40} sx={{ bgcolor: '#1a1a1a' }} />
          <Skeleton variant="text" width="50%" height={16} sx={{ mt: 1, bgcolor: '#1a1a1a' }} />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
    >
      <Card 
        sx={{ 
          height: '100%',
          cursor: onClick ? 'pointer' : 'default',
          borderLeft: `3px solid ${color}`,
        }}
        onClick={onClick}
      >
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 1,
                backgroundColor: `${color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {React.cloneElement(icon, { sx: { fontSize: 20, color: color } })}
            </Box>
          </Box>
          
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5, color: '#ffffff' }}>
            {value}
          </Typography>
          
          <Typography variant="body2" sx={{ color: '#a1a1aa' }}>
            {title}
          </Typography>
          
          {subtitle && (
            <Typography variant="caption" sx={{ color: '#71717a', mt: 1, display: 'block' }}>
              {subtitle}
            </Typography>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default StatsCard;