// src/store/slices/market-data-slice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Price data
  prices: {},
  subscriptions: new Set(),
  
  // Historical data
  historical: {},
  
  // Market status
  marketStatus: {
    isOpen: false,
    nextOpen: null,
    nextClose: null,
    timezone: 'Asia/Kolkata'
  },
  
  // Vendor data sources
  vendorData: {}, // Track which vendor provided which symbol's data
  vendorStatus: {},
  
  // Statistics
  statistics: {
    symbolsTracked: 0,
    lastUpdate: null,
    updateCount: 0,
    vendorStats: {}
  },
  
  // UI state
  selectedSymbol: null,
  priceAlerts: [],
  
  // Connection health
  connectionHealth: {
    lastUpdate: null,
    missedUpdates: 0,
    dataLatency: {}
  },
  
  // Performance tracking
  performance: {
    topGainers: [],
    topLosers: [],
    mostActive: []
  }
};

const marketDataSlice = createSlice({
  name: 'marketData',
  initialState,
  reducers: {
    // Price updates
    priceUpdated: (state, action) => {
      const { symbol, data } = action.payload;
      
      // Store previous price for comparison
      const previousPrice = state.prices[symbol]?.ltp;
      
      state.prices[symbol] = {
        ...data,
        previousPrice,
        priceDirection: previousPrice ? 
          (data.ltp > previousPrice ? 'up' : data.ltp < previousPrice ? 'down' : 'unchanged') : 
          'unchanged',
        lastUpdated: new Date().toISOString()
      };
      
      // Track vendor data source
      if (data.source) {
        state.vendorData[symbol] = data.source;
        
        // Update vendor statistics
        if (!state.statistics.vendorStats[data.source]) {
          state.statistics.vendorStats[data.source] = { updates: 0, symbols: new Set() };
        }
        state.statistics.vendorStats[data.source].updates++;
        state.statistics.vendorStats[data.source].symbols.add(symbol);
      }

      // Update global statistics
      state.statistics.lastUpdate = new Date().toISOString();
      state.statistics.updateCount += 1;
      state.statistics.symbolsTracked = Object.keys(state.prices).length;
      
      // Update connection health
      state.connectionHealth.lastUpdate = new Date().toISOString();
      state.connectionHealth.missedUpdates = 0;
      
      // Track data latency if timestamp provided
      if (data.timestamp) {
        const latency = Date.now() - new Date(data.timestamp).getTime();
        state.connectionHealth.dataLatency[symbol] = latency;
      }

      // Check price alerts
      checkPriceAlerts(state, symbol, data.ltp);
      
      // Update performance lists
      updatePerformanceListss(state);
    },

    marketDataReceived: (state, action) => {
      const { data, connectionId } = action.payload;
      
      if (Array.isArray(data)) {
        data.forEach(item => {
          const previousPrice = state.prices[item.symbol]?.ltp;
          
          state.prices[item.symbol] = {
            ...item,
            timestamp: new Date(item.timestamp || Date.now()).toISOString(),
            previousPrice,
            priceDirection: previousPrice ? 
              (item.ltp > previousPrice ? 'up' : item.ltp < previousPrice ? 'down' : 'unchanged') : 
              'unchanged',
            lastUpdated: new Date().toISOString()
          };
          
          // Track vendor
          if (item.source) {
            state.vendorData[item.symbol] = item.source;
          }
        });
      }

      state.statistics.lastUpdate = new Date().toISOString();
      state.statistics.updateCount += Array.isArray(data) ? data.length : 1;
      state.statistics.symbolsTracked = Object.keys(state.prices).length;
    },

    // Subscriptions
    symbolSubscribed: (state, action) => {
      const { symbol, vendor } = action.payload;
      const symbolUpper = symbol.toUpperCase();
      
      state.subscriptions.add(symbolUpper);
      
      if (vendor) {
        state.vendorData[symbolUpper] = vendor;
      }
    },

    symbolUnsubscribed: (state, action) => {
      const { symbol } = action.payload;
      const symbolUpper = symbol.toUpperCase();
      
      state.subscriptions.delete(symbolUpper);
      
      // Optionally remove price data
      delete state.prices[symbolUpper];
      delete state.vendorData[symbolUpper];
      
      state.statistics.symbolsTracked = Object.keys(state.prices).length;
    },

    bulkSubscribe: (state, action) => {
      const { symbols, vendor } = action.payload;
      symbols.forEach(symbol => {
        const symbolUpper = symbol.toUpperCase();
        state.subscriptions.add(symbolUpper);
        
        if (vendor) {
          state.vendorData[symbolUpper] = vendor;
        }
      });
    },

    bulkUnsubscribe: (state, action) => {
      const { symbols } = action.payload;
      symbols.forEach(symbol => {
        const symbolUpper = symbol.toUpperCase();
        state.subscriptions.delete(symbolUpper);
        delete state.prices[symbolUpper];
        delete state.vendorData[symbolUpper];
      });
      state.statistics.symbolsTracked = Object.keys(state.prices).length;
    },

    clearAllSubscriptions: (state) => {
      state.subscriptions.clear();
      state.prices = {};
      state.vendorData = {};
      state.statistics.symbolsTracked = 0;
    },

    // Historical data
    historicalDataReceived: (state, action) => {
      const { symbol, data, timeframe } = action.payload;
      
      if (!state.historical[symbol]) {
        state.historical[symbol] = {};
      }
      
      state.historical[symbol][timeframe] = {
        data,
        lastUpdate: new Date().toISOString()
      };
    },

    // Market status
    marketStatusUpdated: (state, action) => {
      state.marketStatus = {
        ...state.marketStatus,
        ...action.payload,
        lastUpdate: new Date().toISOString()
      };
    },

    // Price alerts
    addPriceAlert: (state, action) => {
      const { symbol, targetPrice, condition, message } = action.payload;
      
      state.priceAlerts.push({
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        symbol: symbol.toUpperCase(),
        targetPrice,
        condition, // 'above', 'below', 'equal'
        message,
        isActive: true,
        createdAt: new Date().toISOString()
      });
    },

    removePriceAlert: (state, action) => {
      const { alertId } = action.payload;
      state.priceAlerts = state.priceAlerts.filter(alert => alert.id !== alertId);
    },

    triggerPriceAlert: (state, action) => {
      const { alertId, triggerPrice } = action.payload;
      const alert = state.priceAlerts.find(alert => alert.id === alertId);
      if (alert) {
        alert.isActive = false;
        alert.triggeredAt = new Date().toISOString();
        alert.triggerPrice = triggerPrice;
      }
    },

    updatePriceAlert: (state, action) => {
      const { alertId, updates } = action.payload;
      const alertIndex = state.priceAlerts.findIndex(alert => alert.id === alertId);
      if (alertIndex !== -1) {
        state.priceAlerts[alertIndex] = {
          ...state.priceAlerts[alertIndex],
          ...updates,
          updatedAt: new Date().toISOString()
        };
      }
    },

    // UI management
    selectSymbol: (state, action) => {
      state.selectedSymbol = action.payload;
    },

    // Vendor management
    updateVendorStatus: (state, action) => {
      const { vendorId, status } = action.payload;
      state.vendorStatus[vendorId] = {
        ...state.vendorStatus[vendorId],
        ...status,
        lastUpdate: new Date().toISOString()
      };
    },

    // Connection health
    connectionHealthUpdated: (state, action) => {
      const { missedUpdates, lastUpdate, vendor } = action.payload;
      
      state.connectionHealth = {
        ...state.connectionHealth,
        missedUpdates: missedUpdates || state.connectionHealth.missedUpdates,
        lastUpdate: lastUpdate || state.connectionHealth.lastUpdate
      };
      
      if (vendor) {
        state.vendorStatus[vendor] = {
          ...state.vendorStatus[vendor],
          lastUpdate: lastUpdate || new Date().toISOString(),
          missedUpdates: missedUpdates || 0
        };
      }
    },

    incrementMissedUpdates: (state) => {
      state.connectionHealth.missedUpdates += 1;
    },

    // Data cleanup
    clearOldPrices: (state, action) => {
      const { olderThanMinutes = 30 } = action.payload || {};
      const cutoffTime = new Date(Date.now() - olderThanMinutes * 60 * 1000);
      
      Object.keys(state.prices).forEach(symbol => {
        const priceData = state.prices[symbol];
        const lastUpdate = new Date(priceData.lastUpdated || priceData.timestamp);
        
        if (lastUpdate < cutoffTime) {
          delete state.prices[symbol];
          delete state.vendorData[symbol];
        }
      });
      
      state.statistics.symbolsTracked = Object.keys(state.prices).length;
    },

    clearAllPrices: (state) => {
      state.prices = {};
      state.vendorData = {};
      state.statistics.symbolsTracked = 0;
      state.statistics.updateCount = 0;
    },

    // Performance tracking
    updatePerformanceLists: (state) => {
      updatePerformanceListss(state);
    }
  }
});

// Helper function to check price alerts
const checkPriceAlerts = (state, symbol, currentPrice) => {
  const activeAlerts = state.priceAlerts.filter(
    alert => alert.symbol === symbol && alert.isActive
  );

  activeAlerts.forEach(alert => {
    let triggered = false;
    
    switch (alert.condition) {
      case 'above':
        triggered = currentPrice > alert.targetPrice;
        break;
      case 'below':
        triggered = currentPrice < alert.targetPrice;
        break;
      case 'equal':
        triggered = Math.abs(currentPrice - alert.targetPrice) < 0.01;
        break;
    }

    if (triggered) {
      alert.isActive = false;
      alert.triggeredAt = new Date().toISOString();
      alert.triggerPrice = currentPrice;
    }
  });
};

// Helper function to update performance lists
function updatePerformanceListss (state) {
  const pricesWithChange = Object.entries(state.prices)
    .filter(([symbol, data]) => data.changePercent !== undefined && data.changePercent !== null)
    .map(([symbol, data]) => ({ symbol, ...data }));

  // Top gainers
  state.performance.topGainers = pricesWithChange
    .filter(item => item.changePercent > 0)
    .sort((a, b) => b.changePercent - a.changePercent)
    .slice(0, 20);

  // Top losers
  state.performance.topLosers = pricesWithChange
    .filter(item => item.changePercent < 0)
    .sort((a, b) => a.changePercent - b.changePercent)
    .slice(0, 20);

  // Most active (by volume)
  state.performance.mostActive = pricesWithChange
    .filter(item => item.volume && item.volume > 0)
    .sort((a, b) => (b.volume || 0) - (a.volume || 0))
    .slice(0, 20);
};

export const {
  priceUpdated,
  marketDataReceived,
  symbolSubscribed,
  symbolUnsubscribed,
  bulkSubscribe,
  bulkUnsubscribe,
  clearAllSubscriptions,
  historicalDataReceived,
  marketStatusUpdated,
  addPriceAlert,
  removePriceAlert,
  triggerPriceAlert,
  updatePriceAlert,
  selectSymbol,
  updateVendorStatus,
  connectionHealthUpdated,
  incrementMissedUpdates,
  clearOldPrices,
  clearAllPrices,
  updatePerformanceLists
} = marketDataSlice.actions;

export default marketDataSlice.reducer;

// Selectors
export const selectAllPrices = (state) => state.marketData.prices;
export const selectPriceBySymbol = (symbol) => (state) => 
  state.marketData.prices[symbol?.toUpperCase()];
export const selectSubscriptions = (state) => [...state.marketData.subscriptions];
export const selectIsSubscribed = (symbol) => (state) => 
  state.marketData.subscriptions.has(symbol?.toUpperCase());
export const selectMarketDataStatistics = (state) => state.marketData.statistics;
export const selectMarketStatus = (state) => state.marketData.marketStatus;
export const selectHistoricalData = (symbol, timeframe) => (state) => 
  state.marketData.historical[symbol?.toUpperCase()]?.[timeframe];
export const selectPriceAlerts = (state) => state.marketData.priceAlerts;
export const selectActivePriceAlerts = (state) => 
  state.marketData.priceAlerts.filter(alert => alert.isActive);
export const selectTriggeredPriceAlerts = (state) => 
  state.marketData.priceAlerts.filter(alert => !alert.isActive && alert.triggeredAt);
export const selectSelectedSymbol = (state) => state.marketData.selectedSymbol;
export const selectConnectionHealth = (state) => state.marketData.connectionHealth;
export const selectVendorData = (state) => state.marketData.vendorData;
export const selectVendorStatus = (state) => state.marketData.vendorStatus;
export const selectPerformance = (state) => state.marketData.performance;

export const selectTopMovers = (direction = 'up', limit = 10) => (state) => {
  const performance = state.marketData.performance;
  
  switch (direction) {
    case 'up':
      return performance.topGainers.slice(0, limit);
    case 'down':
      return performance.topLosers.slice(0, limit);
    case 'active':
      return performance.mostActive.slice(0, limit);
    default:
      return performance.topGainers.slice(0, limit);
  }
};

export const selectSymbolsByVendor = (vendorId) => (state) => {
  return Object.entries(state.marketData.vendorData)
    .filter(([symbol, vendor]) => vendor === vendorId)
    .map(([symbol, vendor]) => symbol);
};
