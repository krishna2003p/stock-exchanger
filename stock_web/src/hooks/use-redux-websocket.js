// src/hooks/use-redux-websocket.js
import { useEffect, useCallback } from 'react';
import { 
  useAppDispatch, 
  useAppSelector,
  useConnectionStatus,
  useIsConnected,
  useAreAllConnected
} from './use-redux-store.js';
import { 
  connectWebSocket,
  disconnectWebSocket,
  sendMessage
} from '../store/slices/websocket-slice.js';
import {
  fetchUserBots,
  startBotRequested,
  startBotCompleted,
  stopBotRequested,
  stopBotCompleted
} from '../store/slices/bots-slice.js';
import {
  symbolSubscribed,
  symbolUnsubscribed,
  bulkSubscribe
} from '../store/slices/market-data-slice.js';
import { VENDOR_IDS, MESSAGE_TYPES } from '../utils/constants.js';

// Main WebSocket hook
export function useWebSocket() {
  const dispatch = useAppDispatch();
  
  const connectionStates = useAppSelector(state => state.websocket.connections);
  const globalStatus = useAppSelector(state => state.websocket.status.globalStatus);
  const areAllConnected = useAreAllConnected();

  const connect = useCallback((connectionId, url, options = {}) => {
    dispatch(connectWebSocket({ connectionId, url, options }));
  }, [dispatch]);

  const disconnect = useCallback((connectionId) => {
    dispatch(disconnectWebSocket({ connectionId }));
  }, [dispatch]);

  const send = useCallback((connectionId, data) => {
    dispatch(sendMessage({ connectionId, data }));
  }, [dispatch]);

  const getConnectionStatus = useCallback((connectionId) => {
    return connectionStates[connectionId]?.status || 'disconnected';
  }, [connectionStates]);

  const isConnected = useCallback((connectionId) => {
    return connectionStates[connectionId]?.status === 'connected';
  }, [connectionStates]);

  return {
    connectionStates,
    globalStatus,
    areAllConnected,
    connect,
    disconnect,
    send,
    getConnectionStatus,
    isConnected
  };
}

// Bot WebSocket hook
export function useBotWebSocket(userId) {
  const dispatch = useAppDispatch();
  const { connect, disconnect, send } = useWebSocket();

  // Selectors
  const userBots = useAppSelector(state => state.bots.userBots);
  const realTimeUpdates = useAppSelector(state => state.bots.realTimeUpdates);
  const botAlerts = useAppSelector(state => state.bots.alerts);
  const botsLoading = useAppSelector(state => state.bots.loading);
  const botEngineConnected = useIsConnected(VENDOR_IDS.BOT_ENGINE);
  const startingBots = useAppSelector(state => state.bots.operations.starting);
  const stoppingBots = useAppSelector(state => state.bots.operations.stopping);

  // Initialize connection and fetch bots
  useEffect(() => {
    if (userId) {
      // Connect to bot engine
      const botWsUrl = process.env.NEXT_PUBLIC_BOT_WS_URL || 'ws://localhost:8000/ws/bots';
      connect(VENDOR_IDS.BOT_ENGINE, botWsUrl, {
        heartbeatInterval: 30000,
        reconnectAttempts: 5,
        autoReconnect: true
      });

      // Fetch user bots
      dispatch(fetchUserBots(userId));
    }

    return () => {
      if (userId) {
        disconnect(VENDOR_IDS.BOT_ENGINE);
      }
    };
  }, [userId, connect, disconnect, dispatch]);

  // Bot control functions
  const startBot = useCallback((botId, config = {}) => {
    if (!botEngineConnected) {
      console.warn('Bot engine not connected');
      return false;
    }

    dispatch(startBotRequested({ botId }));
    
    const success = send(VENDOR_IDS.BOT_ENGINE, {
      type: MESSAGE_TYPES.START_BOT,
      bot_id: botId,
      config,
      timestamp: new Date().toISOString()
    });

    if (success) {
      // Set timeout for completion
      setTimeout(() => {
        dispatch(startBotCompleted({ botId, success: true }));
      }, 10000); // 10 second timeout
    } else {
      dispatch(startBotCompleted({ botId, success: false }));
    }

    return success;
  }, [dispatch, send, botEngineConnected]);

  const stopBot = useCallback((botId) => {
    if (!botEngineConnected) {
      console.warn('Bot engine not connected');
      return false;
    }

    dispatch(stopBotRequested({ botId }));
    
    const success = send(VENDOR_IDS.BOT_ENGINE, {
      type: MESSAGE_TYPES.STOP_BOT,
      bot_id: botId,
      timestamp: new Date().toISOString()
    });

    if (success) {
      setTimeout(() => {
        dispatch(stopBotCompleted({ botId, success: true }));
      }, 10000);
    } else {
      dispatch(stopBotCompleted({ botId, success: false }));
    }

    return success;
  }, [dispatch, send, botEngineConnected]);

  const updateBotConfig = useCallback((botId, config) => {
    if (!botEngineConnected) {
      console.warn('Bot engine not connected');
      return false;
    }

    return send(VENDOR_IDS.BOT_ENGINE, {
      type: 'update_bot_config',
      bot_id: botId,
      config,
      timestamp: new Date().toISOString()
    });
  }, [send, botEngineConnected]);

  const restartBot = useCallback((botId) => {
    if (!botEngineConnected) {
      console.warn('Bot engine not connected');
      return false;
    }

    return send(VENDOR_IDS.BOT_ENGINE, {
      type: 'restart_bot',
      bot_id: botId,
      timestamp: new Date().toISOString()
    });
  }, [send, botEngineConnected]);

  // Enhanced bot data with real-time updates
  const botsWithRealTime = userBots.map(bot => {
    const realTimeData = realTimeUpdates[bot.id];
    return {
      ...bot,
      currentStatus: realTimeData?.status || bot.status,
      realTimeData,
      isStarting: startingBots.includes(bot.id),
      isStopping: stoppingBots.includes(bot.id)
    };
  });

  return {
    // Data
    userBots: botsWithRealTime,
    realTimeUpdates,
    botAlerts,
    
    // State
    loading: botsLoading,
    connected: botEngineConnected,
    
    // Actions
    startBot,
    stopBot,
    updateBotConfig,
    restartBot,
    refreshBots: () => dispatch(fetchUserBots(userId))
  };
}

// Market Data WebSocket hook
export function useMarketWebSocket() {
  const dispatch = useAppDispatch();
  const { connect, disconnect, send } = useWebSocket();

  // Selectors
  const prices = useAppSelector(state => state.marketData.prices);
  const subscriptions = useAppSelector(state => [...state.marketData.subscriptions]);
  const vendorStatus = useAppSelector(state => state.marketData.vendorStatus);

  // Get connection status for market data vendors
  const yahooConnected = useIsConnected(VENDOR_IDS.YAHOO_FINANCE);
  const alphaVantageConnected = useIsConnected(VENDOR_IDS.ALPHA_VANTAGE);
  const iciciConnected = useIsConnected(VENDOR_IDS.ICICI_BREEZE);

  const marketConnected = yahooConnected || alphaVantageConnected || iciciConnected;

  // Initialize connections
  useEffect(() => {
    // Connect to available market data vendors
    const vendors = [
      { id: VENDOR_IDS.YAHOO_FINANCE, priority: 1 },
      { id: VENDOR_IDS.ALPHA_VANTAGE, priority: 2 },
      { id: VENDOR_IDS.ICICI_BREEZE, priority: 1 }
    ];

    vendors.forEach(vendor => {
      connect(vendor.id, '', { priority: vendor.priority });
    });

    return () => {
      vendors.forEach(vendor => {
        disconnect(vendor.id);
      });
    };
  }, [connect, disconnect]);

  // Subscription management
  const subscribeToSymbol = useCallback((symbol, preferredVendor = VENDOR_IDS.YAHOO_FINANCE) => {
    const symbolUpper = symbol.toUpperCase();
    const isAlreadySubscribed = subscriptions.includes(symbolUpper);
    
    if (isAlreadySubscribed) {
      return true;
    }

    const success = send(preferredVendor, {
      type: MESSAGE_TYPES.SUBSCRIBE_MARKET,
      symbols: [symbolUpper]
    });

    if (success) {
      dispatch(symbolSubscribed({ symbol: symbolUpper, vendor: preferredVendor }));
    }

    return success;
  }, [dispatch, send, subscriptions]);

  const unsubscribeFromSymbol = useCallback((symbol, vendor = VENDOR_IDS.YAHOO_FINANCE) => {
    const symbolUpper = symbol.toUpperCase();
    
    const success = send(vendor, {
      type: MESSAGE_TYPES.UNSUBSCRIBE_MARKET,
      symbols: [symbolUpper]
    });

    if (success) {
      dispatch(symbolUnsubscribed({ symbol: symbolUpper }));
    }

    return success;
  }, [dispatch, send]);

  const subscribeToMultiple = useCallback((symbols, preferredVendor = VENDOR_IDS.YAHOO_FINANCE) => {
    const symbolsUpper = symbols.map(s => s.toUpperCase());
    const newSymbols = symbolsUpper.filter(s => !subscriptions.includes(s));
    
    if (newSymbols.length === 0) {
      return true;
    }

    const success = send(preferredVendor, {
      type: MESSAGE_TYPES.SUBSCRIBE_MARKET,
      symbols: newSymbols
    });

    if (success) {
      dispatch(bulkSubscribe({ symbols: newSymbols, vendor: preferredVendor }));
    }

    return success;
  }, [dispatch, send, subscriptions]);

  const getPrice = useCallback((symbol) => {
    return prices[symbol?.toUpperCase()];
  }, [prices]);

  const isPriceStale = useCallback((symbol, maxAgeSeconds = 60) => {
    const price = prices[symbol?.toUpperCase()];
    if (!price || !price.timestamp) return true;
    
    const age = (Date.now() - new Date(price.timestamp).getTime()) / 1000;
    return age > maxAgeSeconds;
  }, [prices]);

  const switchVendor = useCallback((fromVendor, toVendor, symbols) => {
    // Unsubscribe from current vendor
    send(fromVendor, {
      type: MESSAGE_TYPES.UNSUBSCRIBE_MARKET,
      symbols
    });

    // Subscribe to new vendor
    send(toVendor, {
      type: MESSAGE_TYPES.SUBSCRIBE_MARKET,
      symbols
    });
  }, [send]);

  return {
    // Data
    prices,
    subscriptions,
    vendorStatus,
    
    // State
    connected: marketConnected,
    yahooConnected,
    alphaVantageConnected,
    iciciConnected,
    
    // Actions
    subscribeToSymbol,
    unsubscribeFromSymbol,
    subscribeToMultiple,
    switchVendor,
    
    // Utilities
    getPrice,
    isPriceStale,
    isSubscribed: (symbol) => subscriptions.includes(symbol?.toUpperCase())
  };
}

// Notifications hook
export function useNotifications(userId) {
  const dispatch = useAppDispatch();
  const { connect, disconnect } = useWebSocket();

  // Selectors
  const notifications = useAppSelector(state => state.notifications.notifications);
  const unreadCount = useAppSelector(state => state.notifications.unreadCount);
  const settings = useAppSelector(state => state.notifications.settings);
  const notificationConnected = useIsConnected(`notifications_${userId}`);

  // Initialize connection
  useEffect(() => {
    if (userId) {
      const notificationWsUrl = `${process.env.NEXT_PUBLIC_WS_URL}/notifications/${userId}`;
      connect(`notifications_${userId}`, notificationWsUrl, {
        heartbeatInterval: 30000,
        reconnectAttempts: 5
      });
    }

    return () => {
      if (userId) {
        disconnect(`notifications_${userId}`);
      }
    };
  }, [userId, connect, disconnect]);

  // Request desktop notification permission
  useEffect(() => {
    if (settings.enableDesktop && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, [settings.enableDesktop]);

  const markAsRead = useCallback((notificationId) => {
    dispatch({ type: 'notifications/markAsRead', payload: { notificationId } });
  }, [dispatch]);

  const markAllAsRead = useCallback(() => {
    dispatch({ type: 'notifications/markAllAsRead' });
  }, [dispatch]);

  const deleteNotification = useCallback((notificationId) => {
    dispatch({ type: 'notifications/deleteNotification', payload: { notificationId } });
  }, [dispatch]);

  const updateSettings = useCallback((newSettings) => {
    dispatch({ type: 'notifications/updateNotificationSettings', payload: newSettings });
  }, [dispatch]);

  return {
    // Data
    notifications,
    unreadCount,
    settings,
    
    // State
    connected: notificationConnected,
    
    // Actions
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updateSettings
  };
}
