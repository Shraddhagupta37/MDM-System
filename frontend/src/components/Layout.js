import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Tooltip,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Devices as DevicesIcon,
  Update as UpdateIcon,
  Schedule as ScheduleIcon,
  History as HistoryIcon,
  Logout as LogoutIcon,
  Notifications as NotificationsIcon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Error as ErrorIcon,
  DoneAll as DoneAllIcon,
  DeleteSweep as DeleteSweepIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import SearchBar from './SearchBar';
import { motion, AnimatePresence } from 'framer-motion';

const drawerWidth = 280;

function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationsEl, setNotificationsEl] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const { user, logout } = useAuth();
  const { 
    notifications, 
    unreadCount, 
    markAllAsRead, 
    clearNotifications,
    handleNotificationAction 
  } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNotificationsOpen = (event) => {
    setNotificationsEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setNotificationsEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Devices', icon: <DevicesIcon />, path: '/devices' },
    { text: 'Versions', icon: <UpdateIcon />, path: '/versions', adminOnly: true },
    { text: 'Schedules', icon: <ScheduleIcon />, path: '/schedules' },
    { text: 'Audit Trail', icon: <HistoryIcon />, path: '/audit', adminOnly: true },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    !item.adminOnly || (item.adminOnly && user?.role === 'admin')
  );

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ px: 3, py: 2 }}>
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 700,
            background: 'linear-gradient(135deg, #60a5fa 0%, #c084fc 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontSize: '1.5rem',
            cursor: 'pointer',
          }}
          onClick={() => navigate('/')}
        >
          MDM System
        </Typography>
      </Toolbar>
      
      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
      
      <Box sx={{ p: 3 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            p: 2,
            borderRadius: 2,
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <Avatar 
            sx={{ 
              bgcolor: 'primary.main',
              width: 48,
              height: 48,
              border: '2px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            {user?.name?.charAt(0) || 'A'}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" fontWeight={600} sx={{ color: '#ffffff' }}>
              {user?.name}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              {user?.role}
            </Typography>
          </Box>
        </Box>
      </Box>
      
      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
      
      <List sx={{ flex: 1, px: 2, py: 2 }}>
        {filteredMenuItems.map((item) => (
          <motion.div
            key={item.text}
            whileHover={{ x: 4 }}
            transition={{ duration: 0.2 }}
          >
            <ListItem 
              button 
              onClick={() => {
                navigate(item.path);
                setMobileOpen(false);
              }}
              selected={location.pathname === item.path}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                px: 2,
                py: 1.5,
                '&.Mui-selected': {
                  background: 'linear-gradient(90deg, rgba(96, 165, 250, 0.2) 0%, rgba(192, 132, 252, 0.2) 100%)',
                  borderLeft: `3px solid ${theme.palette.primary.main}`,
                  '&:hover': {
                    background: 'linear-gradient(90deg, rgba(96, 165, 250, 0.3) 0%, rgba(192, 132, 252, 0.3) 100%)',
                  },
                  '& .MuiListItemIcon-root': {
                    color: '#60a5fa',
                  },
                  '& .MuiListItemText-primary': {
                    color: '#ffffff',
                    fontWeight: 600,
                  },
                },
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.03)',
                },
              }}
            >
              <ListItemIcon sx={{ 
                minWidth: 40,
                color: location.pathname === item.path ? '#60a5fa' : 'rgba(255, 255, 255, 0.5)',
              }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{
                  fontSize: '0.9rem',
                  fontWeight: location.pathname === item.path ? 600 : 400,
                  color: location.pathname === item.path ? '#ffffff' : 'rgba(255, 255, 255, 0.8)',
                }}
              />
            </ListItem>
          </motion.div>
        ))}
      </List>
      
      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
      
      <List sx={{ px: 2, py: 2 }}>
        <ListItem 
          button 
          onClick={handleLogout}
          sx={{
            borderRadius: 2,
            px: 2,
            py: 1.5,
            color: 'rgba(255, 255, 255, 0.7)',
            '&:hover': {
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          backgroundColor: 'rgba(10, 10, 15, 0.8)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography 
            variant="h6" 
            noWrap 
            sx={{ 
              flexGrow: 1, 
              color: '#ffffff',
              fontWeight: 500,
            }}
          >
            {menuItems.find(item => item.path === location.pathname)?.text || 'Dashboard'}
          </Typography>
          
          <IconButton 
            color="inherit"
            onClick={() => setSearchOpen(true)}
            sx={{ 
              mr: 1,
              color: 'rgba(255, 255, 255, 0.7)',
              '&:hover': { color: '#60a5fa' }
            }}
          >
            <SearchIcon />
          </IconButton>
          
          <IconButton 
            color="inherit"
            onClick={handleNotificationsOpen}
            sx={{ 
              mr: 1,
              color: 'rgba(255, 255, 255, 0.7)',
              '&:hover': { color: '#60a5fa' }
            }}
          >
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          
          <IconButton
            onClick={handleProfileMenuOpen}
            sx={{ 
              border: '1px solid rgba(255, 255, 255, 0.1)',
              '&:hover': { borderColor: '#60a5fa' }
            }}
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
              {user?.name?.charAt(0) || 'A'}
            </Avatar>
          </IconButton>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              sx: {
                mt: 1.5,
                minWidth: 200,
                bgcolor: '#111111',
                border: '1px solid #27272a',
              }
            }}
          >
            <MenuItem disabled>
              <Box>
                <Typography variant="body2" sx={{ color: '#ffffff' }}>{user?.name}</Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                  {user?.email}
                </Typography>
              </Box>
            </MenuItem>
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
              Logout
            </MenuItem>
          </Menu>

          <Menu
            anchorEl={notificationsEl}
            open={Boolean(notificationsEl)}
            onClose={handleMenuClose}
            PaperProps={{
              sx: { 
                width: 400, 
                maxHeight: 500,
                mt: 1.5,
                bgcolor: '#111111',
                border: '1px solid #27272a',
              }
            }}
          >
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle2" sx={{ color: '#ffffff' }}>
                Notifications
              </Typography>
              <Box>
                <Tooltip title="Mark all as read">
                  <IconButton size="small" onClick={markAllAsRead} sx={{ mr: 0.5 }}>
                    <DoneAllIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Clear all">
                  <IconButton size="small" onClick={clearNotifications}>
                    <DeleteSweepIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
            
            {notifications.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <NotificationsIcon sx={{ fontSize: 40, color: 'rgba(255,255,255,0.1)', mb: 1 }} />
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                  No notifications
                </Typography>
              </Box>
            ) : (
              notifications.map((notification) => (
                <MenuItem 
                  key={notification.id} 
                  onClick={() => {
                    handleNotificationAction(notification);
                    handleMenuClose();
                  }}
                  sx={{
                    py: 2,
                    backgroundColor: notification.read ? 'transparent' : 'rgba(96, 165, 250, 0.05)',
                    '&:hover': {
                      backgroundColor: 'rgba(96, 165, 250, 0.1)',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, width: '100%' }}>
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: notification.type === 'error' ? 'rgba(239, 68, 68, 0.1)' :
                                 notification.type === 'warning' ? 'rgba(245, 158, 11, 0.1)' :
                                 notification.type === 'success' ? 'rgba(34, 197, 94, 0.1)' :
                                 'rgba(96, 165, 250, 0.1)',
                        color: notification.type === 'error' ? '#ef4444' :
                               notification.type === 'warning' ? '#f59e0b' :
                               notification.type === 'success' ? '#22c55e' :
                               '#60a5fa',
                      }}
                    >
                      {notification.type === 'error' && <ErrorIcon fontSize="small" />}
                      {notification.type === 'warning' && <WarningIcon fontSize="small" />}
                      {notification.type === 'success' && <CheckCircleIcon fontSize="small" />}
                      {notification.type === 'info' && <InfoIcon fontSize="small" />}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" sx={{ color: '#ffffff', mb: 0.5 }}>
                        {notification.title}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', mb: 0.5 }}>
                        {notification.message}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)' }}>
                        {new Date(notification.timestamp).toLocaleString()}
                      </Typography>
                    </Box>
                    {!notification.read && (
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: '#60a5fa',
                          mt: 1,
                        }}
                      />
                    )}
                  </Box>
                </MenuItem>
              ))
            )}
          </Menu>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              bgcolor: '#0a0a0a',
              borderRight: '1px solid #27272a',
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              bgcolor: '#0a0a0a',
              borderRight: '1px solid #27272a',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          bgcolor: '#0a0a0a',
          background: 'radial-gradient(circle at 50% 50%, rgba(96, 165, 250, 0.05) 0%, transparent 50%)',
        }}
      >
        <Toolbar />
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Box sx={{ p: 3 }}>
              {children}
            </Box>
          </motion.div>
        </AnimatePresence>
      </Box>

      <SearchBar open={searchOpen} onClose={() => setSearchOpen(false)} />
    </Box>
  );
}

export default Layout;