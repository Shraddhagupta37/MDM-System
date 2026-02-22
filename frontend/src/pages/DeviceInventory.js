import React, { useState, useEffect } from 'react';
import PageTransition from '../components/PageTransition';
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
  LinearProgress
} from '@mui/material';
import {
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  PhoneAndroid as PhoneAndroidIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import api from '../services/api';

function DeviceInventory() {
  const [devices, setDevices] = useState([]);
  const [stats, setStats] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedDevice, setExpandedDevice] = useState(null);
  const [deviceDetails, setDeviceDetails] = useState({});

  useEffect(() => {
    fetchDevices();
  }, [page, rowsPerPage, searchTerm]);

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const response = await api.get('/devices', {
        params: {
          page: page + 1,
          limit: rowsPerPage,
          search: searchTerm
        }
      });
      setDevices(response.data.devices);
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeviceDetails = async (imei) => {
    try {
      const response = await api.get(`/devices/${imei}`);
      setDeviceDetails(prev => ({
        ...prev,
        [imei]: response.data.device
      }));
    } catch (error) {
      console.error('Error fetching device details:', error);
    }
  };

  const handleExpandDevice = (imei) => {
    if (expandedDevice === imei) {
      setExpandedDevice(null);
    } else {
      setExpandedDevice(imei);
      if (!deviceDetails[imei]) {
        fetchDeviceDetails(imei);
      }
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
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
      return <Chip label="Latest" color="success" size="small" />;
    } else if (device.appVersionCode >= latestVersion - 2) {
      return <Chip label="Outdated" color="warning" size="small" />;
    } else {
      return <Chip label="Critical" color="error" size="small" />;
    }
  };

  return (
    <PageTransition>
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Device Inventory
      </Typography>

      {/* Stats Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PhoneAndroidIcon color="primary" sx={{ fontSize: 30, mr: 2 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Total Active
                    </Typography>
                    <Typography variant="h6">
                      {stats.totalActive}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Inactive (&gt;30 days)
                    </Typography>
                    <Typography variant="h6">
                      {stats.inactiveDevices}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Paper sx={{ width: '100%', mb: 2 }}>
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search by IMEI, device model, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" />
                <TableCell>IMEI</TableCell>
                <TableCell>App Version</TableCell>
                <TableCell>Device Info</TableCell>
                <TableCell>Last Open</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Version Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <LinearProgress />
                  </TableCell>
                </TableRow>
              ) : (
                devices.map((device) => (
                  <React.Fragment key={device.imei}>
                    <TableRow hover>
                      <TableCell padding="checkbox">
                        <IconButton
                          size="small"
                          onClick={() => handleExpandDevice(device.imei)}
                        >
                          {expandedDevice === device.imei ? (
                            <ExpandLessIcon />
                          ) : (
                            <ExpandMoreIcon />
                          )}
                        </IconButton>
                      </TableCell>
                      <TableCell>{device.imei}</TableCell>
                      <TableCell>v{device.appVersion}</TableCell>
                      <TableCell>
                        {device.deviceModel} ({device.deviceOS})
                      </TableCell>
                      <TableCell>
                        {new Date(device.lastOpenTime).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {device.location?.region}, {device.location?.city}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={device.status}
                          color={getStatusColor(device.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {getVersionStatus(device)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={8} sx={{ py: 0 }}>
                        <Collapse in={expandedDevice === device.imei}>
                          <Box sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom>
                              Device Details
                            </Typography>
                            <Grid container spacing={2}>
                              <Grid item xs={12} md={6}>
                                <Typography variant="body2">
                                  <strong>Battery Level:</strong>{' '}
                                  {deviceDetails[device.imei]?.metadata?.batteryLevel}%
                                </Typography>
                                <Typography variant="body2">
                                  <strong>Storage Available:</strong>{' '}
                                  {deviceDetails[device.imei]?.metadata?.storageAvailable}GB
                                </Typography>
                                <Typography variant="body2">
                                  <strong>Network Type:</strong>{' '}
                                  {deviceDetails[device.imei]?.metadata?.networkType}
                                </Typography>
                              </Grid>
                              <Grid item xs={12} md={6}>
                                <Typography variant="body2">
                                  <strong>Client Customization:</strong>{' '}
                                  {device.clientCustomization}
                                </Typography>
                                <Typography variant="body2">
                                  <strong>First Registered:</strong>{' '}
                                  {new Date(device.createdAt).toLocaleDateString()}
                                </Typography>
                                <Typography variant="body2">
                                  <strong>Last Updated:</strong>{' '}
                                  {new Date(device.updatedAt).toLocaleDateString()}
                                </Typography>
                              </Grid>
                            </Grid>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[10, 20, 50, 100]}
          component="div"
          count={stats?.totalActive || 0}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  </PageTransition>
  );
}

export default DeviceInventory;