import React, { useState, useEffect } from 'react';

import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  IconButton,
  Tooltip,
  Button,
  Divider,
  Stack,
  Avatar,
  AvatarGroup,
  Badge,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Devices as DevicesIcon,
  Update as UpdateIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  SystemUpdateAlt as VersionIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Error as ErrorIcon,
  LocationOn as LocationIcon,
  PhoneAndroid as PhoneIcon,
  Speed as SpeedIcon,
  Timeline as TimelineIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ComposedChart,
  Scatter,
} from 'recharts';
import { devices, versions, schedules, audit, updates } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { useNavigate } from 'react-router-dom';

import StatsCard from '../components/StatsCard';
import PageTransition from '../components/PageTransition';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { motion } from 'framer-motion';


const COLORS = ['#1976d2', '#dc004e', '#4caf50', '#ff9800', '#9c27b0', '#00bcd4', '#e91e63'];

function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentSchedules, setRecentSchedules] = useState([]);
  const [recentJobs, setRecentJobs] = useState([]);
  const [versionData, setVersionData] = useState([]);
  const [regionData, setRegionData] = useState([]);
  const [auditStats, setAuditStats] = useState([]);
  const [updateTrends, setUpdateTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedChart, setSelectedChart] = useState('line');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [timeRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch devices with stats
      const devicesRes = await devices.getAll({ limit: 10 });
      const devicesData = devicesRes.data;
      setStats(devicesData.stats);
      
      // Process version distribution
      if (devicesData.stats?.versionDistribution) {
        setVersionData(devicesData.stats.versionDistribution);
      }

      // Process region distribution
      if (devicesData.stats?.regionWise) {
        setRegionData(devicesData.stats.regionWise);
      }

      // Fetch recent schedules
      const schedulesRes = await schedules.getAll({ limit: 5 });
      setRecentSchedules(schedulesRes.data.schedules);

      // Fetch recent update jobs
      const jobsRes = await updates.getRecentJobs?.() || { data: { jobs: [] } };
      setRecentJobs(jobsRes.data.jobs || []);

      // Fetch audit stats
      const endDate = new Date();
      const startDate = subDays(endDate, parseInt(timeRange));
      const auditRes = await audit.getLogs({ 
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 1000
      });
      processAuditStats(auditRes.data.logs);

      setError(null);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const processAuditStats = (logs) => {
    const days = parseInt(timeRange);
    const data = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(today, i);
      const dateStr = format(date, 'MMM dd');
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      
      const dayLogs = logs.filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate >= dayStart && logDate <= dayEnd;
      });

      data.push({
        date: dateStr,
        updates: dayLogs.filter(l => l.action.includes('UPDATE')).length,
        schedules: dayLogs.filter(l => l.action.includes('SCHEDULE')).length,
        devices: dayLogs.filter(l => l.action.includes('DEVICE')).length,
        errors: dayLogs.filter(l => l.status === 'failure').length,
      });
    }
    
    setAuditStats(data);
    calculateTrends(data);
  };

  const calculateTrends = (data) => {
    if (data.length < 2) return;
    
    const lastTwo = data.slice(-2);
    const trend = {
      updates: lastTwo[1].updates - lastTwo[0].updates,
      devices: lastTwo[1].devices - lastTwo[0].devices,
      successRate: calculateSuccessRate(data)
    };
    setUpdateTrends(trend);
  };

  const calculateSuccessRate = (data) => {
    const total = data.reduce((acc, d) => acc + d.updates, 0);
    const errors = data.reduce((acc, d) => acc + d.errors, 0);
    return total === 0 ? 100 : Math.round(((total - errors) / total) * 100);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'blocked': return 'error';
      default: return 'default';
    }
  };

  const getVersionHealthColor = (version) => {
    const latestVersion = stats?.latestVersion || 0;
    if (version >= latestVersion) return 'success';
    if (version >= latestVersion - 2) return 'warning';
    return 'error';
  };

  const handleExportData = () => {
    const dataStr = JSON.stringify({ stats, recentSchedules, versionData, regionData }, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `mdm-dashboard-${format(new Date(), 'yyyy-MM-dd')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  if (loading && !stats) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
        <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 2 }}>
          Loading dashboard data...
        </Typography>
      </Box>
    );
  }

  return (
    <PageTransition>
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header with actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            MDM Dashboard
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Welcome back, {user?.name} · {format(new Date(), 'EEEE, MMMM do, yyyy')}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchDashboardData}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExportData}
          >
            Export
          </Button>
          <Tooltip title="More options">
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
              <MoreVertIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Time range selector menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => { setTimeRange('24h'); setAnchorEl(null); }}>
          <ListItemIcon><TimelineIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Last 24 Hours</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setTimeRange('7d'); setAnchorEl(null); }}>
          <ListItemIcon><TimelineIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Last 7 Days</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setTimeRange('30d'); setAnchorEl(null); }}>
          <ListItemIcon><TimelineIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Last 30 Days</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { setSelectedChart('line'); setAnchorEl(null); }}>
          <ListItemIcon><TimelineIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Line Chart</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setSelectedChart('area'); setAnchorEl(null); }}>
          <ListItemIcon><TimelineIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Area Chart</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setSelectedChart('bar'); setAnchorEl(null); }}>
          <ListItemIcon><BarChartIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Bar Chart</ListItemText>
        </MenuItem>
      </Menu>

      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={fetchDashboardData}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {loading ? (
          <LoadingSkeleton type="dashboard" />
        ) : (
          <>
            {/* KPI Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <StatsCard
                  title="Total Devices"
                  value={stats?.totalActive || 0}
                  icon={<DevicesIcon />}
                  color="#6366f1"
                  trend={5.2}
                  subtitle={`${stats?.inactiveDevices || 0} inactive`}
                  onClick={() => navigate('/devices')}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatsCard
                  title="Active Schedules"
                  value={recentSchedules.filter(s => s.status === 'in_progress').length}
                  icon={<ScheduleIcon />}
                  color="#ec4899"
                  trend={-2.1}
                  subtitle="2 pending approval"
                  onClick={() => navigate('/schedules')}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatsCard
                  title="Success Rate"
                  value={`${updateTrends.successRate || 98}%`}
                  icon={<CheckCircleIcon />}
                  color="#10b981"
                  trend={1.5}
                  subtitle="Last 30 days"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatsCard
                  title="Latest Version"
                  value={`v${stats?.latestVersion || '1.0'}`}
                  icon={<VersionIcon />}
                  color="#f59e0b"
                  trend={0}
                  subtitle="Released 2 days ago"
                />
              </Grid>
            </Grid>

            {/* Charts Section with Animation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Grid container spacing={3} sx={{ mb: 4 }}>
                {/* Activity Chart */}
                <Grid item xs={12} md={8}>
                  <Paper sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">System Activity</Typography>
                      <Chip 
                        label={`${updateTrends.successRate || 0}% Success Rate`}
                        size="small"
                        sx={{
                          bgcolor: updateTrends.successRate > 90 ? 'rgba(34, 197, 94, 0.1)' :
                                  updateTrends.successRate > 70 ? 'rgba(245, 158, 11, 0.1)' :
                                  'rgba(239, 68, 68, 0.1)',
                          color: updateTrends.successRate > 90 ? '#22c55e' :
                                updateTrends.successRate > 70 ? '#f59e0b' :
                                '#ef4444',
                        }}
                      />
                    </Box>
                    <ResponsiveContainer width="100%" height={350}>
                      {selectedChart === 'line' && (
                        <LineChart data={auditStats}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                          <XAxis dataKey="date" stroke="#71717a" />
                          <YAxis stroke="#71717a" />
                          <RechartsTooltip 
                            contentStyle={{ 
                              backgroundColor: '#111111',
                              border: '1px solid #27272a',
                              borderRadius: 8,
                            }}
                          />
                          <Legend />
                          <Line type="monotone" dataKey="updates" stroke="#60a5fa" strokeWidth={2} name="Updates" />
                          <Line type="monotone" dataKey="devices" stroke="#34d399" strokeWidth={2} name="Devices" />
                          <Line type="monotone" dataKey="errors" stroke="#ef4444" strokeWidth={2} name="Errors" />
                        </LineChart>
                      )}
                      {selectedChart === 'area' && (
                        <AreaChart data={auditStats}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                          <XAxis dataKey="date" stroke="#71717a" />
                          <YAxis stroke="#71717a" />
                          <RechartsTooltip 
                            contentStyle={{ 
                              backgroundColor: '#111111',
                              border: '1px solid #27272a',
                              borderRadius: 8,
                            }}
                          />
                          <Legend />
                          <Area type="monotone" dataKey="updates" stackId="1" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.3} />
                          <Area type="monotone" dataKey="devices" stackId="1" stroke="#34d399" fill="#34d399" fillOpacity={0.3} />
                          <Area type="monotone" dataKey="errors" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
                        </AreaChart>
                      )}
                      {selectedChart === 'bar' && (
                        <BarChart data={auditStats}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                          <XAxis dataKey="date" stroke="#71717a" />
                          <YAxis stroke="#71717a" />
                          <RechartsTooltip 
                            contentStyle={{ 
                              backgroundColor: '#111111',
                              border: '1px solid #27272a',
                              borderRadius: 8,
                            }}
                          />
                          <Legend />
                          <Bar dataKey="updates" fill="#60a5fa" />
                          <Bar dataKey="devices" fill="#34d399" />
                          <Bar dataKey="errors" fill="#ef4444" />
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </Paper>
                </Grid>

                {/* Version Distribution */}
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 3, height: '100%' }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PieChartIcon color="primary" />
                      Version Distribution
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={versionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="count"
                        >
                          {versionData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={COLORS[index % COLORS.length]}
                              stroke="white"
                              strokeWidth={2}
                            />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <Box sx={{ mt: 2 }}>
                      {versionData.map((v, i) => (
                        <Box key={i} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: COLORS[i % COLORS.length] }} />
                            <Typography variant="body2">Version {v._id}</Typography>
                          </Box>
                          <Typography variant="body2" fontWeight="600">{v.count}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </motion.div>
          </>
        )}

        {/* Region Distribution */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Regional Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={regionData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="_id" type="category" width={100} />
                <RechartsTooltip />
                <Bar dataKey="count" fill="#1976d2" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Update Health Radar */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              System Health Metrics
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                { subject: 'Success Rate', A: updateTrends.successRate || 100, fullMark: 100 },
                { subject: 'Coverage', A: stats?.totalActive ? 85 : 0, fullMark: 100 },
                { subject: 'Compliance', A: versionData.length ? 78 : 0, fullMark: 100 },
                { subject: 'Performance', A: 92, fullMark: 100 },
                { subject: 'Security', A: 88, fullMark: 100 },
              ]}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar name="System" dataKey="A" stroke="#1976d2" fill="#1976d2" fillOpacity={0.6} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

      {/* Recent Schedules */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Update Schedules
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Schedule Name</TableCell>
                    <TableCell>Version Change</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Progress</TableCell>
                    <TableCell>Target Devices</TableCell>
                    <TableCell>Timeline</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentSchedules.map((schedule) => (
                    <TableRow key={schedule._id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {schedule.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Created {format(new Date(schedule.createdAt), 'MMM dd, yyyy')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={`v${schedule.fromVersionCode} → v${schedule.toVersionCode}`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={schedule.scheduleType} 
                          size="small"
                          color={schedule.scheduleType === 'phased' ? 'secondary' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={schedule.status}
                          size="small"
                          color={
                            schedule.status === 'completed' ? 'success' :
                            schedule.status === 'in_progress' ? 'primary' :
                            schedule.status === 'failed' ? 'error' :
                            schedule.status === 'cancelled' ? 'default' :
                            'warning'
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 120 }}>
                          <Box sx={{ width: '100%', mr: 1 }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={schedule.stats?.totalDevices ? 
                                ((schedule.stats.completedDevices + schedule.stats.failedDevices) / schedule.stats.totalDevices) * 100 : 0
                              }
                              sx={{ height: 8, borderRadius: 4 }}
                            />
                          </Box>
                          <Typography variant="body2" color="textSecondary">
                            {schedule.stats?.totalDevices ? 
                              `${Math.round(((schedule.stats.completedDevices + schedule.stats.failedDevices) / schedule.stats.totalDevices) * 100)}%` : '0%'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          badgeContent={schedule.stats?.totalDevices || 0} 
                          color="primary"
                          max={999}
                        >
                          <PhoneIcon color="action" />
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Tooltip title="Completed">
                            <Chip 
                              size="small" 
                              label={schedule.stats?.completedDevices || 0}
                              sx={{ 
                                bgcolor: 'rgba(34, 197, 94, 0.1)',
                                color: '#22c55e',
                                border: '1px solid rgba(34, 197, 94, 0.2)',
                                minWidth: 40
                              }}
                            />
                          </Tooltip>
                          <Tooltip title="Failed">
                            <Chip 
                              size="small" 
                              label={schedule.stats?.failedDevices || 0}
                              sx={{ 
                                bgcolor: 'rgba(239, 68, 68, 0.1)',
                                color: '#ef4444',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                minWidth: 40
                              }}
                            />
                          </Tooltip>
                          <Tooltip title="In Progress">
                            <Chip 
                              size="small" 
                              label={schedule.stats?.inProgressDevices || 0}
                              sx={{ 
                                bgcolor: 'rgba(245, 158, 11, 0.1)',
                                color: '#f59e0b',
                                border: '1px solid rgba(245, 158, 11, 0.2)',
                                minWidth: 40
                              }}
                            />
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                  {recentSchedules.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                        <Typography variant="body2" color="textSecondary">
                          No schedules found. Create your first update schedule to get started.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Real-time Update Jobs */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Real-time Update Jobs
              </Typography>
              <Chip 
                icon={<SpeedIcon />}
                label={`${recentJobs.filter(j => j.currentState === 'in_progress').length} in progress`}
                color="primary"
                size="small"
              />
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Device IMEI</TableCell>
                    <TableCell>Update</TableCell>
                    <TableCell>State</TableCell>
                    <TableCell>Progress</TableCell>
                    <TableCell>Started</TableCell>
                    <TableCell>Timeline</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentJobs.map((job) => (
                    <TableRow key={job._id} hover>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {job.deviceImei}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={`v${job.fromVersionCode} → v${job.toVersionCode}`}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={job.currentState}
                          size="small"
                          color={
                            job.currentState === 'installation_completed' ? 'success' :
                            job.currentState === 'failed' ? 'error' :
                            job.currentState === 'in_progress' ? 'primary' :
                            'default'
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', width: 100 }}>
                          <Box sx={{ width: '100%', mr: 1 }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={job.progress?.downloadProgress || 0}
                              sx={{ height: 4, borderRadius: 2 }}
                            />
                          </Box>
                          <Typography variant="caption">
                            {job.progress?.downloadProgress || 0}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {format(new Date(job.createdAt), 'HH:mm:ss')}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {job.timeline?.slice(-3).map((event, idx) => (
                            <Tooltip key={idx} title={`${event.state} at ${format(new Date(event.timestamp), 'HH:mm:ss')}`}>
                              <Avatar sx={{ width: 24, height: 24, bgcolor: 'grey.300' }}>
                                <TimelineIcon sx={{ fontSize: 14 }} />
                              </Avatar>
                            </Tooltip>
                          ))}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  </PageTransition>
  );
}

export default Dashboard;