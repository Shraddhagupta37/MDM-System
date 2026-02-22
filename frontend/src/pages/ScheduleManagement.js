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
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  LinearProgress,
  Grid,
  Card,
  CardContent,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Tooltip,
  alpha,
  useTheme,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  PlayArrow as PlayIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { schedules, versions } from '../services/api';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '../components/PageTransition';
import StatsCard from '../components/StatsCard';
import EmptyState from '../components/EmptyState';

function ScheduleManagement() {
  const theme = useTheme();
  const [scheduleList, setScheduleList] = useState([]);
  const [versionList, setVersionList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    fromVersionCode: '',
    toVersionCode: '',
    targetCriteria: {
      regions: [],
      cities: [],
      percentage: 100,
    },
    scheduleType: 'immediate',
    scheduledTime: '',
    phasedConfig: {
      batchSize: 100,
      batchInterval: 60,
    },
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [schedulesRes, versionsRes] = await Promise.all([
        schedules.getAll(),
        versions.getAll()
      ]);
      setScheduleList(schedulesRes.data.schedules || []);
      setVersionList(versionsRes.data.versions || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load schedules');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSchedule = async () => {
    try {
      setLoading(true);
      await schedules.delete(scheduleToDelete._id);
      setDeleteDialogOpen(false);
      await fetchData();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      setError(error.response?.data?.error || 'Failed to delete schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchedule = async () => {
    try {
      // Validate form data
      if (!formData.name) {
        setError('Schedule name is required');
        return;
      }
      if (!formData.fromVersionCode) {
        setError('From version is required');
        return;
      }
      if (!formData.toVersionCode) {
        setError('To version is required');
        return;
      }

      // Check for downgrade
      if (formData.toVersionCode < formData.fromVersionCode) {
        setError('Cannot schedule a downgrade');
        return;
      }

      setLoading(true);
      const response = await schedules.create(formData);
      console.log('Schedule created:', response.data);
      setDialogOpen(false);
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        fromVersionCode: '',
        toVersionCode: '',
        targetCriteria: {
          regions: [],
          cities: [],
          percentage: 100,
        },
        scheduleType: 'immediate',
        scheduledTime: '',
        phasedConfig: {
          batchSize: 100,
          batchInterval: 60,
        },
      });
      
      await fetchData();
      setError(null);
    } catch (error) {
      console.error('Error creating schedule:', error);
      setError(error.response?.data?.error || 'Failed to create schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveSchedule = async (id) => {
    try {
      setLoading(true);
      await schedules.approve(id);
      await fetchData();
    } catch (error) {
      console.error('Error approving schedule:', error);
      setError(error.response?.data?.error || 'Failed to approve schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSchedule = async (id) => {
    try {
      setLoading(true);
      await schedules.cancel(id);
      await fetchData();
    } catch (error) {
      console.error('Error cancelling schedule:', error);
      setError(error.response?.data?.error || 'Failed to cancel schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (schedule) => {
    setSelectedSchedule(schedule);
    setDetailsDialogOpen(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'info';
      case 'approved': return 'primary';
      case 'pending_approval': return 'warning';
      case 'cancelled': return 'error';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getStatusChipStyle = (status) => {
    switch (status) {
      case 'completed':
        return {
          bgcolor: alpha(theme.palette.success.main, 0.1),
          color: theme.palette.success.main,
          border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
        };
      case 'in_progress':
        return {
          bgcolor: alpha(theme.palette.info.main, 0.1),
          color: theme.palette.info.main,
          border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
        };
      case 'approved':
        return {
          bgcolor: alpha(theme.palette.primary.main, 0.1),
          color: theme.palette.primary.main,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        };
      case 'pending_approval':
        return {
          bgcolor: alpha(theme.palette.warning.main, 0.1),
          color: theme.palette.warning.main,
          border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
        };
      case 'cancelled':
      case 'failed':
        return {
          bgcolor: alpha(theme.palette.error.main, 0.1),
          color: theme.palette.error.main,
          border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
        };
      default:
        return {
          bgcolor: alpha(theme.palette.grey[500], 0.1),
          color: theme.palette.grey[500],
          border: `1px solid ${alpha(theme.palette.grey[500], 0.2)}`,
        };
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircleIcon fontSize="small" />;
      case 'in_progress': return <PlayIcon fontSize="small" />;
      case 'pending_approval': return <WarningIcon fontSize="small" />;
      case 'cancelled': return <CancelIcon fontSize="small" />;
      default: return <InfoIcon fontSize="small" />;
    }
  };

  const stats = {
    total: scheduleList.length,
    inProgress: scheduleList.filter(s => s.status === 'in_progress').length,
    pending: scheduleList.filter(s => s.status === 'pending_approval').length,
    completed: scheduleList.filter(s => s.status === 'completed').length,
    cancelled: scheduleList.filter(s => s.status === 'cancelled').length,
  };

  return (
    <PageTransition>
      <Box sx={{ flexGrow: 1 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: '#ffffff' }}>
              Update Schedules
            </Typography>
            <Typography variant="body2" sx={{ color: '#a1a1aa' }}>
              Manage and monitor update rollouts
            </Typography>
          </Box>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
            sx={{
              bgcolor: '#3b82f6',
              '&:hover': { bgcolor: '#2563eb' },
            }}
          >
            New Schedule
          </Button>
        </Box>

        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 2 }} 
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={2.4}>
            <StatsCard
              title="Total Schedules"
              value={stats.total}
              icon={<ScheduleIcon />}
              color="#3b82f6"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <StatsCard
              title="In Progress"
              value={stats.inProgress}
              icon={<PlayIcon />}
              color="#22c55e"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <StatsCard
              title="Pending Approval"
              value={stats.pending}
              icon={<WarningIcon />}
              color="#f59e0b"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <StatsCard
              title="Completed"
              value={stats.completed}
              icon={<CheckCircleIcon />}
              color="#8b5cf6"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <StatsCard
              title="Cancelled"
              value={stats.cancelled}
              icon={<CancelIcon />}
              color="#ef4444"
            />
          </Grid>
        </Grid>

        {/* Schedules Table */}
        <Paper sx={{ width: '100%', overflow: 'hidden', bgcolor: '#111111', border: '1px solid #27272a' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>Name</TableCell>
                  <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>Version Change</TableCell>
                  <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>Type</TableCell>
                  <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>Target</TableCell>
                  <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>Progress</TableCell>
                  <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>Created</TableCell>
                  <TableCell align="right" sx={{ color: '#ffffff', fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <LinearProgress sx={{ bgcolor: '#1a1a1a' }} />
                    </TableCell>
                  </TableRow>
                ) : scheduleList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <EmptyState
                        icon={<ScheduleIcon sx={{ fontSize: 48 }} />}
                        title="No schedules found"
                        description="Create your first update schedule to start rolling out updates."
                        actionText="Create Schedule"
                        onAction={() => setDialogOpen(true)}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  <AnimatePresence>
                    {scheduleList.map((schedule, index) => (
                      <motion.tr
                        key={schedule._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: index * 0.05 }}
                        style={{ display: 'table-row', cursor: 'pointer' }}
                        onClick={() => handleViewDetails(schedule)}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight={500} sx={{ color: '#ffffff' }}>
                            {schedule.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#71717a' }}>
                            {schedule.description?.substring(0, 50)}
                            {schedule.description?.length > 50 ? '...' : ''}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={`v${schedule.fromVersionCode} → v${schedule.toVersionCode}`}
                            size="small"
                            sx={{
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              color: theme.palette.primary.main,
                              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                              fontWeight: 500,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={schedule.scheduleType}
                            size="small"
                            sx={{
                              bgcolor: schedule.scheduleType === 'phased' 
                                ? alpha(theme.palette.secondary.main, 0.1)
                                : alpha(theme.palette.info.main, 0.1),
                              color: schedule.scheduleType === 'phased' 
                                ? theme.palette.secondary.main
                                : theme.palette.info.main,
                              border: `1px solid ${schedule.scheduleType === 'phased' 
                                ? alpha(theme.palette.secondary.main, 0.2)
                                : alpha(theme.palette.info.main, 0.2)}`,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <LocationIcon sx={{ fontSize: 14, color: '#71717a' }} />
                            <Typography variant="body2" sx={{ color: '#e4e4e7' }}>
                              {schedule.targetCriteria?.regions?.length || 'All'} regions
                            </Typography>
                          </Box>
                          {schedule.targetCriteria?.percentage < 100 && (
                            <Typography variant="caption" sx={{ color: '#71717a', display: 'block' }}>
                              {schedule.targetCriteria.percentage}% rollout
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={schedule.status.replace(/_/g, ' ')}
                            icon={getStatusIcon(schedule.status)}
                            size="small"
                            sx={getStatusChipStyle(schedule.status)}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 80 }}>
                              <LinearProgress
                                variant="determinate"
                                value={schedule.stats?.totalDevices ? 
                                  ((schedule.stats.completedDevices + schedule.stats.failedDevices) / schedule.stats.totalDevices) * 100 : 0
                                }
                                sx={{ 
                                  height: 4, 
                                  borderRadius: 2,
                                  bgcolor: '#27272a',
                                  '& .MuiLinearProgress-bar': {
                                    bgcolor: schedule.status === 'completed' ? '#22c55e' :
                                            schedule.status === 'failed' ? '#ef4444' :
                                            '#60a5fa'
                                  }
                                }}
                              />
                            </Box>
                            <Typography variant="caption" sx={{ color: '#a1a1aa' }}>
                              {schedule.stats?.completedDevices || 0}/{schedule.stats?.totalDevices || 0}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: '#e4e4e7' }}>
                            {format(new Date(schedule.createdAt), 'MMM dd, yyyy')}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#71717a' }}>
                            by {schedule.createdBy?.userName || 'System'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                            <Tooltip title="View Details">
                              <IconButton 
                                size="small" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewDetails(schedule);
                                }}
                                sx={{ color: '#60a5fa' }}
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            
                            {schedule.status === 'pending_approval' && (
                              <>
                                <Tooltip title="Approve">
                                  <IconButton 
                                    size="small" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleApproveSchedule(schedule._id);
                                    }}
                                    sx={{ color: '#22c55e' }}
                                  >
                                    <CheckCircleIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Reject">
                                  <IconButton 
                                    size="small" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCancelSchedule(schedule._id);
                                    }}
                                    sx={{ color: '#ef4444' }}
                                  >
                                    <CancelIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                            
                            {schedule.status === 'in_progress' && (
                              <Tooltip title="Cancel Schedule">
                                <IconButton 
                                  size="small" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCancelSchedule(schedule._id);
                                  }}
                                  sx={{ color: '#ef4444' }}
                                >
                                  <CancelIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            
                            {(schedule.status === 'draft' || schedule.status === 'cancelled' || schedule.status === 'completed') && (
                              <Tooltip title="Delete Schedule">
                                <IconButton 
                                  size="small" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setScheduleToDelete(schedule);
                                    setDeleteDialogOpen(true);
                                  }}
                                  sx={{ color: '#ef4444' }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Create Schedule Dialog */}
        <Dialog 
          open={dialogOpen} 
          onClose={() => {
            setDialogOpen(false);
            setError(null);
            setFormData({
              name: '',
              description: '',
              fromVersionCode: '',
              toVersionCode: '',
              targetCriteria: {
                regions: [],
                cities: [],
                percentage: 100,
              },
              scheduleType: 'immediate',
              scheduledTime: '',
              phasedConfig: {
                batchSize: 100,
                batchInterval: 60,
              },
            });
          }} 
          maxWidth="md" 
          fullWidth
          PaperProps={{
            sx: {
              bgcolor: '#111111',
              border: '1px solid #27272a',
            }
          }}
        >
          <DialogTitle sx={{ color: '#ffffff', borderBottom: '1px solid #27272a' }}>
            Create Update Schedule
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Schedule Name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  variant="outlined"
                  required
                  error={!formData.name && error?.includes('name')}
                  InputLabelProps={{ sx: { color: '#a1a1aa' } }}
                  InputProps={{ sx: { color: '#ffffff' } }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  variant="outlined"
                  InputLabelProps={{ sx: { color: '#a1a1aa' } }}
                  InputProps={{ sx: { color: '#ffffff' } }}
                />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth variant="outlined" required>
                  <InputLabel sx={{ color: '#a1a1aa' }}>From Version</InputLabel>
                  <Select
                    value={formData.fromVersionCode}
                    onChange={(e) => setFormData({...formData, fromVersionCode: e.target.value})}
                    label="From Version"
                    sx={{ color: '#ffffff' }}
                  >
                    {versionList.map(v => (
                      <MenuItem key={v.versionCode} value={v.versionCode}>
                        v{v.versionName} (Code: {v.versionCode})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth variant="outlined" required>
                  <InputLabel sx={{ color: '#a1a1aa' }}>To Version</InputLabel>
                  <Select
                    value={formData.toVersionCode}
                    onChange={(e) => setFormData({...formData, toVersionCode: e.target.value})}
                    label="To Version"
                    sx={{ color: '#ffffff' }}
                  >
                    {versionList.map(v => (
                      <MenuItem key={v.versionCode} value={v.versionCode}>
                        v{v.versionName} (Code: {v.versionCode})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel sx={{ color: '#a1a1aa' }}>Schedule Type</InputLabel>
                  <Select
                    value={formData.scheduleType}
                    onChange={(e) => setFormData({...formData, scheduleType: e.target.value})}
                    label="Schedule Type"
                    sx={{ color: '#ffffff' }}
                  >
                    <MenuItem value="immediate">Immediate</MenuItem>
                    <MenuItem value="scheduled">Scheduled</MenuItem>
                    <MenuItem value="phased">Phased Rollout</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              {formData.scheduleType === 'scheduled' && (
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Schedule Time"
                    type="datetime-local"
                    value={formData.scheduledTime}
                    onChange={(e) => setFormData({...formData, scheduledTime: e.target.value})}
                    InputLabelProps={{ shrink: true, sx: { color: '#a1a1aa' } }}
                    InputProps={{ sx: { color: '#ffffff' } }}
                  />
                </Grid>
              )}
              {formData.scheduleType === 'phased' && (
                <>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Batch Size"
                      type="number"
                      value={formData.phasedConfig.batchSize}
                      onChange={(e) => setFormData({
                        ...formData, 
                        phasedConfig: {...formData.phasedConfig, batchSize: parseInt(e.target.value)}
                      })}
                      InputLabelProps={{ sx: { color: '#a1a1aa' } }}
                      InputProps={{ sx: { color: '#ffffff' } }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Batch Interval (minutes)"
                      type="number"
                      value={formData.phasedConfig.batchInterval}
                      onChange={(e) => setFormData({
                        ...formData, 
                        phasedConfig: {...formData.phasedConfig, batchInterval: parseInt(e.target.value)}
                      })}
                      InputLabelProps={{ sx: { color: '#a1a1aa' } }}
                      InputProps={{ sx: { color: '#ffffff' } }}
                    />
                  </Grid>
                </>
              )}

              <Grid item xs={12}>
                <Divider sx={{ my: 1, borderColor: '#27272a' }} />
                <Typography variant="subtitle2" gutterBottom sx={{ color: '#ffffff', mt: 2 }}>
                  Target Criteria
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Target Regions (comma separated)"
                  placeholder="North America, Europe, Asia"
                  value={formData.targetCriteria.regions.join(', ')}
                  onChange={(e) => setFormData({
                    ...formData,
                    targetCriteria: {
                      ...formData.targetCriteria,
                      regions: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    }
                  })}
                  InputLabelProps={{ sx: { color: '#a1a1aa' } }}
                  InputProps={{ sx: { color: '#ffffff' } }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Target Cities (comma separated)"
                  placeholder="New York, London, Tokyo"
                  value={formData.targetCriteria.cities.join(', ')}
                  onChange={(e) => setFormData({
                    ...formData,
                    targetCriteria: {
                      ...formData.targetCriteria,
                      cities: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    }
                  })}
                  InputLabelProps={{ sx: { color: '#a1a1aa' } }}
                  InputProps={{ sx: { color: '#ffffff' } }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Rollout Percentage"
                  type="number"
                  value={formData.targetCriteria.percentage}
                  onChange={(e) => setFormData({
                    ...formData,
                    targetCriteria: {
                      ...formData.targetCriteria,
                      percentage: parseInt(e.target.value)
                    }
                  })}
                  inputProps={{ min: 1, max: 100 }}
                  InputLabelProps={{ sx: { color: '#a1a1aa' } }}
                  InputProps={{ sx: { color: '#ffffff' } }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3, borderTop: '1px solid #27272a' }}>
            <Button onClick={() => setDialogOpen(false)} sx={{ color: '#a1a1aa' }}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateSchedule} 
              variant="contained"
              disabled={loading}
              sx={{ bgcolor: '#3b82f6' }}
            >
              {loading ? 'Creating...' : 'Create Schedule'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog 
          open={deleteDialogOpen} 
          onClose={() => setDeleteDialogOpen(false)}
          PaperProps={{
            sx: {
              bgcolor: '#111111',
              border: '1px solid #27272a',
            }
          }}
        >
          <DialogTitle sx={{ color: '#ffffff' }}>Delete Schedule</DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mb: 2 }}>
              This action cannot be undone.
            </Alert>
            <Typography sx={{ color: '#e4e4e7' }}>
              Are you sure you want to delete schedule "{scheduleToDelete?.name}"?
            </Typography>
            {scheduleToDelete?.stats?.totalDevices > 0 && (
              <Typography sx={{ color: '#ef4444', mt: 2, fontSize: '0.875rem' }}>
                Warning: This schedule has {scheduleToDelete.stats.totalDevices} associated update jobs that will also be deleted.
              </Typography>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setDeleteDialogOpen(false)} sx={{ color: '#a1a1aa' }}>
              Cancel
            </Button>
            <Button 
              onClick={handleDeleteSchedule} 
              color="error" 
              variant="contained"
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Schedule Details Dialog */}
        <Dialog
          open={detailsDialogOpen}
          onClose={() => setDetailsDialogOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              bgcolor: '#111111',
              border: '1px solid #27272a',
            }
          }}
        >
          {selectedSchedule && (
            <>
              <DialogTitle sx={{ color: '#ffffff', borderBottom: '1px solid #27272a' }}>
                Schedule Details
              </DialogTitle>
              <DialogContent>
                <Grid container spacing={3} sx={{ mt: 1 }}>
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ color: '#ffffff', mb: 2 }}>
                      {selectedSchedule.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#a1a1aa', mb: 3 }}>
                      {selectedSchedule.description || 'No description provided'}
                    </Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Card sx={{ bgcolor: '#0a0a0a', border: '1px solid #27272a' }}>
                      <CardContent>
                        <Typography variant="caption" sx={{ color: '#71717a', display: 'block', mb: 1 }}>
                          Version Change
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#ffffff', fontWeight: 500 }}>
                          v{selectedSchedule.fromVersionCode} → v{selectedSchedule.toVersionCode}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={6}>
                    <Card sx={{ bgcolor: '#0a0a0a', border: '1px solid #27272a' }}>
                      <CardContent>
                        <Typography variant="caption" sx={{ color: '#71717a', display: 'block', mb: 1 }}>
                          Status
                        </Typography>
                        <Chip
                          label={selectedSchedule.status.replace(/_/g, ' ')}
                          icon={getStatusIcon(selectedSchedule.status)}
                          size="small"
                          sx={getStatusChipStyle(selectedSchedule.status)}
                        />
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={6}>
                    <Card sx={{ bgcolor: '#0a0a0a', border: '1px solid #27272a' }}>
                      <CardContent>
                        <Typography variant="caption" sx={{ color: '#71717a', display: 'block', mb: 1 }}>
                          Schedule Type
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#ffffff', fontWeight: 500, textTransform: 'capitalize' }}>
                          {selectedSchedule.scheduleType}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={6}>
                    <Card sx={{ bgcolor: '#0a0a0a', border: '1px solid #27272a' }}>
                      <CardContent>
                        <Typography variant="caption" sx={{ color: '#71717a', display: 'block', mb: 1 }}>
                          Created By
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#ffffff', fontWeight: 500 }}>
                          {selectedSchedule.createdBy?.userName || 'System'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#71717a' }}>
                          {format(new Date(selectedSchedule.createdAt), 'PPp')}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ color: '#ffffff', mb: 2 }}>
                      Target Criteria
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <Typography variant="caption" sx={{ color: '#71717a', display: 'block' }}>
                          Regions
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#e4e4e7' }}>
                          {selectedSchedule.targetCriteria?.regions?.length > 0 
                            ? selectedSchedule.targetCriteria.regions.join(', ') 
                            : 'All Regions'}
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="caption" sx={{ color: '#71717a', display: 'block' }}>
                          Cities
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#e4e4e7' }}>
                          {selectedSchedule.targetCriteria?.cities?.length > 0 
                            ? selectedSchedule.targetCriteria.cities.join(', ') 
                            : 'All Cities'}
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="caption" sx={{ color: '#71717a', display: 'block' }}>
                          Rollout Percentage
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#e4e4e7' }}>
                          {selectedSchedule.targetCriteria?.percentage || 100}%
                        </Typography>
                      </Grid>
                    </Grid>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ color: '#ffffff', mb: 2 }}>
                      Progress Statistics
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <Card sx={{ bgcolor: '#0a0a0a', border: '1px solid #27272a' }}>
                          <CardContent>
                            <Typography variant="h6" sx={{ color: '#3b82f6', fontWeight: 600 }}>
                              {selectedSchedule.stats?.totalDevices || 0}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#71717a' }}>
                              Total Devices
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={4}>
                        <Card sx={{ bgcolor: '#0a0a0a', border: '1px solid #27272a' }}>
                          <CardContent>
                            <Typography variant="h6" sx={{ color: '#22c55e', fontWeight: 600 }}>
                              {selectedSchedule.stats?.completedDevices || 0}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#71717a' }}>
                              Completed
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={4}>
                        <Card sx={{ bgcolor: '#0a0a0a', border: '1px solid #27272a' }}>
                          <CardContent>
                            <Typography variant="h6" sx={{ color: '#ef4444', fontWeight: 600 }}>
                              {selectedSchedule.stats?.failedDevices || 0}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#71717a' }}>
                              Failed
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                  </Grid>

                  {selectedSchedule.scheduleType === 'phased' && selectedSchedule.phasedConfig && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" sx={{ color: '#ffffff', mb: 2 }}>
                        Phased Rollout Configuration
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Card sx={{ bgcolor: '#0a0a0a', border: '1px solid #27272a' }}>
                            <CardContent>
                              <Typography variant="caption" sx={{ color: '#71717a', display: 'block' }}>
                                Batch Size
                              </Typography>
                              <Typography variant="body1" sx={{ color: '#ffffff' }}>
                                {selectedSchedule.phasedConfig.batchSize} devices
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                        <Grid item xs={6}>
                          <Card sx={{ bgcolor: '#0a0a0a', border: '1px solid #27272a' }}>
                            <CardContent>
                              <Typography variant="caption" sx={{ color: '#71717a', display: 'block' }}>
                                Batch Interval
                              </Typography>
                              <Typography variant="body1" sx={{ color: '#ffffff' }}>
                                {selectedSchedule.phasedConfig.batchInterval} minutes
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      </Grid>
                    </Grid>
                  )}
                </Grid>
              </DialogContent>
              <DialogActions sx={{ p: 3, borderTop: '1px solid #27272a' }}>
                <Button onClick={() => setDetailsDialogOpen(false)} sx={{ color: '#a1a1aa' }}>
                  Close
                </Button>
                {selectedSchedule.status === 'pending_approval' && (
                  <>
                    <Button 
                      onClick={() => {
                        handleApproveSchedule(selectedSchedule._id);
                        setDetailsDialogOpen(false);
                      }}
                      variant="contained"
                      sx={{ bgcolor: '#22c55e' }}
                    >
                      Approve
                    </Button>
                    <Button 
                      onClick={() => {
                        handleCancelSchedule(selectedSchedule._id);
                        setDetailsDialogOpen(false);
                      }}
                      variant="contained"
                      sx={{ bgcolor: '#ef4444' }}
                    >
                      Reject
                    </Button>
                  </>
                )}
                {selectedSchedule.status === 'in_progress' && (
                  <Button 
                    onClick={() => {
                      handleCancelSchedule(selectedSchedule._id);
                      setDetailsDialogOpen(false);
                    }}
                    variant="contained"
                    sx={{ bgcolor: '#ef4444' }}
                  >
                    Cancel Schedule
                  </Button>
                )}
                {(selectedSchedule.status === 'cancelled' || selectedSchedule.status === 'completed') && (
                  <Button 
                    onClick={() => {
                      setScheduleToDelete(selectedSchedule);
                      setDetailsDialogOpen(false);
                      setDeleteDialogOpen(true);
                    }}
                    variant="contained"
                    sx={{ bgcolor: '#ef4444' }}
                  >
                    Delete Schedule
                  </Button>
                )}
              </DialogActions>
            </>
          )}
        </Dialog>
      </Box>
    </PageTransition>
  );
}

export default ScheduleManagement;