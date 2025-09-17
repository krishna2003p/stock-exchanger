// src/utils/constants.js
export const VENDOR_TYPES = {
  MARKET_DATA: 'market_data',
  BROKER: 'broker',
  NEWS: 'news'
};

export const VENDOR_IDS = {
  // Market Data
  YAHOO_FINANCE: 'yahoo_finance',
  ALPHA_VANTAGE: 'alpha_vantage',
  
  // Brokers
  ICICI_BREEZE: 'icici_breeze',
  ZERODHA_KITE: 'zerodha_kite',
  ANGEL_ONE: 'angel_one',
  
  // News
  FINNHUB_NEWS: 'finnhub_news',
  
  // Internal
  BOT_ENGINE: 'bot_engine'
};

export const CONNECTION_STATUS = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ERROR: 'error',
  RECONNECTING: 'reconnecting'
};

export const MESSAGE_TYPES = {
  // Market Data
  MARKET_DATA: 'market_data',
  PRICE_UPDATE: 'price_update',
  SUBSCRIBE_MARKET: 'subscribe_market_data',
  UNSUBSCRIBE_MARKET: 'unsubscribe_market_data',
  
  // Bot Messages
  BOT_UPDATE: 'bot_update',
  BOT_ALERT: 'bot_alert',
  TRADE_EXECUTED: 'trade_executed',
  START_BOT: 'start_bot',
  STOP_BOT: 'stop_bot',
  
  // News
  NEWS_UPDATE: 'news_update',
  SUBSCRIBE_NEWS: 'subscribe_news',
  
  // System
  PING: 'ping',
  PONG: 'pong',
  HEARTBEAT: 'heartbeat'
};

export const DEFAULT_SYMBOLS = [
  'RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK',
  'HINDUNILVR', 'ITC', 'LT', 'SBIN', 'BHARTIARTL'
];

export const VENDOR_CONFIGS = {
  [VENDOR_IDS.YAHOO_FINANCE]: {
    type: VENDOR_TYPES.MARKET_DATA,
    wsUrl: process.env.NEXT_PUBLIC_YAHOO_WS_URL,
    authRequired: false,
    heartbeatInterval: 30000,
    reconnectAttempts: 5,
    priority: 1
  },
  
  [VENDOR_IDS.ALPHA_VANTAGE]: {
    type: VENDOR_TYPES.MARKET_DATA,
    wsUrl: process.env.NEXT_PUBLIC_ALPHA_VANTAGE_WS_URL,
    authRequired: true,
    apiKey: process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY,
    heartbeatInterval: 30000,
    reconnectAttempts: 3,
    priority: 2
  },
  
  [VENDOR_IDS.ICICI_BREEZE]: {
    type: VENDOR_TYPES.BROKER,
    wsUrl: process.env.NEXT_PUBLIC_ICICI_WS_URL,
    authRequired: true,
    credentials: {
      appKey: process.env.NEXT_PUBLIC_ICICI_APP_KEY,
      appSecret: process.env.NEXT_PUBLIC_ICICI_APP_SECRET
    },
    heartbeatInterval: 30000,
    reconnectAttempts: 3,
    priority: 1
  },
  
  [VENDOR_IDS.ZERODHA_KITE]: {
    type: VENDOR_TYPES.BROKER,
    wsUrl: process.env.NEXT_PUBLIC_ZERODHA_WS_URL,
    authRequired: true,
    credentials: {
      apiKey: process.env.NEXT_PUBLIC_ZERODHA_API_KEY
    },
    heartbeatInterval: 25000,
    reconnectAttempts: 3,
    priority: 1
  },
  
  [VENDOR_IDS.ANGEL_ONE]: {
    type: VENDOR_TYPES.BROKER,
    wsUrl: process.env.NEXT_PUBLIC_ANGEL_WS_URL,
    authRequired: true,
    credentials: {
      clientId: process.env.NEXT_PUBLIC_ANGEL_CLIENT_ID,
      password: process.env.NEXT_PUBLIC_ANGEL_PASSWORD
    },
    heartbeatInterval: 30000,
    reconnectAttempts: 3,
    priority: 1
  },
  
  [VENDOR_IDS.FINNHUB_NEWS]: {
    type: VENDOR_TYPES.NEWS,
    wsUrl: process.env.NEXT_PUBLIC_FINNHUB_WS_URL,
    authRequired: true,
    apiKey: process.env.NEXT_PUBLIC_FINNHUB_API_KEY,
    heartbeatInterval: 30000,
    reconnectAttempts: 3,
    priority: 1
  },
  
  [VENDOR_IDS.BOT_ENGINE]: {
    type: 'internal',
    wsUrl: process.env.NEXT_PUBLIC_BOT_WS_URL,
    authRequired: false,
    heartbeatInterval: 30000,
    reconnectAttempts: 5,
    priority: 1
  }
};
