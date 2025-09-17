// src/store/slices/notifications-slice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  notifications: [],
  unreadCount: 0,
  settings: {
    enableSound: true,
    enableDesktop: true,
    enableBotAlerts: true,
    enableTradeAlerts: true,
    enableMarketAlerts: true,
    enableNewsAlerts: true,
    soundVolume: 0.5
  },
  filters: {
    level: 'all', // all, info, warning, error, success
    type: 'all',  // all, bot, trade, market, system, news
    read: 'all',   // all, read, unread
    source: 'all'  // all, vendor_id
  },
  categories: {
    bot: { count: 0, unread: 0 },
    trade: { count: 0, unread: 0 },
    market: { count: 0, unread: 0 },
    news: { count: 0, unread: 0 },
    system: { count: 0, unread: 0 }
  }
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    notificationReceived: (state, action) => {
      const { notification } = action.payload;
      
      // Check if notifications are enabled for this type
      const isEnabled = checkNotificationEnabled(state.settings, notification);
      
      if (isEnabled) {
        const newNotification = {
          ...notification,
          id: notification.id || `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          read: false,
          receivedAt: new Date().toISOString()
        };

        state.notifications.unshift(newNotification);

        // Keep only last 1000 notifications
        if (state.notifications.length > 1000) {
          state.notifications = state.notifications.slice(0, 1000);
        }

        // Update counts
        updateNotificationCounts(state);

        // Trigger browser/desktop notification if enabled
        if (state.settings.enableDesktop && typeof window !== 'undefined' && 'Notification' in window) {
          triggerDesktopNotification(notification);
        }

        // Play sound if enabled
        if (state.settings.enableSound) {
          playNotificationSound(notification.level, state.settings.soundVolume);
        }
      }
    },

    markAsRead: (state, action) => {
      const { notificationId } = action.payload;
      const notification = state.notifications.find(n => n.id === notificationId);
      
      if (notification && !notification.read) {
        notification.read = true;
        notification.readAt = new Date().toISOString();
        updateNotificationCounts(state);
      }
    },

    markAllAsRead: (state) => {
      state.notifications.forEach(notification => {
        if (!notification.read) {
          notification.read = true;
          notification.readAt = new Date().toISOString();
        }
      });
      updateNotificationCounts(state);
    },

    markMultipleAsRead: (state, action) => {
      const { notificationIds } = action.payload;
      
      state.notifications.forEach(notification => {
        if (notificationIds.includes(notification.id) && !notification.read) {
          notification.read = true;
          notification.readAt = new Date().toISOString();
        }
      });
      
      updateNotificationCounts(state);
    },

    markCategoryAsRead: (state, action) => {
      const { category } = action.payload;
      
      state.notifications.forEach(notification => {
        if (notification.type === category && !notification.read) {
          notification.read = true;
          notification.readAt = new Date().toISOString();
        }
      });
      
      updateNotificationCounts(state);
    },

    deleteNotification: (state, action) => {
      const { notificationId } = action.payload;
      const index = state.notifications.findIndex(n => n.id === notificationId);
      
      if (index !== -1) {
        state.notifications.splice(index, 1);
        updateNotificationCounts(state);
      }
    },

    deleteAllNotifications: (state) => {
      state.notifications = [];
      updateNotificationCounts(state);
    },

    deleteReadNotifications: (state) => {
      state.notifications = state.notifications.filter(n => !n.read);
      updateNotificationCounts(state);
    },

    deleteByCategory: (state, action) => {
      const { category } = action.payload;
      state.notifications = state.notifications.filter(n => n.type !== category);
      updateNotificationCounts(state);
    },

    deleteOldNotifications: (state, action) => {
      const { olderThanDays = 7 } = action.payload || {};
      const cutoffTime = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
      
      state.notifications = state.notifications.filter(notification => {
        const notificationTime = new Date(notification.timestamp || notification.receivedAt);
        return notificationTime >= cutoffTime;
      });
      
      updateNotificationCounts(state);
    },

    // Settings management
    updateNotificationSettings: (state, action) => {
      state.settings = {
        ...state.settings,
        ...action.payload
      };
    },

    toggleNotificationSetting: (state, action) => {
      const { setting } = action.payload;
      if (setting in state.settings) {
        state.settings[setting] = !state.settings[setting];
      }
    },

    updateSoundVolume: (state, action) => {
      const { volume } = action.payload;
      state.settings.soundVolume = Math.max(0, Math.min(1, volume));
    },

    // Filters
    updateFilters: (state, action) => {
      state.filters = {
        ...state.filters,
        ...action.payload
      };
    },

    resetFilters: (state) => {
      state.filters = {
        level: 'all',
        type: 'all',
        read: 'all',
        source: 'all'
      };
    },

    // Bulk operations
    bulkDeleteByType: (state, action) => {
      const { type } = action.payload;
      state.notifications = state.notifications.filter(n => n.type !== type);
      updateNotificationCounts(state);
    },

    bulkDeleteByLevel: (state, action) => {
      const { level } = action.payload;
      state.notifications = state.notifications.filter(n => n.level !== level);
      updateNotificationCounts(state);
    },

    bulkDeleteBySource: (state, action) => {
      const { source } = action.payload;
      state.notifications = state.notifications.filter(n => n.connectionId !== source);
      updateNotificationCounts(state);
    },

    // Priority notifications (always shown regardless of settings)
    priorityNotificationReceived: (state, action) => {
      const { notification } = action.payload;
      
      const priorityNotification = {
        ...notification,
        id: notification.id || `priority_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        read: false,
        priority: true,
        receivedAt: new Date().toISOString()
      };

      state.notifications.unshift(priorityNotification);

      if (state.notifications.length > 1000) {
        state.notifications = state.notifications.slice(0, 1000);
      }

      updateNotificationCounts(state);

      // Always trigger desktop notification for priority notifications
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        triggerDesktopNotification(notification);
      }

      // Always play sound for priority notifications
      playNotificationSound('priority', state.settings.soundVolume);
    },

    // Interaction tracking
    notificationClicked: (state, action) => {
      const { notificationId } = action.payload;
      const notification = state.notifications.find(n => n.id === notificationId);
      
      if (notification) {
        notification.clicked = true;
        notification.clickedAt = new Date().toISOString();
        
        // Mark as read if not already
        if (!notification.read) {
          notification.read = true;
          notification.readAt = new Date().toISOString();
          updateNotificationCounts(state);
        }
      }
    },

    // Snooze functionality
    snoozeNotification: (state, action) => {
      const { notificationId, duration } = action.payload; // duration in minutes
      const notification = state.notifications.find(n => n.id === notificationId);
      
      if (notification) {
        notification.snoozed = true;
        notification.snoozeUntil = new Date(Date.now() + duration * 60 * 1000).toISOString();
        notification.snoozedAt = new Date().toISOString();
      }
    },

    unsnoozeNotification: (state, action) => {
      const { notificationId } = action.payload;
      const notification = state.notifications.find(n => n.id === notificationId);
      
      if (notification) {
        delete notification.snoozed;
        delete notification.snoozeUntil;
        delete notification.snoozedAt;
      }
    },

    // Check and unsnooze expired notifications
    checkSnoozedNotifications: (state) => {
      const now = new Date();
      
      state.notifications.forEach(notification => {
        if (notification.snoozed && notification.snoozeUntil) {
          const snoozeEnd = new Date(notification.snoozeUntil);
          if (now >= snoozeEnd) {
            delete notification.snoozed;
            delete notification.snoozeUntil;
            delete notification.snoozedAt;
          }
        }
      });
    }
  }
});

// Helper functions
const checkNotificationEnabled = (settings, notification) => {
  switch (notification.type) {
    case 'bot':
    case 'bot_alert':
    case 'bot_update':
      return settings.enableBotAlerts;
    case 'trade':
    case 'trade_executed':
    case 'order_update':
      return settings.enableTradeAlerts;
    case 'market':
    case 'market_data':
    case 'price_alert':
      return settings.enableMarketAlerts;
    case 'news':
    case 'news_update':
      return settings.enableNewsAlerts;
    default:
      return true; // Enable system and other notifications by default
  }
};

const updateNotificationCounts = (state) => {
  // Reset counts
  Object.keys(state.categories).forEach(category => {
    state.categories[category] = { count: 0, unread: 0 };
  });
  
  let totalUnread = 0;
  
  state.notifications.forEach(notification => {
    const category = getCategoryFromType(notification.type);
    
    if (state.categories[category]) {
      state.categories[category].count++;
      if (!notification.read) {
        state.categories[category].unread++;
        totalUnread++;
      }
    } else if (!notification.read) {
      totalUnread++;
    }
  });
  
  state.unreadCount = totalUnread;
};

const getCategoryFromType = (type) => {
  if (['bot', 'bot_alert', 'bot_update'].includes(type)) return 'bot';
  if (['trade', 'trade_executed', 'order_update'].includes(type)) return 'trade';
  if (['market', 'market_data', 'price_alert'].includes(type)) return 'market';
  if (['news', 'news_update'].includes(type)) return 'news';
  return 'system';
};

const triggerDesktopNotification = (notification) => {
  if (Notification.permission === 'granted') {
    const options = {
      body: notification.message,
      icon: '/favicon.ico',
      tag: notification.id,
      requireInteraction: notification.level === 'error' || notification.priority,
      timestamp: new Date(notification.timestamp).getTime()
    };
    
    new Notification(notification.title || 'Trading Alert', options);
  }
};

const playNotificationSound = (level, volume = 0.5) => {
  if (typeof window === 'undefined') return;
  
  try {
    const audio = new Audio();
    
    switch (level) {
      case 'error':
        audio.src = '/sounds/error.mp3';
        break;
      case 'warning':
        audio.src = '/sounds/warning.mp3';
        break;
      case 'success':
        audio.src = '/sounds/success.mp3';
        break;
      case 'priority':
        audio.src = '/sounds/priority.mp3';
        break;
      default:
        audio.src = '/sounds/notification.mp3';
    }
    
    audio.volume = volume;
    audio.play().catch(() => {
      // Ignore errors if audio can't play
    });
  } catch (error) {
    // Ignore audio errors
  }
};

export const {
  notificationReceived,
  markAsRead,
  markAllAsRead,
  markMultipleAsRead,
  markCategoryAsRead,
  deleteNotification,
  deleteAllNotifications,
  deleteReadNotifications,
  deleteByCategory,
  deleteOldNotifications,
  updateNotificationSettings,
  toggleNotificationSetting,
  updateSoundVolume,
  updateFilters,
  resetFilters,
  bulkDeleteByType,
  bulkDeleteByLevel,
  bulkDeleteBySource,
  priorityNotificationReceived,
  notificationClicked,
  snoozeNotification,
  unsnoozeNotification,
  checkSnoozedNotifications
} = notificationsSlice.actions;

export default notificationsSlice.reducer;

// Selectors
export const selectAllNotifications = (state) => state.notifications.notifications;
export const selectUnreadCount = (state) => state.notifications.unreadCount;
export const selectNotificationSettings = (state) => state.notifications.settings;
export const selectNotificationFilters = (state) => state.notifications.filters;
export const selectNotificationCategories = (state) => state.notifications.categories;

export const selectFilteredNotifications = (state) => {
  const { notifications, filters } = state.notifications;
  
  return notifications.filter(notification => {
    // Skip snoozed notifications
    if (notification.snoozed) {
      const snoozeEnd = new Date(notification.snoozeUntil);
      if (new Date() < snoozeEnd) {
        return false;
      }
    }
    
    // Level filter
    if (filters.level !== 'all' && notification.level !== filters.level) {
      return false;
    }
    
    // Type filter
    if (filters.type !== 'all') {
      const category = getCategoryFromType(notification.type);
      if (category !== filters.type) {
        return false;
      }
    }
    
    // Read filter
    if (filters.read === 'read' && !notification.read) {
      return false;
    }
    if (filters.read === 'unread' && notification.read) {
      return false;
    }
    
    // Source filter
    if (filters.source !== 'all' && notification.connectionId !== filters.source) {
      return false;
    }
    
    return true;
  });
};

export const selectUnreadNotifications = (state) => 
  state.notifications.notifications.filter(n => !n.read);

export const selectNotificationsByType = (type) => (state) => 
  state.notifications.notifications.filter(n => getCategoryFromType(n.type) === type);

export const selectNotificationsByLevel = (level) => (state) => 
  state.notifications.notifications.filter(n => n.level === level);

export const selectRecentNotifications = (limit = 10) => (state) => 
  state.notifications.notifications.slice(0, limit);

export const selectPriorityNotifications = (state) => 
  state.notifications.notifications.filter(n => n.priority);

export const selectSnoozedNotifications = (state) => 
  state.notifications.notifications.filter(n => n.snoozed);
