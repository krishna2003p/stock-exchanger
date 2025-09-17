// src/store/slices/websocket-slice.js
import { createSlice } from '@reduxjs/toolkit';
import { CONNECTION_STATUS } from '../../utils/constants.js';

const initialState = {
  connections: {},
  status: {
    isInitialized: false,
    globalStatus: CONNECTION_STATUS.DISCONNECTED
  },
  messageHistory: [],
  reconnectAttempts: {},
  statistics: {
    totalConnections: 0,
    activeConnections: 0,
    totalMessages: 0,
    lastActivity: null
  }
};

const websocketSlice = createSlice({
  name: 'websocket',
  initialState,
  reducers: {
    // Connection management
    connectWebSocket: (state, action) => {
      const { connectionId, url, options } = action.payload;
      
      state.connections[connectionId] = {
        ...state.connections[connectionId],
        status: CONNECTION_STATUS.CONNECTING,
        url: url || state.connections[connectionId]?.url,
        lastAttempt: new Date().toISOString(),
        options: options || {}
      };
      
      updateGlobalStatus(state);
    },

    connectionEstablished: (state, action) => {
      const { connectionId, url } = action.payload;
      
      state.connections[connectionId] = {
        status: CONNECTION_STATUS.CONNECTED,
        url,
        connectedAt: new Date().toISOString(),
        lastMessage: null,
        messageCount: 0,
        error: null,
        uptime: 0
      };
      
      state.reconnectAttempts[connectionId] = 0;
      state.statistics.activeConnections = Object.values(state.connections)
        .filter(conn => conn.status === CONNECTION_STATUS.CONNECTED).length;
      
      updateGlobalStatus(state);
    },

    connectionClosed: (state, action) => {
      const { connectionId, event } = action.payload;
      
      if (state.connections[connectionId]) {
        state.connections[connectionId].status = CONNECTION_STATUS.DISCONNECTED;
        state.connections[connectionId].disconnectedAt = new Date().toISOString();
        state.connections[connectionId].closeCode = event?.code;
        state.connections[connectionId].closeReason = event?.reason;
        
        // Calculate uptime
        if (state.connections[connectionId].connectedAt) {
          const connectedTime = new Date(state.connections[connectionId].connectedAt);
          state.connections[connectionId].uptime = Date.now() - connectedTime.getTime();
        }
      }
      
      state.statistics.activeConnections = Object.values(state.connections)
        .filter(conn => conn.status === CONNECTION_STATUS.CONNECTED).length;
      
      updateGlobalStatus(state);
    },

    connectionError: (state, action) => {
      const { connectionId, error, timestamp } = action.payload;
      
      if (state.connections[connectionId]) {
        state.connections[connectionId].status = CONNECTION_STATUS.ERROR;
        state.connections[connectionId].error = error;
        state.connections[connectionId].errorAt = timestamp || new Date().toISOString();
      }
      
      updateGlobalStatus(state);
    },

    disconnectWebSocket: (state, action) => {
      const { connectionId } = action.payload;
      
      if (state.connections[connectionId]) {
        state.connections[connectionId].status = CONNECTION_STATUS.DISCONNECTED;
      }
    },

    // Message handling
    sendMessage: (state, action) => {
      const { connectionId, data } = action.payload;
      
      // Add to message history for debugging
      state.messageHistory.unshift({
        connectionId,
        direction: 'outbound',
        data,
        timestamp: new Date().toISOString()
      });

      // Keep only last 200 messages
      if (state.messageHistory.length > 200) {
        state.messageHistory = state.messageHistory.slice(0, 200);
      }
      
      state.statistics.totalMessages++;
      state.statistics.lastActivity = new Date().toISOString();
    },

    messageReceived: (state, action) => {
      const { connectionId, data } = action.payload;
      
      // Update connection stats
      if (state.connections[connectionId]) {
        state.connections[connectionId].lastMessage = new Date().toISOString();
        state.connections[connectionId].messageCount += 1;
      }

      // Add to message history
      state.messageHistory.unshift({
        connectionId,
        direction: 'inbound',
        data,
        timestamp: new Date().toISOString()
      });

      if (state.messageHistory.length > 200) {
        state.messageHistory = state.messageHistory.slice(0, 200);
      }
      
      state.statistics.totalMessages++;
      state.statistics.lastActivity = new Date().toISOString();
    },

    // Reconnection management
    incrementReconnectAttempt: (state, action) => {
      const { connectionId } = action.payload;
      state.reconnectAttempts[connectionId] = (state.reconnectAttempts[connectionId] || 0) + 1;
    },

    resetReconnectAttempts: (state, action) => {
      const { connectionId } = action.payload;
      state.reconnectAttempts[connectionId] = 0;
    },

    // Initialization
    initializeWebSocket: (state) => {
      state.status.isInitialized = true;
      state.statistics.totalConnections = Object.keys(state.connections).length;
    },

    // Cleanup
    clearMessageHistory: (state) => {
      state.messageHistory = [];
    },

    removeConnection: (state, action) => {
      const { connectionId } = action.payload;
      delete state.connections[connectionId];
      delete state.reconnectAttempts[connectionId];
      
      state.statistics.totalConnections = Object.keys(state.connections).length;
      state.statistics.activeConnections = Object.values(state.connections)
        .filter(conn => conn.status === CONNECTION_STATUS.CONNECTED).length;
      
      updateGlobalStatus(state);
    },

    // Bulk operations
    updateConnectionStatistics: (state) => {
      state.statistics = {
        ...state.statistics,
        totalConnections: Object.keys(state.connections).length,
        activeConnections: Object.values(state.connections)
          .filter(conn => conn.status === CONNECTION_STATUS.CONNECTED).length,
        lastUpdate: new Date().toISOString()
      };
    }
  }
});

// Helper function to update global status
const updateGlobalStatus = (state) => {
  const connections = Object.values(state.connections);
  
  if (connections.length === 0) {
    state.status.globalStatus = CONNECTION_STATUS.DISCONNECTED;
    return;
  }

  const connectedCount = connections.filter(conn => conn.status === CONNECTION_STATUS.CONNECTED).length;
  const connectingCount = connections.filter(conn => conn.status === CONNECTION_STATUS.CONNECTING).length;
  const errorCount = connections.filter(conn => conn.status === CONNECTION_STATUS.ERROR).length;

  if (connectedCount === connections.length) {
    state.status.globalStatus = CONNECTION_STATUS.CONNECTED;
  } else if (connectingCount > 0) {
    state.status.globalStatus = CONNECTION_STATUS.CONNECTING;
  } else if (errorCount > 0) {
    state.status.globalStatus = CONNECTION_STATUS.ERROR;
  } else {
    state.status.globalStatus = CONNECTION_STATUS.DISCONNECTED;
  }
};

export const {
  connectWebSocket,
  disconnectWebSocket,
  connectionEstablished,
  connectionClosed,
  connectionError,
  sendMessage,
  messageReceived,
  incrementReconnectAttempt,
  resetReconnectAttempts,
  initializeWebSocket,
  clearMessageHistory,
  removeConnection,
  updateConnectionStatistics
} = websocketSlice.actions;

export default websocketSlice.reducer;

// Selectors
export const selectConnections = (state) => state.websocket.connections;
export const selectConnectionStatus = (connectionId) => (state) => 
  state.websocket.connections[connectionId]?.status || CONNECTION_STATUS.DISCONNECTED;
export const selectGlobalStatus = (state) => state.websocket.status.globalStatus;
export const selectIsConnected = (connectionId) => (state) => 
  state.websocket.connections[connectionId]?.status === CONNECTION_STATUS.CONNECTED;
export const selectAreAllConnected = (state) => 
  state.websocket.status.globalStatus === CONNECTION_STATUS.CONNECTED;
export const selectMessageHistory = (state) => state.websocket.messageHistory;
export const selectReconnectAttempts = (connectionId) => (state) => 
  state.websocket.reconnectAttempts[connectionId] || 0;
export const selectConnectionStatistics = (state) => state.websocket.statistics;
export const selectActiveConnections = (state) => 
  Object.entries(state.websocket.connections)
    .filter(([_, conn]) => conn.status === CONNECTION_STATUS.CONNECTED)
    .map(([id, conn]) => ({ id, ...conn }));
