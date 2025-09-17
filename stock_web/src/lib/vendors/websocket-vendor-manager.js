// src/lib/vendors/websocket-vendor-manager.js
import { store } from '../../store/index.js';
import { 
  connectionEstablished, 
  connectionClosed, 
  connectionError,
  messageReceived 
} from '../../store/slices/websocket-slice.js';
import { MarketDataVendor } from './market-data-vendor.js';
import { BrokerVendor } from './broker-vendor.js';
import { NewsVendor } from './news-vendor.js';
import { VENDOR_IDS, VENDOR_CONFIGS, VENDOR_TYPES } from '../../utils/constants.js';

class WebSocketVendorManager {
  constructor() {
    this.vendors = new Map();
    this.activeConnections = new Map();
    this.connectionConfigs = new Map();
    this.reconnectTimers = new Map();
    this.isInitialized = false;
    
    this.initializeVendors();
  }

  initializeVendors() {
    console.log('🏗️ Initializing WebSocket vendor instances...');
    
    // Market Data Vendors
    this.vendors.set(VENDOR_IDS.YAHOO_FINANCE, new MarketDataVendor(
      VENDOR_IDS.YAHOO_FINANCE, 
      {
        ...VENDOR_CONFIGS[VENDOR_IDS.YAHOO_FINANCE],
        dataTransform: MarketDataVendor.createYahooTransformer()
      }
    ));

    this.vendors.set(VENDOR_IDS.ALPHA_VANTAGE, new MarketDataVendor(
      VENDOR_IDS.ALPHA_VANTAGE, 
      {
        ...VENDOR_CONFIGS[VENDOR_IDS.ALPHA_VANTAGE],
        dataTransform: MarketDataVendor.createAlphaVantageTransformer()
      }
    ));

    // Broker Vendors
    this.vendors.set(VENDOR_IDS.ICICI_BREEZE, new BrokerVendor(
      VENDOR_IDS.ICICI_BREEZE, 
      {
        ...VENDOR_CONFIGS[VENDOR_IDS.ICICI_BREEZE],
        dataTransform: BrokerVendor.createIciciTransformer()
      }
    ));

    this.vendors.set(VENDOR_IDS.ZERODHA_KITE, new BrokerVendor(
      VENDOR_IDS.ZERODHA_KITE, 
      {
        ...VENDOR_CONFIGS[VENDOR_IDS.ZERODHA_KITE],
        dataTransform: BrokerVendor.createZerodhaTransformer()
      }
    ));

    this.vendors.set(VENDOR_IDS.ANGEL_ONE, new BrokerVendor(
      VENDOR_IDS.ANGEL_ONE, 
      {
        ...VENDOR_CONFIGS[VENDOR_IDS.ANGEL_ONE],
        dataTransform: this.createAngelTransformer()
      }
    ));

    // News Vendors
    this.vendors.set(VENDOR_IDS.FINNHUB_NEWS, new NewsVendor(
      VENDOR_IDS.FINNHUB_NEWS, 
      {
        ...VENDOR_CONFIGS[VENDOR_IDS.FINNHUB_NEWS],
        dataTransform: NewsVendor.createFinnhubTransformer()
      }
    ));

    this.isInitialized = true;
    console.log(`✅ Initialized ${this.vendors.size} vendor instances`);
  }

  async connectVendor(vendorId, options = {}) {
    const vendor = this.vendors.get(vendorId);
    if (!vendor) {
      throw new Error(`Unknown vendor: ${vendorId}`);
    }

    if (this.activeConnections.has(vendorId)) {
      const existing = this.activeConnections.get(vendorId);
      if (existing.isConnected) {
        console.log(`${vendorId} already connected`);
        return existing;
      }
    }

    try {
      console.log(`🔌 Connecting to vendor: ${vendorId}`);
      
      // Store connection config for reconnection
      this.connectionConfigs.set(vendorId, options);
      
      // Connect vendor with event handlers
      const connection = await vendor.connect({
        ...options,
        onOpen: (event) => this.handleVendorOpen(vendorId, event),
        onClose: (event) => this.handleVendorClose(vendorId, event),
        onError: (error) => this.handleVendorError(vendorId, error),
        onMessage: (data) => this.handleVendorMessage(vendorId, data)
      });

      this.activeConnections.set(vendorId, vendor);
      
      console.log(`✅ Successfully connected to ${vendorId}`);
      return connection;

    } catch (error) {
      console.error(`❌ Failed to connect to vendor ${vendorId}:`, error);
      
      // Dispatch error to Redux
      store.dispatch(connectionError({ 
        connectionId: vendorId, 
        error: error.message 
      }));
      
      throw error;
    }
  }

  async disconnectVendor(vendorId) {
    const vendor = this.vendors.get(vendorId);
    
    if (vendor) {
      console.log(`🔌 Disconnecting vendor: ${vendorId}`);
      
      await vendor.disconnect();
      this.activeConnections.delete(vendorId);
      this.connectionConfigs.delete(vendorId);
      
      // Clear reconnect timer
      if (this.reconnectTimers.has(vendorId)) {
        clearTimeout(this.reconnectTimers.get(vendorId));
        this.reconnectTimers.delete(vendorId);
      }
      
      console.log(`✅ Disconnected from vendor: ${vendorId}`);
    }
  }

  async connectAllVendors() {
    console.log('🚀 Connecting to all available vendors...');
    
    const connectionPromises = [];
    
    for (const [vendorId, config] of Object.entries(VENDOR_CONFIGS)) {
      // Skip if required credentials are missing
      if (this.areCredentialsAvailable(vendorId, config)) {
        connectionPromises.push(
          this.connectVendor(vendorId).catch(error => {
            console.warn(`Failed to connect to ${vendorId}:`, error.message);
            return null;
          })
        );
      } else {
        console.warn(`Skipping ${vendorId}: Missing required credentials`);
      }
    }

    const results = await Promise.allSettled(connectionPromises);
    const connected = results.filter(r => r.status === 'fulfilled' && r.value).length;
    
    console.log(`🎉 Connected to ${connected}/${connectionPromises.length} vendors`);
    
    return {
      total: connectionPromises.length,
      connected,
      failed: connectionPromises.length - connected
    };
  }

  areCredentialsAvailable(vendorId, config) {
    if (!config.authRequired) return true;
    
    switch (vendorId) {
      case VENDOR_IDS.ALPHA_VANTAGE:
        return !!config.apiKey && config.apiKey !== 'demo';
        
      case VENDOR_IDS.ICICI_BREEZE:
        return !!(config.credentials?.appKey && config.credentials?.appSecret);
        
      case VENDOR_IDS.ZERODHA_KITE:
        return !!config.credentials?.apiKey;
        
      case VENDOR_IDS.ANGEL_ONE:
        return !!(config.credentials?.clientId && config.credentials?.password);
        
      case VENDOR_IDS.FINNHUB_NEWS:
        return !!config.apiKey && config.apiKey !== 'demo';
        
      default:
        return true;
    }
  }

  // Market Data Operations
  subscribeToMarketData(vendorId, symbols) {
    const vendor = this.vendors.get(vendorId);
    if (vendor && vendor.subscribeToMarketData) {
      console.log(`📊 ${vendorId}: Subscribing to market data for`, symbols);
      return vendor.subscribeToMarketData(symbols);
    }
    console.warn(`Vendor ${vendorId} does not support market data subscription`);
    return false;
  }

  unsubscribeFromMarketData(vendorId, symbols) {
    const vendor = this.vendors.get(vendorId);
    if (vendor && vendor.unsubscribeFromMarketData) {
      console.log(`📊 ${vendorId}: Unsubscribing from market data for`, symbols);
      return vendor.unsubscribeFromMarketData(symbols);
    }
    return false;
  }

  // Broker Operations
  subscribeToBrokerUpdates(vendorId) {
    const vendor = this.vendors.get(vendorId);
    if (vendor && vendor.subscribeToBrokerUpdates) {
      console.log(`🏦 ${vendorId}: Subscribing to broker updates`);
      return vendor.subscribeToBrokerUpdates();
    }
    console.warn(`Vendor ${vendorId} does not support broker updates`);
    return false;
  }

  // News Operations
  subscribeToNews(vendorId, categories = []) {
    const vendor = this.vendors.get(vendorId);
    if (vendor && vendor.subscribeToNews) {
      console.log(`📰 ${vendorId}: Subscribing to news for categories`, categories);
      return vendor.subscribeToNews(categories);
    }
    console.warn(`Vendor ${vendorId} does not support news subscription`);
    return false;
  }

  // Event Handlers
  handleVendorOpen(vendorId, event) {
    console.log(`✅ Vendor ${vendorId} connected successfully`);
    
    // Dispatch to Redux
    store.dispatch(connectionEstablished({ 
      connectionId: vendorId, 
      url: this.vendors.get(vendorId).config.wsUrl 
    }));
    
    // Reset reconnect attempts
    const vendor = this.vendors.get(vendorId);
    if (vendor) {
      vendor.reconnectAttempts = 0;
    }
    
    // Auto-subscribe based on vendor type
    this.handleAutoSubscriptions(vendorId);
  }

  handleVendorClose(vendorId, event) {
    console.log(`❌ Vendor ${vendorId} disconnected:`, event.code, event.reason);
    
    // Dispatch to Redux
    store.dispatch(connectionClosed({ 
      connectionId: vendorId, 
      event: {
        code: event.code,
        reason: event.reason,
        timestamp: new Date().toISOString()
      }
    }));
    
    // Schedule reconnect if not intentional
    if (event.code !== 1000 && event.code !== 1001) {
      this.scheduleReconnect(vendorId);
    }
  }

  handleVendorError(vendorId, error) {
    console.error(`🔥 Vendor ${vendorId} error:`, error);
    
    // Dispatch to Redux
    store.dispatch(connectionError({ 
      connectionId: vendorId, 
      error: error.message || 'Unknown error',
      timestamp: new Date().toISOString()
    }));
  }

  handleVendorMessage(vendorId, data) {
    if (process.env.NEXT_PUBLIC_DEBUG_WEBSOCKET === 'true') {
      console.log(`📥 ${vendorId}:`, data);
    }

    // Dispatch to Redux for routing to appropriate slices
    store.dispatch(messageReceived({ 
      connectionId: vendorId, 
      data 
    }));
  }

  handleAutoSubscriptions(vendorId) {
    const config = VENDOR_CONFIGS[vendorId];
    if (!config) return;

    // Auto-subscribe to default symbols for market data vendors
    if (config.type === VENDOR_TYPES.MARKET_DATA) {
      const defaultSymbols = ['RELIANCE', 'TCS', 'INFY'];
      setTimeout(() => {
        this.subscribeToMarketData(vendorId, defaultSymbols);
      }, 2000); // Wait 2 seconds after connection
    }
    
    // Auto-subscribe to broker updates
    if (config.type === VENDOR_TYPES.BROKER) {
      setTimeout(() => {
        this.subscribeToBrokerUpdates(vendorId);
      }, 2000);
    }
    
    // Auto-subscribe to general news
    if (config.type === VENDOR_TYPES.NEWS) {
      setTimeout(() => {
        this.subscribeToNews(vendorId, ['general', 'market']);
      }, 2000);
    }
  }

  scheduleReconnect(vendorId) {
    const vendor = this.vendors.get(vendorId);
    if (!vendor) return;

    vendor.reconnectAttempts = (vendor.reconnectAttempts || 0) + 1;
    
    const maxAttempts = vendor.config.reconnectAttempts || 5;
    if (vendor.reconnectAttempts >= maxAttempts) {
      console.error(`❌ Max reconnect attempts (${maxAttempts}) reached for vendor ${vendorId}`);
      return;
    }

    const delay = Math.min(3000 * Math.pow(1.5, vendor.reconnectAttempts), 30000);
    console.log(`⏰ Scheduling reconnect for ${vendorId} in ${delay}ms (attempt ${vendor.reconnectAttempts}/${maxAttempts})`);

    const timer = setTimeout(() => {
      const config = this.connectionConfigs.get(vendorId);
      this.connectVendor(vendorId, config).catch(error => {
        console.error(`🔄 Reconnect failed for ${vendorId}:`, error.message);
      });
    }, delay);

    this.reconnectTimers.set(vendorId, timer);
  }

  // Status Methods
  getVendorStatus(vendorId) {
    const vendor = this.vendors.get(vendorId);
    if (!vendor) {
      return { 
        status: 'not_found',
        error: `Vendor ${vendorId} not found`
      };
    }
    
    return vendor.getStatus();
  }

  getAllVendorStatuses() {
    const statuses = {};
    this.vendors.forEach((vendor, vendorId) => {
      statuses[vendorId] = this.getVendorStatus(vendorId);
    });
    return statuses;
  }

  getConnectedVendors() {
    const connected = [];
    this.vendors.forEach((vendor, vendorId) => {
      if (vendor.isConnected) {
        connected.push(vendorId);
      }
    });
    return connected;
  }

  getVendorsByType(type) {
    const vendors = [];
    this.vendors.forEach((vendor, vendorId) => {
      const config = VENDOR_CONFIGS[vendorId];
      if (config && config.type === type) {
        vendors.push({
          id: vendorId,
          vendor,
          config,
          status: vendor.getStatus()
        });
      }
    });
    return vendors;
  }

  // Utility Methods
  async disconnectAll() {
    console.log('🔌 Disconnecting all vendors...');
    
    const disconnectPromises = [];
    this.activeConnections.forEach((vendor, vendorId) => {
      disconnectPromises.push(this.disconnectVendor(vendorId));
    });
    
    await Promise.all(disconnectPromises);
    console.log('✅ All vendors disconnected');
  }

  getHealthReport() {
    const statuses = this.getAllVendorStatuses();
    const total = Object.keys(statuses).length;
    const connected = Object.values(statuses).filter(s => s.isConnected).length;
    const authenticated = Object.values(statuses).filter(s => s.isAuthenticated).length;
    const hasErrors = Object.values(statuses).some(s => s.lastError);
    
    return {
      total,
      connected,
      authenticated,
      disconnected: total - connected,
      healthPercentage: total > 0 ? Math.round((connected / total) * 100) : 0,
      hasErrors,
      statuses,
      timestamp: new Date().toISOString()
    };
  }

  // Data Transformers
  createAngelTransformer() {
    return (rawData) => {
      try {
        const parsed = JSON.parse(rawData);
        
        // Angel One market data
        if (parsed.tk && parsed.lp) {
          return {
            type: 'market_data',
            symbol: this.getSymbolFromAngelToken(parsed.tk),
            ltp: parseFloat(parsed.lp),
            open: parseFloat(parsed.o) || 0,
            high: parseFloat(parsed.h) || 0,
            low: parseFloat(parsed.l) || 0,
            close: parseFloat(parsed.c) || 0,
            volume: parseInt(parsed.v) || 0,
            timestamp: new Date().toISOString(),
            source: VENDOR_IDS.ANGEL_ONE
          };
        }
        
        // Angel One order updates
        if (parsed.norenordno && parsed.stat) {
          return {
            type: 'order_update',
            orderId: parsed.norenordno,
            status: parsed.stat,
            symbol: parsed.tsym,
            side: parsed.trantype,
            quantity: parseInt(parsed.qty),
            price: parseFloat(parsed.prc),
            executedQuantity: parseInt(parsed.fillshares) || 0,
            timestamp: new Date().toISOString(),
            source: VENDOR_IDS.ANGEL_ONE
          };
        }
        
      } catch (error) {
        console.error('Error transforming Angel One data:', error);
      }
      return null;
    };
  }

  getSymbolFromAngelToken(token) {
    const angelTokenMap = {
      '2885': 'RELIANCE',
      '11536': 'TCS',
      '1594': 'INFY',
      '1333': 'HDFCBANK',
      '4963': 'ICICIBANK'
    };
    return angelTokenMap[token] || `ANGEL_${token}`;
  }
}

// Create singleton instance
export const vendorManager = new WebSocketVendorManager();
export default WebSocketVendorManager;
