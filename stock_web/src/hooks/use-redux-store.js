// src/hooks/use-redux-store.js
import { useSelector, useDispatch } from 'react-redux';

// Custom hooks for Redux usage
export function useAppDispatch() {
  return useDispatch();
}

export function useAppSelector(selector) {
  return useSelector(selector);
}

// Helper hooks for specific state slices
export function useWebSocketState() {
  return useAppSelector((state) => state.websocket);
}

export function useBotsState() {
  return useAppSelector((state) => state.bots);
}

export function useMarketDataState() {
  return useAppSelector((state) => state.marketData);
}

export function useNotificationsState() {
  return useAppSelector((state) => state.notifications);
}

export function useUIState() {
  return useAppSelector((state) => state.ui);
}

// WebSocket connection status helpers
export function useConnectionStatus(connectionId) {
  return useAppSelector((state) => 
    state.websocket.connections[connectionId]?.status || 'disconnected'
  );
}

export function useIsConnected(connectionId) {
  return useAppSelector((state) => 
    state.websocket.connections[connectionId]?.status === 'connected'
  );
}

export function useAreAllConnected() {
  return useAppSelector((state) => 
    state.websocket.status.globalStatus === 'connected'
  );
}

export function useConnectionStatistics() {
  return useAppSelector((state) => state.websocket.statistics);
}

// Bot-specific helpers
export function useBotById(botId) {
  return useAppSelector((state) => 
    state.bots.userBots.find(bot => bot.id === botId)
  );
}

export function useBotRealTimeData(botId) {
  return useAppSelector((state) => 
    state.bots.realTimeUpdates[botId]
  );
}

export function useIsBotStarting(botId) {
  return useAppSelector((state) => 
    state.bots.operations.starting.includes(botId)
  );
}

export function useIsBotStopping(botId) {
  return useAppSelector((state) => 
    state.bots.operations.stopping.includes(botId)
  );
}

export function useBotStatistics() {
  return useAppSelector((state) => state.bots.statistics);
}

export function useFilteredBots() {
  return useAppSelector((state) => {
    const { userBots, filters, realTimeUpdates } = state.bots;
    
    let filtered = [...userBots];
    
    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(bot => {
        const realTimeData = realTimeUpdates[bot.id];
        const currentStatus = realTimeData?.status || bot.status;
        return currentStatus.toLowerCase() === filters.status.toLowerCase();
      });
    }
    
    // Strategy filter
    if (filters.strategy !== 'all') {
      filtered = filtered.filter(bot => bot.strategyType === filters.strategy);
    }
    
    // Sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (filters.sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'created':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'lastRun':
          aValue = new Date(a.lastRun || 0);
          bValue = new Date(b.lastRun || 0);
          break;
        case 'pnl':
          const aPnl = realTimeUpdates[a.id]?.performance?.totalPnL || 0;
          const bPnl = realTimeUpdates[b.id]?.performance?.totalPnL || 0;
          aValue = aPnl;
          bValue = bPnl;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }
      
      if (aValue < bValue) return filters.sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return filters.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    return filtered;
  });
}

// Market data helpers
export function useMarketPrice(symbol) {
  return useAppSelector((state) => 
    state.marketData.prices[symbol?.toUpperCase()]
  );
}

export function useIsSymbolSubscribed(symbol) {
  return useAppSelector((state) => 
    state.marketData.subscriptions.has(symbol?.toUpperCase())
  );
}

export function useMarketDataStatistics() {
  return useAppSelector((state) => state.marketData.statistics);
}

export function useTopMovers(direction = 'up', limit = 10) {
  return useAppSelector((state) => {
    const performance = state.marketData.performance;
    
    switch (direction) {
      case 'up':
        return performance.topGainers.slice(0, limit);
      case 'down':
        return performance.topLosers.slice(0, limit);
      case 'active':
        return performance.mostActive.slice(0, limit);
      default:
        return performance.topGainers.slice(0, limit);
    }
  });
}

export function useVendorDataSources() {
  return useAppSelector((state) => state.marketData.vendorData);
}

// Notification helpers
export function useUnreadNotificationsCount() {
  return useAppSelector((state) => state.notifications.unreadCount);
}

export function useNotificationsByType(type) {
  return useAppSelector((state) => 
    state.notifications.notifications.filter(n => {
      const category = getCategoryFromType(n.type);
      return category === type;
    })
  );
}

export function useFilteredNotifications() {
  return useAppSelector((state) => {
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
  });
}

// Helper function
const getCategoryFromType = (type) => {
  if (['bot', 'bot_alert', 'bot_update'].includes(type)) return 'bot';
  if (['trade', 'trade_executed', 'order_update'].includes(type)) return 'trade';
  if (['market', 'market_data', 'price_alert'].includes(type)) return 'market';
  if (['news', 'news_update'].includes(type)) return 'news';
  return 'system';
};

// UI state helpers
export function useTheme() {
  return useAppSelector((state) => state.ui?.theme || 'light');
}

export function useSidebarCollapsed() {
  return useAppSelector((state) => state.ui?.sidebarCollapsed || false);
}

export function useModalOpen(modalName) {
  return useAppSelector((state) => state.ui?.modals?.[modalName] || false);
}

export function useIsLoading(section) {
  return useAppSelector((state) => state.ui?.loading?.[section] || false);
}

export function useError(section) {
  return useAppSelector((state) => state.ui?.errors?.[section] || null);
}
