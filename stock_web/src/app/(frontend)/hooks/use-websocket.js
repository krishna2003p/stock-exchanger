// src/hooks/use-websocket.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { wsManager } from '../lib/websocket-manager.js';

export function useWebSocket(connectionId, url, options = {}) {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [lastMessage, setLastMessage] = useState(null);
  const [error, setError] = useState(null);
  const [reconnectCount, setReconnectCount] = useState(0);
  
  const subscriptionsRef = useRef(new Set());
  const optionsRef = useRef(options);
  
  // Update options ref when options change
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Connection management
  const connect = useCallback(async () => {
    if (!url) return;

    try {
      setError(null);
      setConnectionStatus('connecting');
      
      await wsManager.connect(connectionId, url, optionsRef.current);
      setConnectionStatus('connected');
    } catch (err) {
      setError(err);
      setConnectionStatus('error');
    }
  }, [connectionId, url]);

  const disconnect = useCallback(() => {
    // Clean up subscriptions
    subscriptionsRef.current.forEach(unsubscribe => unsubscribe());
    subscriptionsRef.current.clear();
    
    wsManager.disconnect(connectionId);
    setConnectionStatus('disconnected');
  }, [connectionId]);

  const sendMessage = useCallback((data) => {
    return wsManager.send(connectionId, data);
  }, [connectionId]);

  const subscribe = useCallback((eventType, handler) => {
    const unsubscribe = wsManager.subscribe(connectionId, eventType, handler);
    subscriptionsRef.current.add(unsubscribe);
    
    // Return unsubscribe function that also removes from our ref
    return () => {
      unsubscribe();
      subscriptionsRef.current.delete(unsubscribe);
    };
  }, [connectionId]);

  // Global event handlers
  useEffect(() => {
    const handleConnect = (connId) => {
      if (connId === connectionId) {
        setConnectionStatus('connected');
        setError(null);
        setReconnectCount(prev => prev + 1);
      }
    };

    const handleDisconnect = (connId) => {
      if (connId === connectionId) {
        setConnectionStatus('disconnected');
      }
    };

    const handleError = (connId, err) => {
      if (connId === connectionId) {
        setError(err);
        setConnectionStatus('error');
      }
    };

    const handleMessage = (connId, data) => {
      if (connId === connectionId) {
        setLastMessage({
          data,
          timestamp: Date.now()
        });
      }
    };

    wsManager.addGlobalHandler('onConnect', handleConnect);
    wsManager.addGlobalHandler('onDisconnect', handleDisconnect);
    wsManager.addGlobalHandler('onError', handleError);
    wsManager.addGlobalHandler('onMessage', handleMessage);

    return () => {
      wsManager.removeGlobalHandler('onConnect', handleConnect);
      wsManager.removeGlobalHandler('onDisconnect', handleDisconnect);
      wsManager.removeGlobalHandler('onError', handleError);
      wsManager.removeGlobalHandler('onMessage', handleMessage);
    };
  }, [connectionId]);

  // Auto connect
  useEffect(() => {
    if (options.autoConnect !== false && url) {
      connect();
    }

    return () => {
      if (options.autoConnect !== false) {
        disconnect();
      }
    };
  }, [connect, disconnect, options.autoConnect, url]);

  return {
    connectionStatus,
    lastMessage,
    error,
    reconnectCount,
    connect,
    disconnect,
    sendMessage,
    subscribe,
    isConnected: connectionStatus === 'connected',
    isConnecting: connectionStatus === 'connecting'
  };
}

// Specialized hook for bot updates
export function useBotWebSocket() {
  const [bots, setBots] = useState({});
  const [botAlerts, setBotAlerts] = useState([]);

  const botWsUrl = process.env.NEXT_PUBLIC_BOT_WS_URL || 'ws://localhost:8000/ws/bots';
  
  const { connectionStatus, subscribe, sendMessage, isConnected } = useWebSocket(
    'bot_engine',
    botWsUrl,
    { 
      autoConnect: true,
      heartbeatInterval: 30000,
      reconnectAttempts: 5
    }
  );

  useEffect(() => {
    if (!isConnected) return;

    // Subscribe to bot status updates
    const unsubscribeBotUpdate = subscribe('bot_update', (data) => {
      setBots(prev => ({
        ...prev,
        [data.bot_id]: {
          ...prev[data.bot_id],
          ...data,
          lastUpdate: new Date(data.timestamp)
        }
      }));
    });

    // Subscribe to bot alerts
    const unsubscribeBotAlert = subscribe('bot_alert', (data) => {
      setBotAlerts(prev => [
        {
          id: `${data.bot_id}_${Date.now()}`,
          ...data,
          timestamp: new Date(data.timestamp)
        },
        ...prev.slice(0, 49) // Keep last 50 alerts
      ]);
    });

    // Subscribe to trade executions
    const unsubscribeTradeExecution = subscribe('trade_executed', (data) => {
      setBotAlerts(prev => [
        {
          id: `trade_${Date.now()}`,
          type: 'trade_executed',
          bot_id: data.bot_id,
          message: `${data.action} ${data.quantity} ${data.symbol} at ₹${data.price}`,
          ...data,
          timestamp: new Date(data.timestamp)
        },
        ...prev.slice(0, 49)
      ]);
    });

    return () => {
      unsubscribeBotUpdate();
      unsubscribeBotAlert();
      unsubscribeTradeExecution();
    };
  }, [isConnected, subscribe]);

  const startBot = useCallback((botId, config = {}) => {
    return sendMessage({
      type: 'start_bot',
      bot_id: botId,
      config,
      timestamp: new Date().toISOString()
    });
  }, [sendMessage]);

  const stopBot = useCallback((botId) => {
    return sendMessage({
      type: 'stop_bot',
      bot_id: botId,
      timestamp: new Date().toISOString()
    });
  }, [sendMessage]);

  const updateBotConfig = useCallback((botId, config) => {
    return sendMessage({
      type: 'update_bot_config',
      bot_id: botId,
      config,
      timestamp: new Date().toISOString()
    });
  }, [sendMessage]);

  return {
    bots,
    botAlerts,
    connectionStatus,
    isConnected,
    startBot,
    stopBot,
    updateBotConfig
  };
}

// Specialized hook for market data
export function useMarketWebSocket() {
  const [marketData, setMarketData] = useState({});
  const [subscriptions, setSubscriptions] = useState(new Set());

  const marketWsUrl = process.env.NEXT_PUBLIC_MARKET_WS_URL || 'ws://localhost:3001/market';
  
  const { connectionStatus, subscribe, sendMessage, isConnected } = useWebSocket(
    'market_data',
    marketWsUrl,
    { 
      autoConnect: true,
      heartbeatInterval: 10000,
      reconnectAttempts: 10
    }
  );

  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = subscribe('market_data', (data) => {
      setMarketData(prev => ({
        ...prev,
        [data.symbol]: {
          ...data,
          timestamp: new Date(data.timestamp),
          change: data.ltp - data.close,
          changePercent: ((data.ltp - data.close) / data.close) * 100
        }
      }));
    });

    return unsubscribe;
  }, [isConnected, subscribe]);

  const subscribeToSymbol = useCallback((symbol) => {
    if (subscriptions.has(symbol)) return;

    const success = sendMessage({
      type: 'subscribe',
      symbol: symbol.toUpperCase(),
      timestamp: new Date().toISOString()
    });

    if (success) {
      setSubscriptions(prev => new Set([...prev, symbol]));
    }

    return success;
  }, [sendMessage, subscriptions]);

  const unsubscribeFromSymbol = useCallback((symbol) => {
    if (!subscriptions.has(symbol)) return;

    const success = sendMessage({
      type: 'unsubscribe',
      symbol: symbol.toUpperCase(),
      timestamp: new Date().toISOString()
    });

    if (success) {
      setSubscriptions(prev => {
        const newSet = new Set(prev);
        newSet.delete(symbol);
        return newSet;
      });
    }

    return success;
  }, [sendMessage, subscriptions]);

  const subscribeToMultiple = useCallback((symbols) => {
    const results = symbols.map(symbol => subscribeToSymbol(symbol));
    return results.every(result => result);
  }, [subscribeToSymbol]);

  return {
    marketData,
    subscriptions: [...subscriptions],
    connectionStatus,
    isConnected,
    subscribeToSymbol,
    unsubscribeFromSymbol,
    subscribeToMultiple
  };
}

// Hook for general real-time notifications
export function useNotificationWebSocket(userId) {
  const [notifications, setNotifications] = useState([]);

  const notificationWsUrl = `${process.env.NEXT_PUBLIC_WS_URL}/notifications/${userId}`;
  
  const { connectionStatus, subscribe, isConnected } = useWebSocket(
    `notifications_${userId}`,
    notificationWsUrl,
    { 
      autoConnect: !!userId,
      heartbeatInterval: 30000
    }
  );

  useEffect(() => {
    if (!isConnected || !userId) return;

    const unsubscribe = subscribe('notification', (data) => {
      setNotifications(prev => [
        {
          id: `notif_${Date.now()}`,
          ...data,
          timestamp: new Date(data.timestamp),
          read: false
        },
        ...prev.slice(0, 99) // Keep last 100 notifications
      ]);
    });

    return unsubscribe;
  }, [isConnected, subscribe, userId]);

  const markAsRead = useCallback((notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    );
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    unreadCount: notifications.filter(n => !n.read).length,
    connectionStatus,
    isConnected,
    markAsRead,
    clearAll
  };
}
