import React, { useState, useEffect } from 'react';
import PageTransition from '../components/PageTransition';
import StatsCard from '../components/StatsCard';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  Chip,
  LinearProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Tooltip,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  History as HistoryIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  PhoneAndroid as DeviceIcon,
  Update as UpdateIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { audit } from '../services/api';
import { format, formatDistance } from 'date-fns';

function AuditTrail() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [filters, setFilters] = useState({
    entityType: '',
    action: '',
    search: '',
  });
  const [availableActions, setAvailableActions] = useState([]);
  const [sortConfig, setSortConfig] = useState({
    field: 'timestamp',
    direction: 'desc'
  });

  useEffect(() => {
    fetchLogs();
  }, [page, rowsPerPage, filters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        ...filters,
      };
      const response = await audit.getLogs(params);
      setLogs(response.data.logs);
      setAvailableActions(response.data.filters?.actions || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      setError('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    setSortConfig({
      field,
      direction: sortConfig.field === field && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  // Sort logs
  const sortedLogs = [...logs].sort((a, b) => {
    let aVal, bVal;
    
    switch(sortConfig.field) {
      case 'timestamp':
        aVal = new Date(a.timestamp).getTime();
        bVal = new Date(b.timestamp).getTime();
        break;
      case 'action':
        aVal = a.action;
        bVal = b.action;
        break;
      case 'entityType':
        aVal = a.entityType;
        bVal = b.entityType;
        break;
      case 'userName':
        aVal = a.userName || '';
        bVal = b.userName || '';
        break;
      default:
        return 0;
    }
    
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const getActionIcon = (action) => {
    if (action.includes('DEVICE')) return <DeviceIcon fontSize="small" />;
    if (action.includes('UPDATE')) return <UpdateIcon fontSize="small" />;
    if (action.includes('SCHEDULE')) return <ScheduleIcon fontSize="small" />;
    if (action.includes('USER')) return <PersonIcon fontSize="small" />;
    return <HistoryIcon fontSize="small" />;
  };

  const getActionColor = (action) => {
    if (action.includes('FAILED') || action.includes('ERROR')) return 'error';
    if (action.includes('CREATE') || action.includes('REGISTER')) return 'success';
    if (action.includes('UPDATE') || action.includes('MODIFY')) return 'info';
    if (action.includes('DELETE') || action.includes('BLOCK')) return 'warning';
    return 'default';
  };

  return (
    <PageTransition>
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Audit Trail
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by entity ID or user"
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Entity Type</InputLabel>
              <Select
                value={filters.entityType}
                label="Entity Type"
                onChange={(e) => setFilters({...filters, entityType: e.target.value})}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="device">Device</MenuItem>
                <MenuItem value="version">Version</MenuItem>
                <MenuItem value="schedule">Schedule</MenuItem>
                <MenuItem value="user">User</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Action</InputLabel>
              <Select
                value={filters.action}
                label="Action"
                onChange={(e) => setFilters({...filters, action: e.target.value})}
              >
                <MenuItem value="">All</MenuItem>
                {availableActions.map(action => (
                  <MenuItem key={action} value={action}>{action}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Events"
            value={logs.length}
            icon={<HistoryIcon />}
            color="#3b82f6"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Success Rate"
            value={`${logs.length ? Math.round((logs.filter(l => l.status === 'success').length / logs.length) * 100) : 0}%`}
            icon={<CheckCircleIcon />}
            color="#22c55e"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Failed Events"
            value={logs.filter(l => l.status === 'failure').length}
            icon={<ErrorIcon />}
            color="#ef4444"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Unique Actions"
            value={new Set(logs.map(l => l.action)).size}
            icon={<WarningIcon />}
            color="#f59e0b"
          />
        </Grid>
      </Grid>

      {/* Timeline View */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Activity Timeline
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell onClick={() => handleSort('timestamp')} sx={{ cursor: 'pointer' }}>
                  Timestamp {sortConfig.field === 'timestamp' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </TableCell>
                <TableCell onClick={() => handleSort('action')} sx={{ cursor: 'pointer' }}>
                  Action {sortConfig.field === 'action' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </TableCell>
                <TableCell onClick={() => handleSort('entityType')} sx={{ cursor: 'pointer' }}>
                  Entity {sortConfig.field === 'entityType' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </TableCell>
                <TableCell onClick={() => handleSort('userName')} sx={{ cursor: 'pointer' }}>
                  User {sortConfig.field === 'userName' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </TableCell>
                <TableCell>Details</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <LinearProgress />
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log._id} hover>
                    <TableCell>
                      <Tooltip title={format(new Date(log.timestamp), 'PPpp')}>
                        <Typography variant="body2">
                          {formatDistance(new Date(log.timestamp), new Date(), { addSuffix: true })}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getActionIcon(log.action)}
                        label={log.action.replace(/_/g, ' ')}
                        size="small"
                        color={getActionColor(log.action)}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {log.entityType}: {log.entityName || log.entityId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {log.userName || 'System'}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {log.userRole || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {log.changes && (
                        <Typography variant="caption" color="textSecondary">
                          {Object.keys(log.changes).length} fields changed
                        </Typography>
                      )}
                      {log.errorMessage && (
                        <Typography variant="caption" color="error">
                          {log.errorMessage}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={log.status || 'success'}
                        size="small"
                        color={log.status === 'failure' ? 'error' : 'success'}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[25, 50, 100]}
          component="div"
          count={logs.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>
    </Box>
  </PageTransition>
  );
}

export default AuditTrail;