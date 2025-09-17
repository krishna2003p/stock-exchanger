// src/lib/websocket-manager.js
import { CONNECTION_STATUS, MESSAGE_TYPES } from '../utils/constants.js';

class WebSocketManager {
  constructor() {
    this.connections = new Map();
    this.subscribers = new Map();
    this.reconnectAttempts = new Map();
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 3000;
    this.heartbeatInterval = 30000;
    this.messageQueue = new Map();
    
    this.globalHandlers = {
      onConnect: [],
      onDisconnect: [],
      onError: [],
      onMessage: []
    };
  }

  async connect(connectionId, url, options = {}) {
    if (this.connections.has(connectionId)) {
      const existing = this.connections.get(connectionId);
      if (existing.ws && existing.ws.readyState === WebSocket.OPEN) {
        console.log(`WebSocket ${connectionId} already connected`);
        return existing;
      }
    }

    const {
      protocols = [],
      reconnectAttempts = this.maxReconnectAttempts,
      reconnectInterval = this.reconnectInterval,
      heartbeatInterval = this.heartbeatInterval,
      autoReconnect = true,
      headers = {}
    } = options;

    return new Promise((resolve, reject) => {
      try {
        console.log(`🔌 Connecting WebSocket: ${connectionId} to ${url}`);
        
        const ws = new WebSocket(url, protocols);
        const connectionData = {
          ws,
          connectionId,
          url,
          options: { ...options, autoReconnect },
          isConnected: false,
          heartbeatTimer: null,
          reconnectTimer: null,
          lastPong: Date.now(),
          messageCount: 0,
          startTime: Date.now()
        };

        ws.onopen = (event) => {
          console.log(`✅ WebSocket connected: ${connectionId}`);
          connectionData.isConnected = true;
          connectionData.connectedAt = Date.now();
          this.reconnectAttempts.set(connectionId, 0);
          
          this.startHeartbeat(connectionId);
          this.processMessageQueue(connectionId);
          
          this.globalHandlers.onConnect.forEach(handler => {
            try { 
              handler(connectionId, event); 
            } catch (e) { 
              console.error('Error in connect handler:', e); 
            }
          });
          
          resolve(connectionData);
        };

        ws.onclose = (event) => {
          console.log(`❌ WebSocket disconnected: ${connectionId}`, event.code, event.reason);
          connectionData.isConnected = false;
          this.stopHeartbeat(connectionId);
          
          this.globalHandlers.onDisconnect.forEach(handler => {
            try { 
              handler(connectionId, event); 
            } catch (e) { 
              console.error('Error in disconnect handler:', e); 
            }
          });
          
          if (autoReconnect && event.code !== 1000) {
            this.scheduleReconnect(connectionId);
          }
        };

        ws.onerror = (error) => {
          console.error(`🔥 WebSocket error: ${connectionId}`, error);
          
          this.globalHandlers.onError.forEach(handler => {
            try { 
              handler(connectionId, error); 
            } catch (e) { 
              console.error('Error in error handler:', e); 
            }
          });
          
          if (ws.readyState === WebSocket.CONNECTING) {
            reject(error);
          }
        };

        ws.onmessage = (event) => {
          connectionData.messageCount++;
          connectionData.lastMessage = Date.now();
          this.handleMessage(connectionId, event);
        };

        this.connections.set(connectionId, connectionData);

      } catch (error) {
        console.error(`Failed to create WebSocket: ${connectionId}`, error);
        reject(error);
      }
    });
  }

  disconnect(connectionId) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    console.log(`🔌 Disconnecting WebSocket: ${connectionId}`);

    this.stopHeartbeat(connectionId);
    if (connection.reconnectTimer) {
      clearTimeout(connection.reconnectTimer);
    }

    if (connection.ws && connection.ws.readyState !== WebSocket.CLOSED) {
      connection.ws.close(1000, 'Client disconnect');
    }

    this.connections.delete(connectionId);
    this.subscribers.delete(connectionId);
    this.messageQueue.delete(connectionId);
    this.reconnectAttempts.delete(connectionId);
  }

  send(connectionId, data) {
    const connection = this.connections.get(connectionId);
    if (!connection || !connection.isConnected) {
      if (connection) {
        this.queueMessage(connectionId, data);
      }
      return false;
    }

    try {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      connection.ws.send(message);
      
      if (process.env.NEXT_PUBLIC_DEBUG_WEBSOCKET === 'true') {
        console.log(`📤 ${connectionId}:`, data);
      }
      
      return true;
    } catch (error) {
      console.error(`Failed to send message to ${connectionId}:`, error);
      return false;
    }
  }

  subscribe(connectionId, eventType, handler) {
    if (!this.subscribers.has(connectionId)) {
      this.subscribers.set(connectionId, new Map());
    }

    const connectionSubscribers = this.subscribers.get(connectionId);
    if (!connectionSubscribers.has(eventType)) {
      connectionSubscribers.set(eventType, new Set());
    }

    connectionSubscribers.get(eventType).add(handler);

    return () => this.unsubscribe(connectionId, eventType, handler);
  }

  unsubscribe(connectionId, eventType, handler) {
    const connectionSubscribers = this.subscribers.get(connectionId);
    if (!connectionSubscribers) return;

    const eventSubscribers = connectionSubscribers.get(eventType);
    if (!eventSubscribers) return;

    eventSubscribers.delete(handler);

    if (eventSubscribers.size === 0) {
      connectionSubscribers.delete(eventType);
    }
    if (connectionSubscribers.size === 0) {
      this.subscribers.delete(connectionId);
    }
  }

  handleMessage(connectionId, event) {
    try {
      const data = JSON.parse(event.data);
      
      if (process.env.NEXT_PUBLIC_DEBUG_WEBSOCKET === 'true') {
        console.log(`📥 ${connectionId}:`, data);
      }

      // Handle system messages
      if (data.type === MESSAGE_TYPES.PING) {
        this.send(connectionId, { type: MESSAGE_TYPES.PONG, timestamp: Date.now() });
        return;
      }
      
      if (data.type === MESSAGE_TYPES.PONG) {
        const connection = this.connections.get(connectionId);
        if (connection) {
          connection.lastPong = Date.now();
        }
        return;
      }

      // Route to subscribers
      const connectionSubscribers = this.subscribers.get(connectionId);
      if (connectionSubscribers) {
        const eventType = data.type || data.event || 'message';
        const eventSubscribers = connectionSubscribers.get(eventType);
        
        if (eventSubscribers) {
          eventSubscribers.forEach(handler => {
            try {
              handler(data, connectionId);
            } catch (error) {
              console.error(`Error in message handler for ${eventType}:`, error);
            }
          });
        }

        const generalSubscribers = connectionSubscribers.get('message');
        if (generalSubscribers && eventType !== 'message') {
          generalSubscribers.forEach(handler => {
            try {
              handler(data, connectionId);
            } catch (error) {
              console.error('Error in general message handler:', error);
            }
          });
        }
      }

      this.globalHandlers.onMessage.forEach(handler => {
        try { 
          handler(connectionId, data); 
        } catch (e) { 
          console.error('Error in global message handler:', e); 
        }
      });

    } catch (error) {
      console.error(`Failed to parse message from ${connectionId}:`, error);
    }
  }

  queueMessage(connectionId, data) {
    if (!this.messageQueue.has(connectionId)) {
      this.messageQueue.set(connectionId, []);
    }
    
    const queue = this.messageQueue.get(connectionId);
    queue.push({
      data,
      timestamp: Date.now()
    });

    if (queue.length > 100) {
      queue.shift();
    }
  }

  processMessageQueue(connectionId) {
    const queue = this.messageQueue.get(connectionId);
    if (!queue || queue.length === 0) return;

    const connection = this.connections.get(connectionId);
    if (!connection || !connection.isConnected) return;

    console.log(`📦 Processing ${queue.length} queued messages for ${connectionId}`);

    while (queue.length > 0) {
      const { data } = queue.shift();
      if (!this.send(connectionId, data)) {
        queue.unshift({ data, timestamp: Date.now() });
        break;
      }
    }
  }

  startHeartbeat(connectionId) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    this.stopHeartbeat(connectionId);

    connection.heartbeatTimer = setInterval(() => {
      if (connection.isConnected) {
        if (Date.now() - connection.lastPong > connection.options.heartbeatInterval * 2) {
          console.warn(`No pong received from ${connectionId}, connection may be dead`);
          connection.ws.close(1006, 'No pong received');
          return;
        }

        this.send(connectionId, { type: MESSAGE_TYPES.PING, timestamp: Date.now() });
      }
    }, connection.options.heartbeatInterval);
  }

  stopHeartbeat(connectionId) {
    const connection = this.connections.get(connectionId);
    if (connection && connection.heartbeatTimer) {
      clearInterval(connection.heartbeatTimer);
      connection.heartbeatTimer = null;
    }
  }

  scheduleReconnect(connectionId) {
    const connection = this.connections.get(connectionId);
    if (!connection || !connection.options.autoReconnect) return;

    const attempts = this.reconnectAttempts.get(connectionId) || 0;
    if (attempts >= this.maxReconnectAttempts) {
      console.error(`Max reconnection attempts reached for ${connectionId}`);
      return;
    }

    const delay = Math.min(this.reconnectInterval * Math.pow(1.5, attempts), 30000);
    console.log(`⏰ Scheduling reconnection for ${connectionId} in ${delay}ms (attempt ${attempts + 1})`);

    connection.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts.set(connectionId, attempts + 1);
      
      this.connect(connectionId, connection.url, connection.options)
        .then(() => {
          console.log(`🔄 Reconnected ${connectionId} successfully`);
        })
        .catch(error => {
          console.error(`🔄 Reconnection failed for ${connectionId}:`, error);
        });
    }, delay);
  }

  getConnectionStatus(connectionId) {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return { status: CONNECTION_STATUS.DISCONNECTED };
    }

    let status = CONNECTION_STATUS.DISCONNECTED;
    if (connection.ws) {
      switch (connection.ws.readyState) {
        case WebSocket.CONNECTING:
          status = CONNECTION_STATUS.CONNECTING;
          break;
        case WebSocket.OPEN:
          status = CONNECTION_STATUS.CONNECTED;
          break;
        case WebSocket.CLOSING:
        case WebSocket.CLOSED:
          status = CONNECTION_STATUS.DISCONNECTED;
          break;
      }
    }

    return {
      status,
      url: connection.url,
      messageCount: connection.messageCount,
      reconnectAttempts: this.reconnectAttempts.get(connectionId) || 0,
      queuedMessages: this.messageQueue.get(connectionId)?.length || 0,
      lastPong: connection.lastPong,
      connectedAt: connection.connectedAt,
      uptime: connection.connectedAt ? Date.now() - connection.connectedAt : 0
    };
  }

  getAllStatuses() {
    const statuses = {};
    this.connections.forEach((_, connectionId) => {
      statuses[connectionId] = this.getConnectionStatus(connectionId);
    });
    return statuses;
  }

  addGlobalHandler(event, handler) {
    if (this.globalHandlers[event]) {
      this.globalHandlers[event].push(handler);
    }
  }

  removeGlobalHandler(event, handler) {
    if (this.globalHandlers[event]) {
      const index = this.globalHandlers[event].indexOf(handler);
      if (index > -1) {
        this.globalHandlers[event].splice(index, 1);
      }
    }
  }

  disconnectAll() {
    const connectionIds = [...this.connections.keys()];
    connectionIds.forEach(id => this.disconnect(id));
  }
}

export const wsManager = new WebSocketManager();
export default WebSocketManager;
