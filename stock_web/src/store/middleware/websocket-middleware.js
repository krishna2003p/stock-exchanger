// src/store/middleware/websocket-middleware.js
import { wsManager } from '../../lib/websocket-manager.js';
import { vendorManager } from '../../lib/vendors/websocket-vendor-manager.js';
import { 
  connectWebSocket,
  disconnectWebSocket,
  sendMessage,
  connectionEstablished,
  connectionClosed,
  connectionError,
  messageReceived
} from '../slices/websocket-slice.js';
import { 
  botUpdated,
  botAlertReceived,
  tradeExecuted
} from '../slices/bots-slice.js';
import { 
  priceUpdated,
  marketDataReceived
} from '../slices/market-data-slice.js';
import { 
  notificationReceived
} from '../slices/notifications-slice.js';
import { VENDOR_IDS, MESSAGE_TYPES } from '../../utils/constants.js';

export const websocketMiddleware = (store) => (next) => (action) => {
  const result = next(action);

  switch (action.type) {
    case connectWebSocket.type:
      handleConnect(store, action.payload);
      break;
      
    case disconnectWebSocket.type:
      handleDisconnect(store, action.payload);
      break;
      
    case sendMessage.type:
      handleSendMessage(store, action.payload);
      break;
  }

  return result;
};

// Connection handler
const handleConnect = async (store, { connectionId, url, options = {} }) => {
  const { dispatch } = store;

  try {
    console.log(`🔌 Middleware: Connecting to ${connectionId}`);
    
    if (isVendorConnection(connectionId)) {
      // Handle vendor connections through VendorManager
      await vendorManager.connectVendor(connectionId, options);
    } else {
      // Handle regular WebSocket connections (like bot engine)
      await wsManager.connect(connectionId, url, {
        ...options,
        onConnect: () => {
          dispatch(connectionEstablished({ connectionId, url }));
        },
        onDisconnect: (event) => {
          dispatch(connectionClosed({ connectionId, event }));
        },
        onError: (error) => {
          dispatch(connectionError({ connectionId, error: error.message }));
        },
        onMessage: (data) => {
          dispatch(messageReceived({ connectionId, data }));
          routeMessage(dispatch, connectionId, data);
        }
      });

      // Set up global message routing for regular WebSockets
      wsManager.addGlobalHandler('onMessage', (connId, data) => {
        if (!isVendorConnection(connId)) {
          routeMessage(dispatch, connId, data);
        }
      });
    }

  } catch (error) {
    console.error(`❌ Connection failed for ${connectionId}:`, error);
    dispatch(connectionError({ connectionId, error: error.message }));
  }
};

// Disconnection handler
const handleDisconnect = async (store, { connectionId }) => {
  if (isVendorConnection(connectionId)) {
    await vendorManager.disconnectVendor(connectionId);
  } else {
    wsManager.disconnect(connectionId);
  }
  
  store.dispatch(connectionClosed({ connectionId }));
};

// Message sending handler
const handleSendMessage = (store, { connectionId, data }) => {
  let success = false;

  if (isVendorConnection(connectionId)) {
    // Handle vendor-specific messages
    success = handleVendorMessage(connectionId, data);
  } else {
    // Handle regular WebSocket messages
    success = wsManager.send(connectionId, data);
  }
  
  if (!success) {
    console.warn(`❌ Failed to send message to ${connectionId}:`, data);
  }
  
  return success;
};

// Vendor message handler
const handleVendorMessage = (connectionId, data) => {
  const messageType = data.type;

  switch (messageType) {
    case MESSAGE_TYPES.SUBSCRIBE_MARKET:
      return vendorManager.subscribeToMarketData(connectionId, data.symbols);
      
    case MESSAGE_TYPES.UNSUBSCRIBE_MARKET:
      return vendorManager.unsubscribeFromMarketData(connectionId, data.symbols);
      
    case MESSAGE_TYPES.SUBSCRIBE_NEWS:
      return vendorManager.subscribeToNews(connectionId, data.categories);
      
    case 'subscribe_broker_updates':
      return vendorManager.subscribeToBrokerUpdates(connectionId);
      
    default:
      // Try to send the message directly to the vendor
      const vendor = vendorManager.vendors.get(connectionId);
      if (vendor) {
        return vendor.send(data);
      }
      return false;
  }
};

// Message routing to appropriate slices
const routeMessage = (dispatch, connectionId, data) => {
  const messageType = data.type || data.event;

  if (process.env.NEXT_PUBLIC_DEBUG_WEBSOCKET === 'true') {
    console.log(`📨 Routing message from ${connectionId}:`, messageType, data);
  }

  switch (messageType) {
    // Bot-related messages
    case MESSAGE_TYPES.BOT_UPDATE:
    case 'bot_status_changed':
      dispatch(botUpdated({
        botId: data.bot_id,
        update: {
          ...data,
          timestamp: new Date(data.timestamp || Date.now()),
          connectionId
        }
      }));
      break;

    case MESSAGE_TYPES.BOT_ALERT:
    case 'bot_error':
      dispatch(botAlertReceived({
        botId: data.bot_id,
        alert: {
          id: `${data.bot_id}_${Date.now()}`,
          type: messageType,
          message: data.message || data.description,
          level: data.level || 'info',
          timestamp: new Date(data.timestamp || Date.now()),
          connectionId
        }
      }));
      break;

    case MESSAGE_TYPES.TRADE_EXECUTED:
      dispatch(tradeExecuted({
        botId: data.bot_id,
        trade: {
          id: data.trade_id || `trade_${Date.now()}`,
          symbol: data.symbol,
          side: data.side || data.action,
          quantity: data.quantity,
          price: data.price,
          timestamp: new Date(data.timestamp || Date.now()),
          connectionId
        }
      }));
      break;

    // Market data messages
    case MESSAGE_TYPES.MARKET_DATA:
    case MESSAGE_TYPES.PRICE_UPDATE:
      dispatch(priceUpdated({
        symbol: data.symbol,
        data: {
          ...data,
          timestamp: new Date(data.timestamp || Date.now()),
          change: calculateChange(data),
          changePercent: calculateChangePercent(data),
          connectionId,
          source: data.source || connectionId
        }
      }));
      break;

    case 'market_data_bulk':
      if (Array.isArray(data.prices)) {
        dispatch(marketDataReceived({
          data: data.prices.map(item => ({
            ...item,
            timestamp: new Date(item.timestamp || Date.now()),
            change: calculateChange(item),
            changePercent: calculateChangePercent(item),
            connectionId,
            source: item.source || connectionId
          })),
          connectionId
        }));
      }
      break;

    // News messages
    case MESSAGE_TYPES.NEWS_UPDATE:
      if (Array.isArray(data)) {
        // Multiple news items
        data.forEach(newsItem => {
          dispatch(notificationReceived({
            notification: {
              id: newsItem.id || `news_${Date.now()}`,
              type: 'news',
              title: newsItem.headline,
              message: newsItem.summary,
              level: 'info',
              timestamp: new Date(newsItem.datetime || Date.now()),
              read: false,
              connectionId,
              data: newsItem
            }
          }));
        });
      } else {
        // Single news item
        dispatch(notificationReceived({
          notification: {
            id: data.id || `news_${Date.now()}`,
            type: 'news',
            title: data.headline,
            message: data.summary,
            level: 'info',
            timestamp: new Date(data.datetime || Date.now()),
            read: false,
            connectionId,
            data
          }
        }));
      }
      break;

    // Order updates from brokers
    case 'order_update':
      dispatch(notificationReceived({
        notification: {
          id: `order_${data.orderId}_${Date.now()}`,
          type: 'order_update',
          title: `Order ${data.status}`,
          message: `${data.side} ${data.quantity} ${data.symbol} - ${data.status}`,
          level: data.status === 'EXECUTED' ? 'success' : 'info',
          timestamp: new Date(data.timestamp || Date.now()),
          read: false,
          connectionId,
          data
        }
      }));
      break;

    // System messages
    case MESSAGE_TYPES.PING:
      // Ping responses are handled by the WebSocket managers
      break;

    case MESSAGE_TYPES.PONG:
      // Pong responses are handled by the WebSocket managers
      break;

    case 'system_status':
      dispatch(notificationReceived({
        notification: {
          id: `system_${Date.now()}`,
          type: 'system',
          title: 'System Status Update',
          message: data.message || 'System status changed',
          level: data.level || 'info',
          timestamp: new Date(data.timestamp || Date.now()),
          read: false,
          connectionId,
          data
        }
      }));
      break;

    // Generic notification
    case 'notification':
    case 'alert':
      dispatch(notificationReceived({
        notification: {
          id: data.id || `notif_${Date.now()}`,
          type: data.type || 'notification',
          title: data.title || 'Notification',
          message: data.message,
          level: data.level || 'info',
          timestamp: new Date(data.timestamp || Date.now()),
          read: false,
          connectionId,
          data
        }
      }));
      break;

    default:
      if (process.env.NEXT_PUBLIC_DEBUG_WEBSOCKET === 'true') {
        console.log(`❓ Unhandled message type: ${messageType} from ${connectionId}`, data);
      }
  }
};

// Helper functions
const isVendorConnection = (connectionId) => {
  const vendorIds = Object.values(VENDOR_IDS);
  return vendorIds.includes(connectionId);
};

const calculateChange = (data) => {
  if (data.ltp && data.close) {
    return data.ltp - data.close;
  }
  if (data.change !== undefined) {
    return data.change;
  }
  return 0;
};

const calculateChangePercent = (data) => {
  if (data.changePercent !== undefined) {
    return data.changePercent;
  }
  if (data.ltp && data.close && data.close !== 0) {
    return ((data.ltp - data.close) / data.close) * 100;
  }
  return 0;
};
