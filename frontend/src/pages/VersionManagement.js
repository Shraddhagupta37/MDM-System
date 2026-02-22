import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  TextField,
  Alert,
  LinearProgress,
  Grid,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Tooltip,
  alpha,
  useTheme,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CloudUpload as CloudUploadIcon,
  GetApp as GetAppIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { versions } from '../services/api';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '../components/PageTransition';
import StatsCard from '../components/StatsCard';
import EmptyState from '../components/EmptyState';
import StyledDialog from '../components/StyledDialog';

function VersionManagement() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [versionList, setVersionList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [formData, setFormData] = useState({
    versionCode: '',
    versionName: '',
    releaseDate: new Date().toISOString().split('T')[0],
    supportedOSRange: { min: '', max: '' },
    isMandatory: false,
    isActive: true,
    releaseNotes: '',
    downloadUrl: '',
    fileSize: '',
  });
  const [sortConfig, setSortConfig] = useState({
    field: 'releaseDate',
    direction: 'desc'
  });

  useEffect(() => {
    fetchVersions();
  }, []);

  const handleSort = (field) => {
    setSortConfig({
      field,
      direction: sortConfig.field === field && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  // Sort versions
  const sortedVersions = [...versionList].sort((a, b) => {
    let aVal, bVal;
  
    switch(sortConfig.field) {
      case 'versionCode':
        aVal = a.versionCode;
        bVal = b.versionCode;
        break;
      case 'versionName':
        aVal = a.versionName;
        bVal = b.versionName;
        break;
      case 'releaseDate':
        aVal = new Date(a.releaseDate).getTime();
        bVal = new Date(b.releaseDate).getTime();
        break;
      case 'isMandatory':
        aVal = a.isMandatory ? 1 : 0;
        bVal = b.isMandatory ? 1 : 0;
        break;
      default:
        return 0;
    }
  
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const fetchVersions = async () => {
    try {
      setLoading(true);
      const response = await versions.getAll();
      setVersionList(response.data.versions || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching versions:', error);
      setError('Failed to load versions');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (version = null) => {
    if (version) {
      setSelectedVersion(version);
      setFormData({
        versionCode: version.versionCode,
        versionName: version.versionName,
        releaseDate: version.releaseDate.split('T')[0],
        supportedOSRange: version.supportedOSRange || { min: '', max: '' },
        isMandatory: version.isMandatory || false,
        isActive: version.isActive !== false,
        releaseNotes: version.releaseNotes || '',
        downloadUrl: version.downloadUrl || '',
        fileSize: version.fileSize || '',
      });
    } else {
      setSelectedVersion(null);
      setFormData({
        versionCode: '',
        versionName: '',
        releaseDate: new Date().toISOString().split('T')[0],
        supportedOSRange: { min: '', max: '' },
        isMandatory: false,
        isActive: true,
        releaseNotes: '',
        downloadUrl: '',
        fileSize: '',
      });
    }
    setDialogOpen(true);
  };

  const handleDeleteVersion = (version) => {
    setSelectedVersion(version);
    setDeleteDialogOpen(true);
  };

  const handleSaveVersion = async () => {
    try {
      setLoading(true);
      if (selectedVersion) {
        await versions.update(selectedVersion.versionCode, formData);
      } else {
        await versions.create(formData);
      }
      setDialogOpen(false);
      await fetchVersions();
    } catch (error) {
      console.error('Error saving version:', error);
      setError('Failed to save version');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Deleting version:', selectedVersion.versionCode);
      
      const response = await versions.delete(selectedVersion.versionCode);
      console.log('Delete response:', response.data);
      
      setDeleteDialogOpen(false);
      await fetchVersions();
    } catch (error) {
      console.error('Error deleting version:', error);
      const errorMsg = error.response?.data?.error || error.message;
      
      // Check if error is about schedules
      if (errorMsg.includes('schedule')) {
        // Extract number of schedules from error message
        const match = errorMsg.match(/(\d+)/);
        const scheduleCount = match ? match[0] : 'multiple';
        
        // Show custom dialog with redirect option
        if (window.confirm(
          `This version is used in ${scheduleCount} schedule(s).\n\n` +
          `Would you like to view these schedules to delete them first?`
        )) {
          // Navigate to schedules page with filter
          navigate(`/schedules?version=${selectedVersion.versionCode}`);
        }
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const activeVersions = versionList.filter(v => v.isActive).length;
  const latestVersion = versionList[0]?.versionName || 'N/A';

  return (
    <PageTransition>
      <Box sx={{ flexGrow: 1 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: '#ffffff' }}>
              Version Management
            </Typography>
            <Typography variant="body2" sx={{ color: '#a1a1aa' }}>
              Manage app versions and release configurations
            </Typography>
          </Box>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{
              bgcolor: '#60a5fa',
              '&:hover': { bgcolor: '#3b82f6' },
              px: 3,
              py: 1,
            }}
          >
            New Version
          </Button>
        </Box>

        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 2,
              bgcolor: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              '& .MuiAlert-icon': {
                color: '#ef4444',
              },
            }} 
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <StatsCard
              title="Total Versions"
              value={versionList.length}
              icon={<InfoIcon />}
              color="#60a5fa"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatsCard
              title="Active Versions"
              value={activeVersions}
              icon={<CheckCircleIcon />}
              color="#34d399"
              trend={5}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatsCard
              title="Latest Version"
              value={latestVersion}
              icon={<CloudUploadIcon />}
              color="#c084fc"
            />
          </Grid>
        </Grid>

        {/* Versions Table */}
        <Paper sx={{ 
          width: '100%', 
          overflow: 'hidden', 
          bgcolor: '#111111',
          border: '1px solid #27272a',
        }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell 
                    onClick={() => handleSort('versionName')} 
                    sx={{ 
                      cursor: 'pointer',
                      color: '#ffffff',
                      fontWeight: 600,
                      '&:hover': { color: '#60a5fa' }
                    }}
                  >
                    Version {sortConfig.field === 'versionName' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </TableCell>
                  <TableCell 
                    onClick={() => handleSort('versionCode')} 
                    sx={{ 
                      cursor: 'pointer',
                      color: '#ffffff',
                      fontWeight: 600,
                      '&:hover': { color: '#60a5fa' }
                    }}
                  >
                    Code {sortConfig.field === 'versionCode' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </TableCell>
                  <TableCell 
                    onClick={() => handleSort('releaseDate')} 
                    sx={{ 
                      cursor: 'pointer',
                      color: '#ffffff',
                      fontWeight: 600,
                      '&:hover': { color: '#60a5fa' }
                    }}
                  >
                    Release Date {sortConfig.field === 'releaseDate' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </TableCell>
                  <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>OS Support</TableCell>
                  <TableCell 
                    onClick={() => handleSort('isMandatory')} 
                    sx={{ 
                      cursor: 'pointer',
                      color: '#ffffff',
                      fontWeight: 600,
                      '&:hover': { color: '#60a5fa' }
                    }}
                  >
                    Mandatory {sortConfig.field === 'isMandatory' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </TableCell>
                  <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>Size</TableCell>
                  <TableCell align="right" sx={{ color: '#ffffff', fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <LinearProgress sx={{ 
                        bgcolor: '#27272a',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: '#60a5fa',
                        },
                      }} />
                    </TableCell>
                  </TableRow>
                ) : versionList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <EmptyState
                        icon={<CloudUploadIcon sx={{ fontSize: 48 }} />}
                        title="No versions found"
                        description="Create your first app version to start managing updates."
                        actionText="Create Version"
                        onAction={() => handleOpenDialog()}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  <AnimatePresence>
                    {sortedVersions.map((version, index) => (
                      <motion.tr
                        key={version._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: index * 0.05 }}
                        style={{ display: 'table-row' }}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight={600} sx={{ color: '#ffffff' }}>
                            {version.versionName}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={version.versionCode} 
                            size="small" 
                            sx={{
                              bgcolor: alpha('#60a5fa', 0.1),
                              color: '#60a5fa',
                              border: `1px solid ${alpha('#60a5fa', 0.2)}`,
                              fontWeight: 600,
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: '#a1a1aa' }}>
                          {format(new Date(version.releaseDate), 'PP')}
                        </TableCell>
                        <TableCell sx={{ color: '#a1a1aa' }}>
                          {version.supportedOSRange?.min || 'N/A'} - {version.supportedOSRange?.max || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {version.isMandatory ? (
                            <Chip
                              label="Mandatory"
                              size="small"
                              sx={{
                                bgcolor: alpha('#f59e0b', 0.1),
                                color: '#f59e0b',
                                border: `1px solid ${alpha('#f59e0b', 0.2)}`,
                              }}
                            />
                          ) : (
                            <Chip
                              label="Optional"
                              size="small"
                              sx={{
                                bgcolor: alpha('#60a5fa', 0.1),
                                color: '#60a5fa',
                                border: `1px solid ${alpha('#60a5fa', 0.2)}`,
                              }}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={version.isActive ? 'Active' : 'Inactive'}
                            size="small"
                            sx={{
                              bgcolor: version.isActive 
                                ? alpha('#22c55e', 0.1)
                                : alpha('#ef4444', 0.1),
                              color: version.isActive 
                                ? '#22c55e'
                                : '#ef4444',
                              border: `1px solid ${version.isActive 
                                ? alpha('#22c55e', 0.2)
                                : alpha('#ef4444', 0.2)}`,
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: '#a1a1aa' }}>
                          {version.fileSize ? `${(version.fileSize / 1024 / 1024).toFixed(1)} MB` : 'N/A'}
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Edit">
                            <IconButton 
                              size="small" 
                              onClick={() => handleOpenDialog(version)}
                              sx={{ 
                                color: '#a1a1aa',
                                '&:hover': { color: '#60a5fa' }
                              }}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton 
                              size="small" 
                              onClick={() => handleDeleteVersion(version)}
                              sx={{ 
                                color: '#a1a1aa',
                                '&:hover': { color: '#ef4444' }
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Create/Edit Version Dialog */}
        <StyledDialog
          open={dialogOpen}
          onClose={() => {
            setDialogOpen(false);
            setFormData({
              versionCode: '',
              versionName: '',
              releaseDate: new Date().toISOString().split('T')[0],
              supportedOSRange: { min: '', max: '' },
              isMandatory: false,
              isActive: true,
              releaseNotes: '',
              downloadUrl: '',
              fileSize: '',
            });
          }}
          title={selectedVersion ? 'Edit Version' : 'Create New Version'}
          onConfirm={handleSaveVersion}
          confirmText="Save"
          loading={loading}
          maxWidth="md"
        >
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Version Code"
                type="number"
                value={formData.versionCode}
                onChange={(e) => setFormData({...formData, versionCode: e.target.value})}
                disabled={selectedVersion}
                variant="outlined"
                InputLabelProps={{ sx: { color: '#a1a1aa' } }}
                InputProps={{ 
                  sx: { 
                    color: '#ffffff',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#27272a',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#60a5fa',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#60a5fa',
                    },
                  } 
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Version Name"
                value={formData.versionName}
                onChange={(e) => setFormData({...formData, versionName: e.target.value})}
                variant="outlined"
                InputLabelProps={{ sx: { color: '#a1a1aa' } }}
                InputProps={{ 
                  sx: { 
                    color: '#ffffff',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#27272a',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#60a5fa',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#60a5fa',
                    },
                  } 
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Release Date"
                type="date"
                value={formData.releaseDate}
                onChange={(e) => setFormData({...formData, releaseDate: e.target.value})}
                InputLabelProps={{ shrink: true, sx: { color: '#a1a1aa' } }}
                InputProps={{ 
                  sx: { 
                    color: '#ffffff',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#27272a',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#60a5fa',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#60a5fa',
                    },
                  } 
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Download URL"
                value={formData.downloadUrl}
                onChange={(e) => setFormData({...formData, downloadUrl: e.target.value})}
                variant="outlined"
                InputLabelProps={{ sx: { color: '#a1a1aa' } }}
                InputProps={{ 
                  sx: { 
                    color: '#ffffff',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#27272a',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#60a5fa',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#60a5fa',
                    },
                  } 
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Min OS Version"
                value={formData.supportedOSRange.min}
                onChange={(e) => setFormData({
                  ...formData, 
                  supportedOSRange: {...formData.supportedOSRange, min: e.target.value}
                })}
                variant="outlined"
                InputLabelProps={{ sx: { color: '#a1a1aa' } }}
                InputProps={{ 
                  sx: { 
                    color: '#ffffff',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#27272a',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#60a5fa',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#60a5fa',
                    },
                  } 
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Max OS Version"
                value={formData.supportedOSRange.max}
                onChange={(e) => setFormData({
                  ...formData, 
                  supportedOSRange: {...formData.supportedOSRange, max: e.target.value}
                })}
                variant="outlined"
                InputLabelProps={{ sx: { color: '#a1a1aa' } }}
                InputProps={{ 
                  sx: { 
                    color: '#ffffff',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#27272a',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#60a5fa',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#60a5fa',
                    },
                  } 
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Release Notes"
                multiline
                rows={3}
                value={formData.releaseNotes}
                onChange={(e) => setFormData({...formData, releaseNotes: e.target.value})}
                variant="outlined"
                InputLabelProps={{ sx: { color: '#a1a1aa' } }}
                InputProps={{ 
                  sx: { 
                    color: '#ffffff',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#27272a',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#60a5fa',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#60a5fa',
                    },
                  } 
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isMandatory}
                    onChange={(e) => setFormData({...formData, isMandatory: e.target.checked})}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#60a5fa',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#60a5fa',
                      },
                    }}
                  />
                }
                label="Mandatory Update"
                sx={{ color: '#ffffff' }}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#22c55e',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#22c55e',
                      },
                    }}
                  />
                }
                label="Active"
                sx={{ color: '#ffffff' }}
              />
            </Grid>
          </Grid>
        </StyledDialog>

        {/* Delete Confirmation Dialog */}
        <StyledDialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          title="Delete Version"
          onConfirm={handleConfirmDelete}
          confirmText="Delete"
          confirmColor="error"
          loading={loading}
        >
          <Alert 
            severity="warning" 
            sx={{ 
              mb: 2,
              bgcolor: 'rgba(245, 158, 11, 0.1)',
              color: '#f59e0b',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              '& .MuiAlert-icon': {
                color: '#f59e0b',
              },
            }}
          >
            This action cannot be undone.
          </Alert>
          <Typography sx={{ color: '#e4e4e7' }}>
            Are you sure you want to delete version <strong style={{ color: '#60a5fa' }}>{selectedVersion?.versionName}</strong>?
          </Typography>
          {selectedVersion?.isMandatory && (
            <Alert 
              severity="info" 
              sx={{ 
                mt: 2,
                bgcolor: 'rgba(96, 165, 250, 0.1)',
                color: '#60a5fa',
                border: '1px solid rgba(96, 165, 250, 0.2)',
                '& .MuiAlert-icon': {
                  color: '#60a5fa',
                },
              }}
            >
              This is a mandatory version. Deleting it may affect update schedules.
            </Alert>
          )}
        </StyledDialog>
      </Box>
    </PageTransition>
  );
}

export default VersionManagement;