// src/lib/vendors/market-data-vendor.js
import { BaseVendor } from './base-vendor.js';
import { VENDOR_IDS, MESSAGE_TYPES } from '../../utils/constants.js';

export class MarketDataVendor extends BaseVendor {
  constructor(vendorId, config) {
    super(vendorId, config);
    this.subscribedSymbols = new Set();
    this.symbolTokenMap = new Map();
    this.loadTokenMappings();
  }

  async authenticate() {
    switch (this.vendorId) {
      case VENDOR_IDS.ALPHA_VANTAGE:
        if (!this.config.apiKey) {
          throw new Error('Alpha Vantage API key required');
        }
        this.isAuthenticated = true;
        console.log(`${this.vendorId}: Authenticated with API key`);
        break;
        
      case VENDOR_IDS.YAHOO_FINANCE:
        // Yahoo Finance doesn't require authentication for basic WebSocket
        this.isAuthenticated = true;
        console.log(`${this.vendorId}: No authentication required`);
        break;
        
      default:
        this.isAuthenticated = true;
    }
  }

  sendInitialSubscriptions() {
    switch (this.vendorId) {
      case VENDOR_IDS.YAHOO_FINANCE:
        this.send({
          subscribe: ['heartbeat']
        });
        break;
        
      case VENDOR_IDS.ALPHA_VANTAGE:
        // Alpha Vantage requires immediate subscription
        this.send({
          function: 'REAL_TIME_STREAMING',
          apikey: this.config.apiKey
        });
        break;
    }
  }

  subscribeToMarketData(symbols) {
    if (!this.isConnected) {
      console.warn(`${this.vendorId}: Not connected, cannot subscribe`);
      return false;
    }

    const symbolsArray = Array.isArray(symbols) ? symbols : [symbols];
    const newSymbols = symbolsArray.filter(symbol => !this.subscribedSymbols.has(symbol));
    
    if (newSymbols.length === 0) {
      console.log(`${this.vendorId}: Already subscribed to all symbols`);
      return true;
    }

    console.log(`${this.vendorId}: Subscribing to symbols:`, newSymbols);

    let subscribeMessage;
    
    switch (this.vendorId) {
      case VENDOR_IDS.YAHOO_FINANCE:
        subscribeMessage = {
          subscribe: newSymbols.map(symbol => `${symbol}.NS`)
        };
        break;
        
      case VENDOR_IDS.ALPHA_VANTAGE:
        // Alpha Vantage subscribes one symbol at a time
        newSymbols.forEach(symbol => {
          this.send({
            function: 'STREAMING_INTRADAY',
            symbol: symbol,
            interval: '1min',
            apikey: this.config.apiKey
          });
        });
        break;
        
      case VENDOR_IDS.ICICI_BREEZE:
        subscribeMessage = {
          task: 'cn',
          channel: 'feeds',
          token: newSymbols.join(','),
          user: this.config.sessionToken
        };
        break;
        
      case VENDOR_IDS.ZERODHA_KITE:
        subscribeMessage = {
          a: 'subscribe',
          v: newSymbols.map(symbol => this.getZerodhaToken(symbol))
        };
        break;
        
      case VENDOR_IDS.ANGEL_ONE:
        subscribeMessage = {
          action: 1,
          mode: 1,
          tokenList: [{
            exchangeType: 1,
            tokens: newSymbols.map(symbol => this.getAngelToken(symbol))
          }]
        };
        break;
        
      default:
        subscribeMessage = { 
          type: MESSAGE_TYPES.SUBSCRIBE_MARKET,
          symbols: newSymbols 
        };
    }

    if (subscribeMessage) {
      const success = this.send(subscribeMessage);
      if (success) {
        newSymbols.forEach(symbol => {
          this.subscribedSymbols.add(symbol);
          this.subscriptions.add(symbol);
        });
        console.log(`${this.vendorId}: Successfully subscribed to ${newSymbols.length} symbols`);
      }
      return success;
    }

    return false;
  }

  unsubscribeFromMarketData(symbols) {
    if (!this.isConnected) {
      console.warn(`${this.vendorId}: Not connected, cannot unsubscribe`);
      return false;
    }

    const symbolsArray = Array.isArray(symbols) ? symbols : [symbols];
    const subscribedSymbols = symbolsArray.filter(symbol => this.subscribedSymbols.has(symbol));
    
    if (subscribedSymbols.length === 0) {
      return true;
    }

    console.log(`${this.vendorId}: Unsubscribing from symbols:`, subscribedSymbols);

    let unsubscribeMessage;
    
    switch (this.vendorId) {
      case VENDOR_IDS.YAHOO_FINANCE:
        unsubscribeMessage = {
          unsubscribe: subscribedSymbols.map(symbol => `${symbol}.NS`)
        };
        break;
        
      case VENDOR_IDS.ZERODHA_KITE:
        unsubscribeMessage = {
          a: 'unsubscribe',
          v: subscribedSymbols.map(symbol => this.getZerodhaToken(symbol))
        };
        break;
        
      case VENDOR_IDS.ANGEL_ONE:
        unsubscribeMessage = {
          action: 0,
          mode: 1,
          tokenList: [{
            exchangeType: 1,
            tokens: subscribedSymbols.map(symbol => this.getAngelToken(symbol))
          }]
        };
        break;
        
      default:
        unsubscribeMessage = { 
          type: MESSAGE_TYPES.UNSUBSCRIBE_MARKET,
          symbols: subscribedSymbols 
        };
    }

    if (unsubscribeMessage) {
      const success = this.send(unsubscribeMessage);
      if (success) {
        subscribedSymbols.forEach(symbol => {
          this.subscribedSymbols.delete(symbol);
          this.subscriptions.delete(symbol);
        });
      }
      return success;
    }

    return false;
  }

  sendHeartbeat() {
    switch (this.vendorId) {
      case VENDOR_IDS.YAHOO_FINANCE:
        this.send({ ping: Date.now() });
        break;
        
      case VENDOR_IDS.ZERODHA_KITE:
        this.send({ a: 'ping' });
        break;
        
      default:
        super.sendHeartbeat();
    }
  }

  loadTokenMappings() {
    // In a real app, this would load from a file or API
    this.zerodhaTokens = {
      'RELIANCE': '738561',
      'TCS': '2953217',
      'INFY': '408065',
      'HDFCBANK': '341249',
      'ICICIBANK': '1270529',
      'HINDUNILVR': '356865',
      'ITC': '424961',
      'LT': '2939649',
      'SBIN': '779521',
      'BHARTIARTL': '2714625'
    };

    this.angelTokens = {
      'RELIANCE': '2885',
      'TCS': '11536',
      'INFY': '1594',
      'HDFCBANK': '1333',
      'ICICIBANK': '4963',
      'HINDUNILVR': '13404',
      'ITC': '1660',
      'LT': '11483',
      'SBIN': '3045',
      'BHARTIARTL': '10604'
    };
  }

  getZerodhaToken(symbol) {
    return this.zerodhaTokens[symbol] || symbol;
  }

  getAngelToken(symbol) {
    return this.angelTokens[symbol] || symbol;
  }

  // Data transformation methods would be set in the config
  static createYahooTransformer() {
    return (rawData) => {
      try {
        const parsed = JSON.parse(rawData);
        if (parsed.id && parsed.price !== undefined) {
          return {
            type: MESSAGE_TYPES.MARKET_DATA,
            symbol: parsed.id.replace('.NS', ''),
            ltp: parseFloat(parsed.price),
            change: parseFloat(parsed.change) || 0,
            changePercent: parseFloat(parsed.chp) || 0,
            timestamp: new Date().toISOString(),
            source: VENDOR_IDS.YAHOO_FINANCE
          };
        }
      } catch (error) {
        console.error('Error transforming Yahoo data:', error);
      }
      return null;
    };
  }

  static createAlphaVantageTransformer() {
    return (rawData) => {
      try {
        const parsed = JSON.parse(rawData);
        if (parsed.symbol && parsed['05. price']) {
          return {
            type: MESSAGE_TYPES.MARKET_DATA,
            symbol: parsed.symbol,
            ltp: parseFloat(parsed['05. price']),
            volume: parseInt(parsed['06. volume']) || 0,
            timestamp: new Date().toISOString(),
            source: VENDOR_IDS.ALPHA_VANTAGE
          };
        }
      } catch (error) {
        console.error('Error transforming Alpha Vantage data:', error);
      }
      return null;
    };
  }

  static createIciciTransformer() {
    return (rawData) => {
      try {
        const parsed = JSON.parse(rawData);
        if (parsed.stock_code && parsed.ltp) {
          return {
            type: MESSAGE_TYPES.MARKET_DATA,
            symbol: parsed.stock_code,
            ltp: parseFloat(parsed.ltp),
            open: parseFloat(parsed.open) || 0,
            high: parseFloat(parsed.high) || 0,
            low: parseFloat(parsed.low) || 0,
            close: parseFloat(parsed.close) || 0,
            volume: parseInt(parsed.volume) || 0,
            timestamp: new Date().toISOString(),
            source: VENDOR_IDS.ICICI_BREEZE
          };
        }
      } catch (error) {
        console.error('Error transforming ICICI data:', error);
      }
      return null;
    };
  }
}
