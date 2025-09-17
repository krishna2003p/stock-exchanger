// src/lib/vendors/broker-vendor.js
import { BaseVendor } from './base-vendor.js';
import { VENDOR_IDS, MESSAGE_TYPES } from '../../utils/constants.js';

export class BrokerVendor extends BaseVendor {
  constructor(vendorId, config) {
    super(vendorId, config);
    this.sessionTokens = {};
    this.userInfo = null;
  }

  async authenticate() {
    switch (this.vendorId) {
      case VENDOR_IDS.ICICI_BREEZE:
        await this.authenticateIcici();
        break;
        
      case VENDOR_IDS.ZERODHA_KITE:
        await this.authenticateZerodha();
        break;
        
      case VENDOR_IDS.ANGEL_ONE:
        await this.authenticateAngel();
        break;
        
      default:
        throw new Error(`Authentication not implemented for ${this.vendorId}`);
    }
  }

  async authenticateIcici() {
    const { appKey, appSecret } = this.config.credentials;
    
    if (!appKey || !appSecret) {
      throw new Error('ICICI Breeze credentials required');
    }

    // In a real app, you would get the session token from your backend
    // after the user completes the login flow
    console.log(`${this.vendorId}: Mock authentication (credentials provided)`);
    this.isAuthenticated = true;
    
    // Mock session token - in reality this comes from ICICI login API
    this.sessionTokens.icici = 'mock_session_token_123';
  }

  async authenticateZerodha() {
    const { apiKey } = this.config.credentials;
    
    if (!apiKey) {
      throw new Error('Zerodha API key required');
    }

    // In a real app, the user would complete OAuth flow
    console.log(`${this.vendorId}: Mock authentication (API key provided)`);
    this.isAuthenticated = true;
    
    // Mock access token - in reality this comes from Zerodha OAuth flow
    this.sessionTokens.zerodha = 'mock_access_token_456';
  }

  async authenticateAngel() {
    const { clientId, password } = this.config.credentials;
    
    if (!clientId || !password) {
      throw new Error('Angel One credentials required');
    }

    try {
      // Mock login API call
      console.log(`${this.vendorId}: Mock authentication (credentials provided)`);
      
      // In reality, you would make this API call:
      /*
      const loginResponse = await fetch('https://apiconnect.angelbroking.com/rest/auth/angelbroking/user/v1/loginByPassword', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-UserType': 'USER',
          'X-SourceID': 'WEB',
          'X-ClientLocalIP': '127.0.0.1',
          'X-ClientPublicIP': '127.0.0.1',
          'X-MACAddress': '00:00:00:00:00:00',
          'X-PrivateKey': this.config.credentials.apiKey
        },
        body: JSON.stringify({
          clientcode: clientId,
          password: password
        })
      });
      */

      this.isAuthenticated = true;
      this.sessionTokens.angel = 'mock_jwt_token_789';
      
    } catch (error) {
      throw new Error(`Angel authentication error: ${error.message}`);
    }
  }

  getProtocols() {
    switch (this.vendorId) {
      case VENDOR_IDS.ZERODHA_KITE:
        return ['kite3-json'];
      default:
        return [];
    }
  }

  prepareWebSocketUrl() {
    let url = this.config.wsUrl;
    
    switch (this.vendorId) {
      case VENDOR_IDS.ZERODHA_KITE:
        // Zerodha requires access token in URL
        if (this.sessionTokens.zerodha) {
          url += `?access_token=${this.sessionTokens.zerodha}`;
        }
        break;
    }
    
    return url;
  }

  sendInitialSubscriptions() {
    if (!this.isAuthenticated) {
      console.warn(`${this.vendorId}: Not authenticated, cannot send initial subscriptions`);
      return;
    }

    switch (this.vendorId) {
      case VENDOR_IDS.ICICI_BREEZE:
        this.send({
          task: 'cn',
          channel: 'system',
          token: this.sessionTokens.icici,
          user: this.sessionTokens.icici
        });
        break;
        
      case VENDOR_IDS.ZERODHA_KITE:
        this.send({
          a: 'connect',
          p: {
            user_id: 'demo_user',
            public_token: this.sessionTokens.zerodha
          }
        });
        break;
        
      case VENDOR_IDS.ANGEL_ONE:
        this.send({
          action: 1,
          mode: 2,
          tokenList: [{
            exchangeType: 1,
            tokens: []
          }]
        });
        break;
    }
  }

  subscribeToBrokerUpdates() {
    if (!this.isConnected || !this.isAuthenticated) {
      console.warn(`${this.vendorId}: Not ready for broker updates subscription`);
      return false;
    }

    console.log(`${this.vendorId}: Subscribing to broker updates`);

    switch (this.vendorId) {
      case VENDOR_IDS.ICICI_BREEZE:
        return this.send({
          task: 'cn',
          channel: 'orders',
          token: this.sessionTokens.icici,
          user: this.sessionTokens.icici
        });
        
      case VENDOR_IDS.ZERODHA_KITE:
        return this.send({
          a: 'subscribe',
          v: ['orders', 'positions']
        });
        
      case VENDOR_IDS.ANGEL_ONE:
        // Angel One sends order updates automatically
        return true;
        
      default:
        return false;
    }
  }

  subscribeToMarketData(symbols) {
    // Brokers can also provide market data
    if (!this.isConnected || !this.isAuthenticated) {
      console.warn(`${this.vendorId}: Not ready for market data subscription`);
      return false;
    }

    const symbolsArray = Array.isArray(symbols) ? symbols : [symbols];
    console.log(`${this.vendorId}: Subscribing to market data for:`, symbolsArray);

    switch (this.vendorId) {
      case VENDOR_IDS.ICICI_BREEZE:
        return this.send({
          task: 'cn',
          channel: 'feeds',
          token: symbolsArray.join(','),
          user: this.sessionTokens.icici
        });
        
      case VENDOR_IDS.ZERODHA_KITE:
        return this.send({
          a: 'subscribe',
          v: symbolsArray.map(symbol => this.getZerodhaToken(symbol))
        });
        
      case VENDOR_IDS.ANGEL_ONE:
        return this.send({
          action: 1,
          mode: 1,
          tokenList: [{
            exchangeType: 1,
            tokens: symbolsArray.map(symbol => this.getAngelToken(symbol))
          }]
        });
        
      default:
        return false;
    }
  }

  sendHeartbeat() {
    switch (this.vendorId) {
      case VENDOR_IDS.ICICI_BREEZE:
        this.send({
          task: 'hb',
          channel: 'system',
          token: this.sessionTokens.icici
        });
        break;
        
      case VENDOR_IDS.ANGEL_ONE:
        this.send({ t: 'h' });
        break;
        
      default:
        super.sendHeartbeat();
    }
  }

  // Token mapping (same as MarketDataVendor)
  getZerodhaToken(symbol) {
    const tokenMap = {
      'RELIANCE': '738561',
      'TCS': '2953217',
      'INFY': '408065',
      'HDFCBANK': '341249',
      'ICICIBANK': '1270529'
    };
    return tokenMap[symbol] || symbol;
  }

  getAngelToken(symbol) {
    const tokenMap = {
      'RELIANCE': '2885',
      'TCS': '11536',
      'INFY': '1594',
      'HDFCBANK': '1333',
      'ICICIBANK': '4963'
    };
    return tokenMap[symbol] || symbol;
  }

  // Data transformation methods
  static createIciciTransformer() {
    return (rawData) => {
      try {
        const parsed = JSON.parse(rawData);
        
        // Order updates
        if (parsed.channel === 'orders' && parsed.order_id) {
          return {
            type: 'order_update',
            orderId: parsed.order_id,
            status: parsed.status,
            symbol: parsed.stock_code,
            side: parsed.action,
            quantity: parseInt(parsed.quantity),
            price: parseFloat(parsed.price),
            executedQuantity: parseInt(parsed.executed_quantity) || 0,
            timestamp: new Date().toISOString(),
            source: VENDOR_IDS.ICICI_BREEZE
          };
        }
        
        // Market data from broker
        if (parsed.stock_code && parsed.ltp) {
          return {
            type: MESSAGE_TYPES.MARKET_DATA,
            symbol: parsed.stock_code,
            ltp: parseFloat(parsed.ltp),
            timestamp: new Date().toISOString(),
            source: VENDOR_IDS.ICICI_BREEZE
          };
        }
        
      } catch (error) {
        console.error('Error transforming ICICI broker data:', error);
      }
      return null;
    };
  }

  static createZerodhaTransformer() {
    return (rawData) => {
      try {
        const parsed = JSON.parse(rawData);
        
        // Order updates
        if (parsed.type === 'order' && parsed.data) {
          const order = parsed.data;
          return {
            type: 'order_update',
            orderId: order.order_id,
            status: order.status,
            symbol: order.tradingsymbol,
            side: order.transaction_type,
            quantity: parseInt(order.quantity),
            price: parseFloat(order.price),
            executedQuantity: parseInt(order.filled_quantity) || 0,
            timestamp: new Date().toISOString(),
            source: VENDOR_IDS.ZERODHA_KITE
          };
        }
        
        // Market data
        if (parsed.instrument_token && parsed.last_price) {
          return {
            type: MESSAGE_TYPES.MARKET_DATA,
            symbol: this.getSymbolFromToken(parsed.instrument_token),
            ltp: parseFloat(parsed.last_price),
            timestamp: new Date().toISOString(),
            source: VENDOR_IDS.ZERODHA_KITE
          };
        }
        
      } catch (error) {
        console.error('Error transforming Zerodha data:', error);
      }
      return null;
    };
  }
}
