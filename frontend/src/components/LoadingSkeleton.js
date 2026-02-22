import React from 'react';
import { Box, Skeleton, Paper, Grid } from '@mui/material';

function LoadingSkeleton({ type = 'table' }) {
  if (type === 'dashboard') {
    return (
      <Box sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Paper sx={{ p: 3 }}>
                <Skeleton variant="text" width="60%" height={20} />
                <Skeleton variant="text" width="40%" height={40} sx={{ my: 1 }} />
                <Skeleton variant="text" width="50%" height={16} />
              </Paper>
            </Grid>
          ))}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Skeleton variant="rectangular" height={300} />
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  }

  if (type === 'card') {
    return (
      <Paper sx={{ p: 3 }}>
        <Skeleton variant="text" width="60%" height={30} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={200} sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Skeleton variant="text" width="30%" />
          <Skeleton variant="text" width="30%" />
        </Box>
      </Paper>
    );
  }

  // Default table skeleton
  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Skeleton variant="text" width="30%" height={40} />
        <Skeleton variant="text" width="20%" height={40} />
      </Box>
      {[1, 2, 3, 4, 5].map((i) => (
        <Box key={i} sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Skeleton variant="text" width="100%" height={40} />
        </Box>
      ))}
    </Paper>
  );
}

export default LoadingSkeleton;