import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  TextField,
  InputAdornment,
  IconButton,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Divider,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  Devices as DevicesIcon,
  Schedule as ScheduleIcon,
  Update as UpdateIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { devices, schedules, versions } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

function SearchBar({ open, onClose }) {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({
    devices: [],
    schedules: [],
    versions: []
  });
  const [recentSearches, setRecentSearches] = useState([]);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Save recent search
  const saveRecentSearch = (term) => {
    const updated = [term, ...recentSearches.filter(t => t !== term)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  // Clear recent searches
  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  // Perform search
  useEffect(() => {
    const performSearch = async () => {
      if (!searchTerm.trim()) {
        setResults({ devices: [], schedules: [], versions: [] });
        return;
      }

      setLoading(true);
      try {
        const [devicesRes, schedulesRes, versionsRes] = await Promise.all([
          devices.getAll({ search: searchTerm, limit: 5 }),
          schedules.getAll({ search: searchTerm, limit: 5 }),
          versions.getAll()
        ]);

        // Filter versions by search term
        const filteredVersions = versionsRes.data.versions?.filter(v => 
          v.versionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          v.versionCode.toString().includes(searchTerm)
        ) || [];

        setResults({
          devices: devicesRes.data.devices || [],
          schedules: schedulesRes.data.schedules || [],
          versions: filteredVersions.slice(0, 5)
        });
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(performSearch, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm]);

  const handleSelect = (type, item) => {
    saveRecentSearch(searchTerm);
    onClose();
    
    switch(type) {
      case 'device':
        navigate(`/devices?imei=${item.imei}`);
        break;
      case 'schedule':
        navigate(`/schedules?id=${item._id}`);
        break;
      case 'version':
        navigate(`/versions?code=${item.versionCode}`);
        break;
    }
  };

  const handleRecentSearchClick = (term) => {
    setSearchTerm(term);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      fullWidth 
      maxWidth="sm"
      PaperProps={{
        sx: {
          bgcolor: '#111111',
          border: '1px solid #27272a',
          borderRadius: 2,
        }
      }}
    >
      <DialogTitle sx={{ p: 2, pb: 0 }}>
        <TextField
          autoFocus
          fullWidth
          placeholder="Search devices, schedules, versions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          variant="outlined"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'rgba(255,255,255,0.5)' }} />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchTerm('')}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
            sx: {
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255,255,255,0.1)',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(96, 165, 250, 0.5)',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#60a5fa',
              },
            }
          }}
        />
      </DialogTitle>

      <DialogContent sx={{ p: 2, minHeight: 200 }}>
        {/* Loading State */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={32} sx={{ color: '#60a5fa' }} />
          </Box>
        )}

        {/* Recent Searches */}
        {!searchTerm && !loading && recentSearches.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                Recent Searches
              </Typography>
              <IconButton size="small" onClick={clearRecentSearches}>
                <CloseIcon fontSize="small" sx={{ color: 'rgba(255,255,255,0.3)' }} />
              </IconButton>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {recentSearches.map((term, index) => (
                <Chip
                  key={index}
                  label={term}
                  onClick={() => handleRecentSearchClick(term)}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.05)',
                    color: 'rgba(255,255,255,0.8)',
                    '&:hover': {
                      bgcolor: 'rgba(96, 165, 250, 0.1)',
                      color: '#60a5fa',
                    },
                  }}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Search Results */}
        <AnimatePresence>
          {!loading && searchTerm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Devices */}
              {results.devices.length > 0 && (
                <>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', mb: 1 }}>
                    Devices ({results.devices.length})
                  </Typography>
                  <List dense sx={{ mb: 2 }}>
                    {results.devices.map((device) => (
                      <ListItem
                        key={device.imei}
                        button
                        onClick={() => handleSelect('device', device)}
                        sx={{
                          borderRadius: 1,
                          mb: 0.5,
                          '&:hover': {
                            bgcolor: 'rgba(96, 165, 250, 0.1)',
                          },
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: '#60a5fa' }}>
                            <DevicesIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                              {device.imei}
                            </Typography>
                          }
                          secondary={`${device.deviceModel} • v${device.appVersion} • ${device.location?.city || 'Unknown'}`}
                          secondaryTypographyProps={{
                            sx: { color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }
                          }}
                        />
                        <Chip
                          label={device.status}
                          size="small"
                          sx={{
                            bgcolor: device.status === 'active' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: device.status === 'active' ? '#22c55e' : '#ef4444',
                            border: `1px solid ${device.status === 'active' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}

              {/* Schedules */}
              {results.schedules.length > 0 && (
                <>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', mb: 1 }}>
                    Schedules ({results.schedules.length})
                  </Typography>
                  <List dense sx={{ mb: 2 }}>
                    {results.schedules.map((schedule) => (
                      <ListItem
                        key={schedule._id}
                        button
                        onClick={() => handleSelect('schedule', schedule)}
                        sx={{
                          borderRadius: 1,
                          mb: 0.5,
                          '&:hover': {
                            bgcolor: 'rgba(96, 165, 250, 0.1)',
                          },
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.1), color: '#c084fc' }}>
                            <ScheduleIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="body2">
                              {schedule.name}
                            </Typography>
                          }
                          secondary={`v${schedule.fromVersionCode} → v${schedule.toVersionCode} • ${schedule.status}`}
                          secondaryTypographyProps={{
                            sx: { color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}

              {/* Versions */}
              {results.versions.length > 0 && (
                <>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', mb: 1 }}>
                    Versions ({results.versions.length})
                  </Typography>
                  <List dense>
                    {results.versions.map((version) => (
                      <ListItem
                        key={version._id}
                        button
                        onClick={() => handleSelect('version', version)}
                        sx={{
                          borderRadius: 1,
                          mb: 0.5,
                          '&:hover': {
                            bgcolor: 'rgba(96, 165, 250, 0.1)',
                          },
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: '#22c55e' }}>
                            <UpdateIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="body2">
                              v{version.versionName} (Code: {version.versionCode})
                            </Typography>
                          }
                          secondary={`Released: ${new Date(version.releaseDate).toLocaleDateString()}`}
                          secondaryTypographyProps={{
                            sx: { color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }
                          }}
                        />
                        {version.isMandatory && (
                          <Chip
                            label="Mandatory"
                            size="small"
                            sx={{
                              bgcolor: 'rgba(245, 158, 11, 0.1)',
                              color: '#f59e0b',
                              border: '1px solid rgba(245, 158, 11, 0.2)',
                            }}
                          />
                        )}
                      </ListItem>
                    ))}
                  </List>
                </>
              )}

              {/* No Results */}
              {!results.devices.length && !results.schedules.length && !results.versions.length && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <SearchIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.1)', mb: 2 }} />
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                    No results found for "{searchTerm}"
                  </Typography>
                </Box>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

export default SearchBar;