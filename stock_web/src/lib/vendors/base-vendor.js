// src/lib/vendors/base-vendor.js
import { CONNECTION_STATUS, MESSAGE_TYPES } from '../../utils/constants.js';

export class BaseVendor {
  constructor(vendorId, config) {
    this.vendorId = vendorId;
    this.config = config;
    this.ws = null;
    this.isConnected = false;
    this.isAuthenticated = false;
    this.reconnectAttempts = 0;
    this.heartbeatTimer = null;
    this.lastError = null;
    this.messageCount = 0;
    this.startTime = null;
    
    // Event callbacks
    this.onOpen = null;
    this.onClose = null;
    this.onError = null;
    this.onMessage = null;
    
    // Subscriptions
    this.subscriptions = new Set();
  }

  async connect(options = {}) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log(`${this.vendorId} already connected`);
      return this.ws;
    }

    this.onOpen = options.onOpen;
    this.onClose = options.onClose;
    this.onError = options.onError;
    this.onMessage = options.onMessage;

    try {
      // Authenticate if required
      if (this.config.authRequired) {
        await this.authenticate();
      }

      // Prepare WebSocket URL
      const wsUrl = this.prepareWebSocketUrl();
      const protocols = this.getProtocols();

      return new Promise((resolve, reject) => {
        console.log(`🔌 ${this.vendorId}: Connecting to ${wsUrl}`);
        
        this.ws = new WebSocket(wsUrl, protocols);
        this.startTime = Date.now();
        
        this.ws.onopen = (event) => {
          console.log(`✅ ${this.vendorId}: Connected successfully`);
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.lastError = null;
          
          this.startHeartbeat();
          this.sendInitialSubscriptions();
          
          if (this.onOpen) this.onOpen(event);
          resolve(this.ws);
        };

        this.ws.onclose = (event) => {
          console.log(`❌ ${this.vendorId}: Disconnected (${event.code}: ${event.reason})`);
          this.isConnected = false;
          this.stopHeartbeat();
          
          if (this.onClose) this.onClose(event);
        };

        this.ws.onerror = (error) => {
          console.error(`🔥 ${this.vendorId}: Error`, error);
          this.lastError = error;
          
          if (this.onError) this.onError(error);
          
          if (this.ws.readyState === WebSocket.CONNECTING) {
            reject(error);
          }
        };

        this.ws.onmessage = (event) => {
          this.messageCount++;
          this.handleMessage(event.data);
        };
      });

    } catch (error) {
      console.error(`Failed to connect ${this.vendorId}:`, error);
      throw error;
    }
  }

  async disconnect() {
    console.log(`🔌 ${this.vendorId}: Disconnecting...`);
    
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    
    this.isConnected = false;
    this.isAuthenticated = false;
    this.subscriptions.clear();
  }

  send(data) {
    if (!this.isConnected || !this.ws) {
      console.warn(`${this.vendorId}: Not connected, cannot send message`);
      return false;
    }

    try {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      this.ws.send(message);
      
      if (process.env.NEXT_PUBLIC_DEBUG_WEBSOCKET === 'true') {
        console.log(`📤 ${this.vendorId}:`, data);
      }
      
      return true;
    } catch (error) {
      console.error(`Failed to send message to ${this.vendorId}:`, error);
      return false;
    }
  }

  handleMessage(rawData) {
    try {
      let transformedData;
      
      if (this.config.dataTransform) {
        transformedData = this.config.dataTransform(rawData);
      } else {
        transformedData = JSON.parse(rawData);
      }

      if (transformedData && this.onMessage) {
        this.onMessage(transformedData);
      }
      
      // Handle vendor-specific messages
      this.handleVendorSpecificMessage(transformedData);
      
    } catch (error) {
      console.error(`Error handling message from ${this.vendorId}:`, error);
    }
  }

  // Override in subclasses
  async authenticate() {
    console.log(`${this.vendorId}: No authentication required`);
    this.isAuthenticated = true;
  }

  prepareWebSocketUrl() {
    let url = this.config.wsUrl;
    
    // Add API key to URL if required
    if (this.config.apiKey && this.config.authRequired) {
      const separator = url.includes('?') ? '&' : '?';
      url += `${separator}token=${this.config.apiKey}`;
    }
    
    return url;
  }

  getProtocols() {
    return [];
  }

  sendInitialSubscriptions() {
    // Override in subclasses
  }

  handleVendorSpecificMessage(data) {
    // Override in subclasses for vendor-specific handling
  }

  startHeartbeat() {
    if (!this.config.heartbeatInterval) return;
    
    this.stopHeartbeat();
    
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected) {
        this.sendHeartbeat();
      }
    }, this.config.heartbeatInterval);
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  sendHeartbeat() {
    // Default heartbeat - override in subclasses
    this.send({ type: MESSAGE_TYPES.PING, timestamp: Date.now() });
  }

  getStatus() {
    return {
      vendorId: this.vendorId,
      isConnected: this.isConnected,
      isAuthenticated: this.isAuthenticated,
      reconnectAttempts: this.reconnectAttempts,
      messageCount: this.messageCount,
      lastError: this.lastError?.message || null,
      uptime: this.startTime ? Date.now() - this.startTime : 0,
      subscriptions: [...this.subscriptions]
    };
  }
}
