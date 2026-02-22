import React, { createContext, useState, useContext, useEffect } from 'react';
import { updates, schedules } from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load notifications from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('notifications');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setNotifications(parsed);
        setUnreadCount(parsed.filter(n => !n.read).length);
      } catch (e) {
        console.error('Error parsing notifications:', e);
      }
    }
  }, []);

  // Save notifications to localStorage
  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
    setUnreadCount(notifications.filter(n => !n.read).length);
  }, [notifications]);

  // Fetch real notifications
  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        // Get failed jobs
        const jobsRes = await updates.getDeviceHistory?.('all');
        const failedJobs = jobsRes?.data?.jobs?.filter(j => j.currentState === 'failed') || [];
        
        // Get pending schedules
        const schedulesRes = await schedules.getAll({ status: 'pending_approval' });
        const pendingSchedules = schedulesRes.data.schedules || [];

        // Get in-progress schedules
        const activeRes = await schedules.getAll({ status: 'in_progress' });
        const activeSchedules = activeRes.data.schedules || [];

        const newNotifications = [];

        // Add failed job notifications
        failedJobs.slice(0, 3).forEach(job => {
          newNotifications.push({
            id: `failed-${job._id}`,
            type: 'error',
            title: 'Update Failed',
            message: `Device ${job.deviceImei?.slice(-4)} failed to update`,
            timestamp: new Date(job.updatedAt).toISOString(),
            read: false,
            actionable: true,
            action: 'view',
            data: { jobId: job._id, deviceImei: job.deviceImei }
          });
        });

        // Add pending approval notifications
        pendingSchedules.forEach(schedule => {
          newNotifications.push({
            id: `pending-${schedule._id}`,
            type: 'warning',
            title: 'Schedule Pending Approval',
            message: `"${schedule.name}" requires your approval`,
            timestamp: new Date(schedule.createdAt).toISOString(),
            read: false,
            actionable: true,
            action: 'approve',
            data: { scheduleId: schedule._id }
          });
        });

        // Add in-progress notifications
        activeSchedules.slice(0, 2).forEach(schedule => {
          newNotifications.push({
            id: `progress-${schedule._id}`,
            type: 'info',
            title: 'Update In Progress',
            message: `"${schedule.name}" is ${schedule.stats?.completedDevices || 0}/${schedule.stats?.totalDevices || 0} complete`,
            timestamp: new Date(schedule.updatedAt).toISOString(),
            read: false,
            actionable: true,
            action: 'view',
            data: { scheduleId: schedule._id }
          });
        });

        // Merge with existing notifications, avoiding duplicates
        setNotifications(prev => {
          const existingIds = new Set(prev.map(n => n.id));
          const uniqueNew = newNotifications.filter(n => !existingIds.has(n.id));
          return [...uniqueNew, ...prev].slice(0, 20);
        });

      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const handleNotificationAction = (notification) => {
    markAsRead(notification.id);
    
    switch(notification.action) {
      case 'approve':
        window.location.href = `/schedules?id=${notification.data.scheduleId}`;
        break;
      case 'view':
        if (notification.data.deviceImei) {
          window.location.href = `/devices?imei=${notification.data.deviceImei}`;
        } else if (notification.data.scheduleId) {
          window.location.href = `/schedules?id=${notification.data.scheduleId}`;
        }
        break;
      default:
        break;
    }
  };

  const value = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    handleNotificationAction
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};