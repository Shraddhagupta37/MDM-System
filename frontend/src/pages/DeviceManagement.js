import React, { useState, useEffect } from 'react';
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
  IconButton,
  Collapse,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tooltip,
  Avatar,
  Divider,
  Popover,
  FormControlLabel,
  Checkbox,
  Radio,
  RadioGroup,
  FormGroup,
  Badge,
  Skeleton,
  Grow,
  alpha,
  useTheme,
  MenuItem,
} from '@mui/material';
import {
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  PhoneAndroid as PhoneAndroidIcon,
  Block as BlockIcon,
  Refresh as RefreshIcon,
  Timeline as TimelineIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Info as InfoIcon,
  LocationOn as LocationIcon,
  BatteryFull as BatteryIcon,
  Storage as StorageIcon,
  NetworkCheck as NetworkIcon,
  FilterList as FilterListIcon,
  ClearAll as ClearAllIcon,
  GetApp as GetAppIcon,
  MoreVert as MoreVertIcon,
  ViewModule as ViewModuleIcon,
  ViewList as ViewListIcon,
  Update as UpdateIcon,
} from '@mui/icons-material';
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent';
import { devices, updates, audit, versions } from '../services/api';
import { format, formatDistance } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '../components/PageTransition';
import StatsCard from '../components/StatsCard';
import EmptyState from '../components/EmptyState';

function DeviceManagement() {
  const theme = useTheme();
  const [devicesList, setDevicesList] = useState([]);
  const [stats, setStats] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedDevice, setExpandedDevice] = useState(null);
  const [deviceTimeline, setDeviceTimeline] = useState({});
  const [deviceJobs, setDeviceJobs] = useState({});
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterVersion, setFilterVersion] = useState('all');
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [bulkActionDialog, setBulkActionDialog] = useState(false);
  const [viewMode, setViewMode] = useState('table');
  const [advancedFilters, setAdvancedFilters] = useState({
    osVersions: [],
    batteryLevel: 'all',
    networkType: 'all',
    lastSeenDays: '30',
    clientCustomizations: [],
  });

  useEffect(() => {
    fetchDevices();
  }, [page, rowsPerPage, searchTerm, filterStatus, filterVersion, advancedFilters]);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      
      const params = {
        page: page + 1,
        limit: rowsPerPage,
      };
      
      if (searchTerm) params.search = searchTerm;
      if (filterStatus && filterStatus !== 'all') params.status = filterStatus;
      
      if (advancedFilters.osVersions.length > 0) {
        params.osVersions = advancedFilters.osVersions.join(',');
      }
      if (advancedFilters.batteryLevel !== 'all') {
        params.batteryLevel = advancedFilters.batteryLevel;
      }
      if (advancedFilters.lastSeenDays !== 'all') {
        params.lastSeenDays = advancedFilters.lastSeenDays;
      }
      
      console.log('🔍 Fetching devices with params:', params);
      
      const response = await devices.getAll(params);
      
      setDevicesList(response.data.devices);
      setStats(response.data.stats);
      setError(null);
    } catch (error) {
      console.error('❌ Error fetching devices:', error);
      setError('Failed to load devices');
    } finally {
      setLoading(false);
    }
  };

  const fetchDeviceDetails = async (imei) => {
    try {
      const [deviceRes, jobsRes, timelineRes] = await Promise.all([
        devices.getOne(imei),
        updates.getDeviceHistory(imei),
        audit.getDeviceTimeline(imei)
      ]);
      
      setDeviceJobs(prev => ({ ...prev, [imei]: jobsRes.data.jobs }));
      setDeviceTimeline(prev => ({ ...prev, [imei]: timelineRes.data.timeline }));
    } catch (error) {
      console.error('Error fetching device details:', error);
    }
  };

  const handleExpandDevice = (imei) => {
    if (expandedDevice === imei) {
      setExpandedDevice(null);
    } else {
      setExpandedDevice(imei);
      fetchDeviceDetails(imei);
    }
  };

  const handleBlockDevice = async () => {
    try {
      await devices.block(selectedDevice.imei);
      setBlockDialogOpen(false);
      fetchDevices();
    } catch (error) {
      console.error('Error blocking device:', error);
      setError('Failed to block device');
    }
  };

  const simulateProgress = async (job) => {
    try {
      const actions = ['start_download', 'progress_download', 'complete_download', 'start_install', 'progress_install', 'complete_install'];
      let currentIndex = 0;
      
      const interval = setInterval(async () => {
        if (currentIndex < actions.length) {
          await updates.simulateProgress(job._id, actions[currentIndex]);
          currentIndex++;
          fetchDeviceDetails(job.deviceImei);
        } else {
          clearInterval(interval);
        }
      }, 2000);
    } catch (error) {
      console.error('Simulation error:', error);
    }
  };

  const handleBulkUpdate = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const versionsRes = await versions.getLatest();
      const targetVersion = versionsRes.data.version?.versionCode;
      
      if (!targetVersion) {
        setError('No target version available');
        setBulkActionDialog(false);
        return;
      }
      
      const result = await devices.bulkUpdate(selectedDevices, targetVersion);
      
      setBulkActionDialog(false);
      setSelectedDevices([]);
      
      alert(`Successfully scheduled updates for ${result.data.jobCount} devices`);
      fetchDevices();
    } catch (error) {
      console.error('Error in bulk update:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to perform bulk update';
      setError(errorMsg);
      alert('Error: ' + errorMsg);
    } finally {
      setLoading(false);
      setBulkActionDialog(false);
    }
  };

  const handleExport = (format = 'csv') => {
    const dataToExport = devicesList.map(device => ({
      IMEI: device.imei,
      Version: device.appVersion,
      Model: device.deviceModel,
      OS: device.deviceOS,
      'Last Seen': format(new Date(device.lastOpenTime), 'PPpp'),
      Location: `${device.location?.city || ''}, ${device.location?.region || ''}`,
      Status: device.status,
      Battery: `${device.metadata?.batteryLevel || 'N/A'}%`,
      Network: device.metadata?.networkType || 'N/A'
    }));

    if (format === 'csv') {
      const headers = Object.keys(dataToExport[0]).join(',');
      const rows = dataToExport.map(row => Object.values(row).join(',')).join('\n');
      const csv = `${headers}\n${rows}`;
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `devices-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'blocked': return 'error';
      default: return 'default';
    }
  };

  const getVersionStatus = (device) => {
    const latestVersion = stats?.latestVersion || 0;
    if (device.appVersionCode >= latestVersion) {
      return <Chip label="Latest" color="success" size="small" icon={<CheckCircleIcon />} />;
    } else if (device.appVersionCode >= latestVersion - 2) {
      return <Chip label="Outdated" color="warning" size="small" icon={<ScheduleIcon />} />;
    } else {
      return <Chip label="Critical" color="error" size="small" icon={<ErrorIcon />} />;
    }
  };

  const getTimelineIcon = (action) => {
    if (action.includes('UPDATE')) return <UploadIcon color="primary" />;
    if (action.includes('REGISTER')) return <CheckCircleIcon color="success" />;
    if (action.includes('BLOCK')) return <BlockIcon color="error" />;
    return <InfoIcon color="info" />;
  };

  const activeFilterCount = Object.keys(advancedFilters).filter(k => 
    advancedFilters[k] && advancedFilters[k] !== 'all' && 
    (Array.isArray(advancedFilters[k]) ? advancedFilters[k].length > 0 : true)
  ).length;

  return (
    <PageTransition>
      <Box sx={{ flexGrow: 1 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
              Device Management
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Manage and monitor all registered devices
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              select
              size="small"
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(0);
              }}
              sx={{ width: 150 }}
              SelectProps={{
                MenuProps: {
                  PaperProps: {
                    sx: {
                      bgcolor: '#111111',
                      border: '1px solid #27272a',
                    }
                  }
                }
              }}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
              <MenuItem value="blocked">Blocked</MenuItem>
            </TextField>
            
            <Badge badgeContent={activeFilterCount} color="primary">
              <Button
                variant="outlined"
                startIcon={<FilterListIcon />}
                onClick={(e) => setFilterAnchorEl(e.currentTarget)}
                sx={{ borderColor: alpha(theme.palette.primary.main, 0.5) }}
              >
                Filters
              </Button>
            </Badge>
            
            <Button 
              variant="outlined" 
              startIcon={<RefreshIcon />}
              onClick={() => {
                setPage(0);
                fetchDevices();
              }}
              sx={{ borderColor: alpha(theme.palette.primary.main, 0.5) }}
            >
              Refresh
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<GetAppIcon />}
              onClick={() => handleExport('csv')}
              sx={{ borderColor: alpha(theme.palette.primary.main, 0.5) }}
            >
              Export
            </Button>

            <IconButton
              onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
              sx={{ 
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
              }}
            >
              {viewMode === 'table' ? <ViewModuleIcon /> : <ViewListIcon />}
            </IconButton>
          </Box>
        </Box>

        {/* Filter Popover */}
        <Popover
          open={Boolean(filterAnchorEl)}
          anchorEl={filterAnchorEl}
          onClose={() => setFilterAnchorEl(null)}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          PaperProps={{
            sx: { 
              width: 350, 
              borderRadius: 2,
              bgcolor: '#111111',
              border: '1px solid #27272a',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }
          }}
        >
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#ffffff' }}>
              Advanced Filters
            </Typography>
            
            <Divider sx={{ my: 2, borderColor: '#27272a' }} />
            
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, color: '#ffffff' }}>
              OS Versions
            </Typography>
            <FormGroup>
              {['Android 13', 'Android 12', 'iOS 16', 'iOS 15'].map((os) => (
                <FormControlLabel
                  key={os}
                  control={
                    <Checkbox
                      checked={advancedFilters.osVersions.includes(os)}
                      onChange={(e) => {
                        const newVersions = e.target.checked
                          ? [...advancedFilters.osVersions, os]
                          : advancedFilters.osVersions.filter(v => v !== os);
                        setAdvancedFilters({...advancedFilters, osVersions: newVersions});
                      }}
                      sx={{ color: '#ffffff' }}
                    />
                  }
                  label={os}
                  sx={{ color: '#e4e4e7' }}
                />
              ))}
            </FormGroup>

            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2, fontWeight: 600, color: '#ffffff' }}>
              Battery Level
            </Typography>
            <RadioGroup
              value={advancedFilters.batteryLevel}
              onChange={(e) => setAdvancedFilters({...advancedFilters, batteryLevel: e.target.value})}
            >
              <FormControlLabel value="all" control={<Radio />} label="All" sx={{ color: '#e4e4e7' }} />
              <FormControlLabel value="critical" control={<Radio />} label="Critical (<15%)" sx={{ color: '#e4e4e7' }} />
              <FormControlLabel value="low" control={<Radio />} label="Low (15-30%)" sx={{ color: '#e4e4e7' }} />
              <FormControlLabel value="good" control={<Radio />} label="Good (30-60%)" sx={{ color: '#e4e4e7' }} />
              <FormControlLabel value="excellent" control={<Radio />} label="Excellent (>60%)" sx={{ color: '#e4e4e7' }} />
            </RadioGroup>

            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2, fontWeight: 600, color: '#ffffff' }}>
              Last Seen
            </Typography>
            <RadioGroup
              value={advancedFilters.lastSeenDays}
              onChange={(e) => setAdvancedFilters({...advancedFilters, lastSeenDays: e.target.value})}
            >
              <FormControlLabel value="7" control={<Radio />} label="Last 7 days" sx={{ color: '#e4e4e7' }} />
              <FormControlLabel value="30" control={<Radio />} label="Last 30 days" sx={{ color: '#e4e4e7' }} />
              <FormControlLabel value="90" control={<Radio />} label="Last 90 days" sx={{ color: '#e4e4e7' }} />
              <FormControlLabel value="all" control={<Radio />} label="All time" sx={{ color: '#e4e4e7' }} />
            </RadioGroup>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button
                startIcon={<ClearAllIcon />}
                onClick={() => {
                  setAdvancedFilters({
                    osVersions: [],
                    batteryLevel: 'all',
                    networkType: 'all',
                    lastSeenDays: '30',
                    clientCustomizations: [],
                  });
                }}
                sx={{ color: '#ffffff' }}
              >
                Clear
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  setFilterAnchorEl(null);
                  setPage(0);
                  fetchDevices();
                }}
                sx={{
                  bgcolor: '#60a5fa',
                  '&:hover': { bgcolor: '#3b82f6' }
                }}
              >
                Apply Filters
              </Button>
            </Box>
          </Box>
        </Popover>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Stats Cards */}
        {stats && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard
                title="Total Active"
                value={stats.totalActive || 0}
                icon={<PhoneAndroidIcon />}
                color="#6366f1"
                subtitle={`${stats.inactiveDevices || 0} inactive`}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard
                title="Inactive (30+ days)"
                value={stats.inactiveDevices || 0}
                icon={<ScheduleIcon />}
                color="#f59e0b"
                subtitle={`${stats.totalActive ? Math.round((stats.inactiveDevices / stats.totalActive) * 100) : 0}% of total`}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard
                title="Blocked Devices"
                value={stats.totalBlocked || 0}
                icon={<BlockIcon />}
                color="#ef4444"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard
                title="Latest Version"
                value={`v${stats.latestVersion || '1.0'}`}
                icon={<UpdateIcon />}
                color="#10b981"
              />
            </Grid>
          </Grid>
        )}

        {/* Search Bar */}
        <Paper sx={{ p: 2, mb: 3, bgcolor: '#111111', border: '1px solid #27272a' }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search by IMEI, device model, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
              sx: {
                color: '#ffffff',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: alpha(theme.palette.primary.main, 0.2),
                },
              }
            }}
          />
        </Paper>

        {/* Device List */}
        {loading ? (
          <Grid container spacing={2}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Grid item xs={12} key={i}>
                <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 2, bgcolor: '#1a1a1a' }} />
              </Grid>
            ))}
          </Grid>
        ) : devicesList.length === 0 ? (
          <EmptyState
            icon={<PhoneAndroidIcon sx={{ fontSize: 48 }} />}
            title="No devices found"
            description="No devices match your search criteria. Try adjusting your filters."
            actionText="Clear Filters"
            onAction={() => {
              setSearchTerm('');
              setFilterStatus('all');
              setAdvancedFilters({
                osVersions: [],
                batteryLevel: 'all',
                networkType: 'all',
                lastSeenDays: '30',
                clientCustomizations: [],
              });
            }}
          />
        ) : viewMode === 'table' ? (
          <Paper sx={{ width: '100%', overflow: 'hidden', bgcolor: '#111111', border: '1px solid #27272a' }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        indeterminate={selectedDevices.length > 0 && selectedDevices.length < devicesList.length}
                        checked={devicesList.length > 0 && selectedDevices.length === devicesList.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDevices(devicesList.map(d => d.imei));
                          } else {
                            setSelectedDevices([]);
                          }
                        }}
                        sx={{ color: '#ffffff' }}
                      />
                    </TableCell>
                    <TableCell padding="checkbox" />
                    <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>IMEI</TableCell>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>Version</TableCell>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>Device</TableCell>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>Last Seen</TableCell>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>Location</TableCell>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>Health</TableCell>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <AnimatePresence>
                    {devicesList.map((device, index) => (
                      <React.Fragment key={device.imei}>
                        <motion.tr
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ delay: index * 0.05 }}
                          style={{ display: 'table-row' }}
                        >
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={selectedDevices.includes(device.imei)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedDevices([...selectedDevices, device.imei]);
                                } else {
                                  setSelectedDevices(selectedDevices.filter(imei => imei !== device.imei));
                                }
                              }}
                              sx={{ color: '#ffffff' }}
                            />
                          </TableCell>
                          <TableCell padding="checkbox">
                            <IconButton
                              size="small"
                              onClick={() => handleExpandDevice(device.imei)}
                              sx={{ color: '#ffffff' }}
                            >
                              {expandedDevice === device.imei ? (
                                <ExpandLessIcon />
                              ) : (
                                <ExpandMoreIcon />
                              )}
                            </IconButton>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontFamily="monospace" fontWeight={500} sx={{ color: '#ffffff' }}>
                              {device.imei}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" sx={{ color: '#ffffff' }}>v{device.appVersion}</Typography>
                              {getVersionStatus(device)}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500} sx={{ color: '#ffffff' }}>
                              {device.deviceModel}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                              {device.deviceOS}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Tooltip title={format(new Date(device.lastOpenTime), 'PPpp')}>
                              <Typography variant="body2" sx={{ color: '#ffffff' }}>
                                {formatDistance(new Date(device.lastOpenTime), new Date(), { addSuffix: true })}
                              </Typography>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <LocationIcon fontSize="small" sx={{ color: 'rgba(255,255,255,0.5)', mr: 0.5 }} />
                              <Typography variant="body2" sx={{ color: '#ffffff' }}>
                                {device.location?.city || 'Unknown'}, {device.location?.region || 'Unknown'}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={device.status}
                              color={getStatusColor(device.status)}
                              size="small"
                              sx={{ fontWeight: 500 }}
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <Tooltip title={`Battery: ${device.metadata?.batteryLevel || 'N/A'}%`}>
                                <BatteryIcon 
                                  fontSize="small" 
                                  sx={{ 
                                    color: device.metadata?.batteryLevel > 20 ? '#4ade80' : '#ef4444'
                                  }}
                                />
                              </Tooltip>
                              <Tooltip title={`Network: ${device.metadata?.networkType || 'N/A'}`}>
                                <NetworkIcon fontSize="small" sx={{ color: 'rgba(255,255,255,0.5)' }} />
                              </Tooltip>
                            </Box>
                          </TableCell>
                          <TableCell>
                            {device.status !== 'blocked' && (
                              <Tooltip title="Block Device">
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setSelectedDevice(device);
                                    setBlockDialogOpen(true);
                                  }}
                                  sx={{ color: '#ef4444' }}
                                >
                                  <BlockIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                          </TableCell>
                        </motion.tr>
                        {expandedDevice === device.imei && (
                          <TableRow>
                            <TableCell colSpan={10} sx={{ py: 0, borderBottom: 'none' }}>
                              <Collapse in={expandedDevice === device.imei}>
                                <Box sx={{ p: 3, bgcolor: '#0a0a0a' }}>
                                  <Grid container spacing={3}>
                                    {/* Device Info */}
                                    <Grid item xs={12} md={4}>
                                      <Typography variant="subtitle2" gutterBottom sx={{ color: '#60a5fa' }}>
                                        Device Information
                                      </Typography>
                                      <Card sx={{ bgcolor: '#111111', border: '1px solid #27272a' }}>
                                        <CardContent>
                                          <Grid container spacing={2}>
                                            <Grid item xs={6}>
                                              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                                                IMEI
                                              </Typography>
                                              <Typography variant="body2" fontFamily="monospace" sx={{ color: '#ffffff' }}>
                                                {device.imei}
                                              </Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                                                Model
                                              </Typography>
                                              <Typography variant="body2" sx={{ color: '#ffffff' }}>
                                                {device.deviceModel}
                                              </Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                                                OS Version
                                              </Typography>
                                              <Typography variant="body2" sx={{ color: '#ffffff' }}>
                                                {device.deviceOS}
                                              </Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                                                Client
                                              </Typography>
                                              <Typography variant="body2" sx={{ color: '#ffffff' }}>
                                                {device.clientCustomization}
                                              </Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                                                First Seen
                                              </Typography>
                                              <Typography variant="body2" sx={{ color: '#ffffff' }}>
                                                {format(new Date(device.createdAt), 'PP')}
                                              </Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                                                Last Update
                                              </Typography>
                                              <Typography variant="body2" sx={{ color: '#ffffff' }}>
                                                {format(new Date(device.updatedAt), 'PP')}
                                              </Typography>
                                            </Grid>
                                          </Grid>
                                        </CardContent>
                                      </Card>
                                    </Grid>

                                    {/* Update History */}
                                    <Grid item xs={12} md={4}>
                                      <Typography variant="subtitle2" gutterBottom sx={{ color: '#60a5fa' }}>
                                        Update History
                                      </Typography>
                                      <Card sx={{ bgcolor: '#111111', border: '1px solid #27272a', maxHeight: 300, overflow: 'auto' }}>
                                        <CardContent>
                                          {deviceJobs[device.imei]?.length > 0 ? (
                                            deviceJobs[device.imei].slice(0, 5).map((job, idx) => (
                                              <Box key={job._id} sx={{ mb: 2 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                                                    v{job.fromVersionCode} → v{job.toVersionCode}
                                                  </Typography>
                                                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                                    <Chip
                                                      label={job.currentState.replace(/_/g, ' ')}
                                                      size="small"
                                                      sx={{
                                                        bgcolor: job.currentState === 'installation_completed' ? 'rgba(34, 197, 94, 0.1)' :
                                                                job.currentState === 'failed' ? 'rgba(239, 68, 68, 0.1)' :
                                                                'rgba(245, 158, 11, 0.1)',
                                                        color: job.currentState === 'installation_completed' ? '#22c55e' :
                                                               job.currentState === 'failed' ? '#ef4444' :
                                                               '#f59e0b',
                                                        border: `1px solid ${
                                                          job.currentState === 'installation_completed' ? 'rgba(34, 197, 94, 0.2)' :
                                                          job.currentState === 'failed' ? 'rgba(239, 68, 68, 0.2)' :
                                                          'rgba(245, 158, 11, 0.2)'
                                                        }`,
                                                        height: 20,
                                                        fontSize: '0.7rem',
                                                      }}
                                                    />
                                                    {job.currentState !== 'installation_completed' && job.currentState !== 'failed' && (
                                                      <Button 
                                                        size="small" 
                                                        variant="outlined" 
                                                        onClick={() => simulateProgress(job)}
                                                        sx={{ 
                                                          height: 20, 
                                                          fontSize: '0.7rem',
                                                          minWidth: 'auto',
                                                          py: 0,
                                                          px: 1,
                                                          borderColor: '#60a5fa',
                                                          color: '#60a5fa',
                                                          '&:hover': {
                                                            borderColor: '#3b82f6',
                                                            bgcolor: 'rgba(96, 165, 250, 0.1)',
                                                          }
                                                        }}
                                                      >
                                                        Simulate
                                                      </Button>
                                                    )}
                                                  </Box>
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                  <Box sx={{ flex: 1 }}>
                                                    <LinearProgress 
                                                      variant="determinate" 
                                                      value={job.progress?.downloadProgress || 0}
                                                      sx={{ 
                                                        height: 4, 
                                                        borderRadius: 2,
                                                        bgcolor: 'rgba(255,255,255,0.1)',
                                                        '& .MuiLinearProgress-bar': {
                                                          bgcolor: job.currentState === 'failed' ? '#ef4444' : '#60a5fa'
                                                        }
                                                      }}
                                                    />
                                                  </Box>
                                                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                                                    {job.progress?.downloadProgress || 0}%
                                                  </Typography>
                                                </Box>
                                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', display: 'block', mt: 0.5 }}>
                                                  {new Date(job.createdAt).toLocaleString()}
                                                </Typography>
                                                {idx < deviceJobs[device.imei].length - 1 && <Divider sx={{ my: 1, borderColor: '#27272a' }} />}
                                              </Box>
                                            ))
                                          ) : (
                                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', py: 2 }}>
                                              No update history found
                                            </Typography>
                                          )}
                                        </CardContent>
                                      </Card>
                                    </Grid>

                                    {/* Timeline */}
                                    <Grid item xs={12} md={4}>
                                      <Typography variant="subtitle2" gutterBottom sx={{ color: '#60a5fa' }}>
                                        Activity Timeline
                                      </Typography>
                                      <Card sx={{ bgcolor: '#111111', border: '1px solid #27272a', maxHeight: 300, overflow: 'auto' }}>
                                        <CardContent>
                                          <Timeline position="right" sx={{ m: 0, p: 0 }}>
                                            {deviceTimeline[device.imei]?.slice(0, 10).map((event, idx, arr) => (
                                              <TimelineItem key={idx}>
                                                <TimelineOppositeContent sx={{ flex: 0.2 }}>
                                                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)' }}>
                                                    {format(new Date(event.timestamp), 'HH:mm')}
                                                  </Typography>
                                                </TimelineOppositeContent>
                                                <TimelineSeparator>
                                                  <TimelineDot sx={{
                                                    bgcolor: event.action?.includes('UPDATE') ? 'rgba(96, 165, 250, 0.2)' :
                                                             event.action?.includes('REGISTER') ? 'rgba(34, 197, 94, 0.2)' :
                                                             event.action?.includes('BLOCK') ? 'rgba(239, 68, 68, 0.2)' :
                                                             'rgba(255,255,255,0.1)',
                                                  }}>
                                                    {getTimelineIcon(event.action)}
                                                  </TimelineDot>
                                                  {idx < arr.length - 1 && <TimelineConnector sx={{ bgcolor: '#27272a' }} />}
                                                </TimelineSeparator>
                                                <TimelineContent>
                                                  <Typography variant="body2" sx={{ color: '#ffffff' }}>
                                                    {event.action?.replace(/_/g, ' ')}
                                                  </Typography>
                                                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                                                    by {event.userName || 'System'}
                                                  </Typography>
                                                </TimelineContent>
                                              </TimelineItem>
                                            ))}
                                          </Timeline>
                                        </CardContent>
                                      </Card>
                                    </Grid>
                                  </Grid>
                                </Box>
                              </Collapse>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              rowsPerPageOptions={[10, 20, 50, 100]}
              component="div"
              count={stats?.totalActive || 0}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              sx={{ color: '#ffffff', borderTop: '1px solid #27272a' }}
            />
          </Paper>
        ) : (
          // Grid View
          <Grid container spacing={3}>
            {devicesList.map((device, index) => (
              <Grid item xs={12} sm={6} md={4} key={device.imei}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card sx={{ height: '100%', bgcolor: '#111111', border: '1px solid #27272a' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Chip
                          label={device.status}
                          color={getStatusColor(device.status)}
                          size="small"
                        />
                        <IconButton size="small" sx={{ color: '#ffffff' }}>
                          <MoreVertIcon />
                        </IconButton>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: '#60a5fa' }}>
                          <PhoneAndroidIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontFamily="monospace" sx={{ color: '#ffffff' }}>
                            {device.imei}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                            {device.deviceModel}
                          </Typography>
                        </Box>
                      </Box>

                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                            Version
                          </Typography>
                          <Typography variant="body2" fontWeight={500} sx={{ color: '#ffffff' }}>
                            v{device.appVersion}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                            OS
                          </Typography>
                          <Typography variant="body2" fontWeight={500} sx={{ color: '#ffffff' }}>
                            {device.deviceOS}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                            Last Seen
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#ffffff' }}>
                            {formatDistance(new Date(device.lastOpenTime), new Date(), { addSuffix: true })}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                            Location
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#ffffff' }}>
                            {device.location?.city || 'Unknown'}
                          </Typography>
                        </Grid>
                      </Grid>

                      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                        {getVersionStatus(device)}
                        <Tooltip title={`Battery: ${device.metadata?.batteryLevel || 'N/A'}%`}>
                          <Chip
                            size="small"
                            icon={<BatteryIcon />}
                            label={`${device.metadata?.batteryLevel || 'N/A'}%`}
                            variant="outlined"
                            sx={{ borderColor: '#27272a', color: '#ffffff' }}
                          />
                        </Tooltip>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Bulk Action Bar */}
        <AnimatePresence>
          {selectedDevices.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              style={{
                position: 'fixed',
                bottom: 20,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 1000,
              }}
            >
              <Paper
                elevation={3}
                sx={{
                  py: 1.5,
                  px: 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  bgcolor: '#1e293b',
                  border: '1px solid #334155',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 3,
                  boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)',
                }}
              >
                <Typography sx={{ color: '#ffffff', fontWeight: 500 }}>
                  <span style={{ color: '#60a5fa', fontWeight: 600 }}>{selectedDevices.length}</span> device(s) selected
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => setBulkActionDialog(true)}
                    sx={{
                      bgcolor: '#60a5fa',
                      '&:hover': { bgcolor: '#3b82f6' },
                      textTransform: 'none',
                    }}
                  >
                    Update Selected
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setSelectedDevices([])}
                    sx={{
                      borderColor: '#334155',
                      color: '#ffffff',
                      '&:hover': { 
                        borderColor: '#ef4444',
                        bgcolor: 'rgba(239, 68, 68, 0.1)',
                      },
                      textTransform: 'none',
                    }}
                  >
                    Clear
                  </Button>
                </Box>
              </Paper>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Block Device Dialog */}
        <Dialog 
          open={blockDialogOpen} 
          onClose={() => setBlockDialogOpen(false)} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{
            sx: {
              bgcolor: '#111111',
              border: '1px solid #27272a',
            }
          }}
        >
          <DialogTitle sx={{ pb: 2, color: '#ffffff' }}>Block Device</DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mb: 2 }}>
              This action will prevent the device from receiving updates and accessing the system.
            </Alert>
            <Typography variant="body2" gutterBottom sx={{ color: '#ffffff' }}>
              Are you sure you want to block device:
            </Typography>
            <Typography variant="body1" fontWeight="bold" gutterBottom sx={{ fontFamily: 'monospace', color: '#ef4444' }}>
              {selectedDevice?.imei}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
              Model: {selectedDevice?.deviceModel}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
              Last seen: {selectedDevice?.lastOpenTime ? format(new Date(selectedDevice.lastOpenTime), 'PPp') : 'Never'}
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 3, borderTop: '1px solid #27272a' }}>
            <Button onClick={() => setBlockDialogOpen(false)} sx={{ color: '#ffffff' }}>
              Cancel
            </Button>
            <Button onClick={handleBlockDevice} color="error" variant="contained">
              Block Device
            </Button>
          </DialogActions>
        </Dialog>

        {/* Bulk Action Dialog */}
        <Dialog 
          open={bulkActionDialog} 
          onClose={() => setBulkActionDialog(false)} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{
            sx: {
              bgcolor: '#111111',
              border: '1px solid #27272a',
            }
          }}
        >
          <DialogTitle sx={{ color: '#ffffff' }}>Bulk Update</DialogTitle>
          <DialogContent>
            <Typography variant="body2" gutterBottom sx={{ color: '#ffffff' }}>
              You are about to update {selectedDevices.length} device(s).
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mt: 2 }}>
              This will schedule an update for all selected devices to the latest version.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 3, borderTop: '1px solid #27272a' }}>
            <Button onClick={() => setBulkActionDialog(false)} sx={{ color: '#ffffff' }}>
              Cancel
            </Button>
            <Button onClick={handleBulkUpdate} variant="contained" sx={{ bgcolor: '#60a5fa' }}>
              Confirm Update
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </PageTransition>
  );
}

export default DeviceManagement;