// src/store/slices/bots-slice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunks for API calls
export const fetchUserBots = createAsyncThunk(
  'bots/fetchUserBots',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/bots?user_id=${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch bots');
      }
      const data = await response.json();
      return data.bots;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createBot = createAsyncThunk(
  'bots/createBot',
  async (botData, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/bots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(botData)
      });
      if (!response.ok) {
        throw new Error('Failed to create bot');
      }
      const data = await response.json();
      return data.bot;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateBot = createAsyncThunk(
  'bots/updateBot',
  async ({ botId, updates }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/bots/${botId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) {
        throw new Error('Failed to update bot');
      }
      const data = await response.json();
      return data.bot;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteBot = createAsyncThunk(
  'bots/deleteBot',
  async (botId, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/bots/${botId}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        throw new Error('Failed to delete bot');
      }
      return botId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  // Bot data
  bots: {},
  userBots: [],
  
  // Real-time updates
  realTimeUpdates: {},
  alerts: [],
  trades: [],
  
  // UI state
  loading: false,
  error: null,
  selectedBotId: null,
  
  // Bot operations
  operations: {
    starting: [],
    stopping: [],
    updating: [],
    deleting: []
  },
  
  // Statistics
  statistics: {
    totalBots: 0,
    runningBots: 0,
    totalTrades: 0,
    totalPnL: 0,
    lastUpdate: null
  },
  
  // Filters
  filters: {
    status: 'all', // all, running, stopped, error
    strategy: 'all',
    sortBy: 'name', // name, created, lastRun, pnl
    sortOrder: 'asc'
  }
};

const botsSlice = createSlice({
  name: 'bots',
  initialState,
  reducers: {
    // Real-time bot updates
    botUpdated: (state, action) => {
      const { botId, update } = action.payload;
      
      state.realTimeUpdates[botId] = {
        ...state.realTimeUpdates[botId],
        ...update,
        lastUpdate: update.timestamp || new Date().toISOString()
      };

      // Update bot in userBots array if it exists
      const botIndex = state.userBots.findIndex(bot => bot.id == botId);
      if (botIndex !== -1) {
        state.userBots[botIndex] = {
          ...state.userBots[botIndex],
          status: update.status || state.userBots[botIndex].status,
          realTimeData: update
        };
      }
      
      updateStatistics(state);
    },

    botAlertReceived: (state, action) => {
      const { botId, alert } = action.payload;
      
      state.alerts.unshift({
        ...alert,
        botId,
        id: alert.id || `alert_${botId}_${Date.now()}`
      });

      // Keep only last 500 alerts
      if (state.alerts.length > 500) {
        state.alerts = state.alerts.slice(0, 500);
      }
      
      updateStatistics(state);
    },

    tradeExecuted: (state, action) => {
      const { botId, trade } = action.payload;
      
      state.trades.unshift({
        ...trade,
        botId,
        id: trade.id || `trade_${botId}_${Date.now()}`
      });

      // Keep only last 1000 trades
      if (state.trades.length > 1000) {
        state.trades = state.trades.slice(0, 1000);
      }

      // Add to alerts as well
      state.alerts.unshift({
        id: `trade_alert_${trade.id}`,
        type: 'trade_executed',
        botId,
        message: `${trade.side} ${trade.quantity} ${trade.symbol} at ₹${trade.price}`,
        level: 'success',
        timestamp: trade.timestamp || new Date().toISOString(),
        data: trade
      });
      
      updateStatistics(state);
    },

    // Bot operations
    startBotRequested: (state, action) => {
      const { botId } = action.payload;
      if (!state.operations.starting.includes(botId)) {
        state.operations.starting.push(botId);
      }
    },

    startBotCompleted: (state, action) => {
      const { botId, success } = action.payload;
      state.operations.starting = state.operations.starting.filter(id => id !== botId);
      
      if (success !== false) {
        // Update bot status if not explicitly failed
        const botIndex = state.userBots.findIndex(bot => bot.id == botId);
        if (botIndex !== -1) {
          state.userBots[botIndex].status = 'RUNNING';
        }
      }
      
      updateStatistics(state);
    },

    stopBotRequested: (state, action) => {
      const { botId } = action.payload;
      if (!state.operations.stopping.includes(botId)) {
        state.operations.stopping.push(botId);
      }
    },

    stopBotCompleted: (state, action) => {
      const { botId, success } = action.payload;
      state.operations.stopping = state.operations.stopping.filter(id => id !== botId);
      
      if (success !== false) {
        const botIndex = state.userBots.findIndex(bot => bot.id == botId);
        if (botIndex !== -1) {
          state.userBots[botIndex].status = 'STOPPED';
        }
      }
      
      updateStatistics(state);
    },

    updateBotRequested: (state, action) => {
      const { botId } = action.payload;
      if (!state.operations.updating.includes(botId)) {
        state.operations.updating.push(botId);
      }
    },

    updateBotCompleted: (state, action) => {
      const { botId } = action.payload;
      state.operations.updating = state.operations.updating.filter(id => id !== botId);
    },

    // UI management
    selectBot: (state, action) => {
      state.selectedBotId = action.payload;
    },

    updateFilters: (state, action) => {
      state.filters = {
        ...state.filters,
        ...action.payload
      };
    },

    resetFilters: (state) => {
      state.filters = {
        status: 'all',
        strategy: 'all',
        sortBy: 'name',
        sortOrder: 'asc'
      };
    },

    // Alert management
    markAlertAsRead: (state, action) => {
      const { alertId } = action.payload;
      const alert = state.alerts.find(a => a.id === alertId);
      if (alert) {
        alert.read = true;
        alert.readAt = new Date().toISOString();
      }
    },

    clearBotAlerts: (state, action) => {
      const { botId } = action.payload;
      if (botId) {
        state.alerts = state.alerts.filter(alert => alert.botId !== botId);
      } else {
        state.alerts = [];
      }
    },

    clearBotTrades: (state, action) => {
      const { botId } = action.payload;
      if (botId) {
        state.trades = state.trades.filter(trade => trade.botId !== botId);
      } else {
        state.trades = [];
      }
    },

    // Error handling
    setBotError: (state, action) => {
      const { botId, error } = action.payload;
      if (state.realTimeUpdates[botId]) {
        state.realTimeUpdates[botId].error = error;
        state.realTimeUpdates[botId].errorAt = new Date().toISOString();
      }
    },

    clearBotError: (state, action) => {
      const { botId } = action.payload;
      if (state.realTimeUpdates[botId]) {
        delete state.realTimeUpdates[botId].error;
        delete state.realTimeUpdates[botId].errorAt;
      }
    },

    // Performance tracking
    updateBotPerformance: (state, action) => {
      const { botId, performance } = action.payload;
      if (state.realTimeUpdates[botId]) {
        state.realTimeUpdates[botId].performance = {
          ...state.realTimeUpdates[botId].performance,
          ...performance,
          updatedAt: new Date().toISOString()
        };
      }
    }
  },
  
  extraReducers: (builder) => {
    builder
      // Fetch user bots
      .addCase(fetchUserBots.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserBots.fulfilled, (state, action) => {
        state.loading = false;
        state.userBots = action.payload;
        
        // Initialize real-time updates for each bot
        action.payload.forEach(bot => {
          if (!state.realTimeUpdates[bot.id]) {
            state.realTimeUpdates[bot.id] = {
              status: bot.status,
              lastUpdate: null,
              performance: {}
            };
          }
        });
        
        updateStatistics(state);
      })
      .addCase(fetchUserBots.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create bot
      .addCase(createBot.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createBot.fulfilled, (state, action) => {
        state.loading = false;
        state.userBots.push(action.payload);
        
        // Initialize real-time updates
        state.realTimeUpdates[action.payload.id] = {
          status: action.payload.status,
          lastUpdate: null,
          performance: {}
        };
        
        updateStatistics(state);
      })
      .addCase(createBot.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update bot
      .addCase(updateBot.pending, (state, action) => {
        const botId = action.meta.arg.botId;
        if (!state.operations.updating.includes(botId)) {
          state.operations.updating.push(botId);
        }
      })
      .addCase(updateBot.fulfilled, (state, action) => {
        const updatedBot = action.payload;
        const botIndex = state.userBots.findIndex(bot => bot.id === updatedBot.id);
        
        if (botIndex !== -1) {
          state.userBots[botIndex] = updatedBot;
        }
        
        state.operations.updating = state.operations.updating.filter(id => id !== updatedBot.id);
        updateStatistics(state);
      })
      .addCase(updateBot.rejected, (state, action) => {
        const botId = action.meta.arg.botId;
        state.operations.updating = state.operations.updating.filter(id => id !== botId);
        state.error = action.payload;
      })
      
      // Delete bot
      .addCase(deleteBot.pending, (state, action) => {
        const botId = action.meta.arg;
        if (!state.operations.deleting.includes(botId)) {
          state.operations.deleting.push(botId);
        }
      })
      .addCase(deleteBot.fulfilled, (state, action) => {
        const botId = action.payload;
        
        // Remove from arrays
        state.userBots = state.userBots.filter(bot => bot.id !== botId);
        state.alerts = state.alerts.filter(alert => alert.botId !== botId);
        state.trades = state.trades.filter(trade => trade.botId !== botId);
        
        // Clean up real-time data
        delete state.realTimeUpdates[botId];
        
        // Remove from operations
        state.operations.deleting = state.operations.deleting.filter(id => id !== botId);
        
        updateStatistics(state);
      })
      .addCase(deleteBot.rejected, (state, action) => {
        const botId = action.meta.arg;
        state.operations.deleting = state.operations.deleting.filter(id => id !== botId);
        state.error = action.payload;
      });
  }
});

// Helper function to update statistics
const updateStatistics = (state) => {
  const runningBots = state.userBots.filter(bot => {
    const realTimeData = state.realTimeUpdates[bot.id];
    const currentStatus = realTimeData?.status || bot.status;
    return currentStatus === 'RUNNING';
  }).length;

  const totalPnL = state.trades.reduce((sum, trade) => {
    const pnl = trade.pnl || 0;
    return sum + pnl;
  }, 0);

  state.statistics = {
    totalBots: state.userBots.length,
    runningBots,
    totalTrades: state.trades.length,
    totalPnL,
    lastUpdate: new Date().toISOString()
  };
};

export const {
  botUpdated,
  botAlertReceived,
  tradeExecuted,
  startBotRequested,
  startBotCompleted,
  stopBotRequested,
  stopBotCompleted,
  updateBotRequested,
  updateBotCompleted,
  selectBot,
  updateFilters,
  resetFilters,
  markAlertAsRead,
  clearBotAlerts,
  clearBotTrades,
  setBotError,
  clearBotError,
  updateBotPerformance
} = botsSlice.actions;

export default botsSlice.reducer;

// Selectors
export const selectUserBots = (state) => state.bots.userBots;
export const selectBotRealTimeUpdates = (state) => state.bots.realTimeUpdates;
export const selectBotById = (botId) => (state) => 
  state.bots.userBots.find(bot => bot.id == botId);
export const selectBotRealTimeData = (botId) => (state) => 
  state.bots.realTimeUpdates[botId];
export const selectBotAlerts = (state) => state.bots.alerts;
export const selectBotTrades = (state) => state.bots.trades;
export const selectBotAlertsByBotId = (botId) => (state) => 
  state.bots.alerts.filter(alert => alert.botId == botId);
export const selectBotTradesByBotId = (botId) => (state) => 
  state.bots.trades.filter(trade => trade.botId == botId);
export const selectBotsLoading = (state) => state.bots.loading;
export const selectBotsError = (state) => state.bots.error;
export const selectSelectedBotId = (state) => state.bots.selectedBotId;
export const selectIsBotStarting = (botId) => (state) => 
  state.bots.operations.starting.includes(botId);
export const selectIsBotStopping = (botId) => (state) => 
  state.bots.operations.stopping.includes(botId);
export const selectIsBotUpdating = (botId) => (state) => 
  state.bots.operations.updating.includes(botId);
export const selectRunningBotsCount = (state) => state.bots.statistics.runningBots;
export const selectBotStatistics = (state) => state.bots.statistics;
export const selectBotFilters = (state) => state.bots.filters;

export const selectFilteredBots = (state) => {
  const { userBots, filters, realTimeUpdates } = state.bots;
  
  let filtered = [...userBots];
  
  // Status filter
  if (filters.status !== 'all') {
    filtered = filtered.filter(bot => {
      const realTimeData = realTimeUpdates[bot.id];
      const currentStatus = realTimeData?.status || bot.status;
      return currentStatus.toLowerCase() === filters.status.toLowerCase();
    });
  }
  
  // Strategy filter
  if (filters.strategy !== 'all') {
    filtered = filtered.filter(bot => bot.strategyType === filters.strategy);
  }
  
  // Sorting
  filtered.sort((a, b) => {
    let aValue, bValue;
    
    switch (filters.sortBy) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'created':
        aValue = new Date(a.createdAt);
        bValue = new Date(b.createdAt);
        break;
      case 'lastRun':
        aValue = new Date(a.lastRun || 0);
        bValue = new Date(b.lastRun || 0);
        break;
      case 'pnl':
        const aPnl = realTimeUpdates[a.id]?.performance?.totalPnL || 0;
        const bPnl = realTimeUpdates[b.id]?.performance?.totalPnL || 0;
        aValue = aPnl;
        bValue = bPnl;
        break;
      default:
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
    }
    
    if (aValue < bValue) return filters.sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return filters.sortOrder === 'asc' ? 1 : -1;
    return 0;
  });
  
  return filtered;
};
