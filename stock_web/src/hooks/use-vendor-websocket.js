// src/hooks/use-vendor-websocket.js
import { useEffect, useCallback, useState } from 'react';
import { useAppDispatch, useAppSelector } from './use-redux-store.js';
import { connectWebSocket, sendMessage } from '../store/slices/websocket-slice.js';
import { vendorManager } from '../lib/vendors/websocket-vendor-manager.js';
import { VENDOR_IDS, VENDOR_TYPES, MESSAGE_TYPES } from '../utils/constants.js';

export function useVendorConnections() {
  const dispatch = useAppDispatch();
  const [vendorStatuses, setVendorStatuses] = useState({});
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize vendor connections
  useEffect(() => {
    const initializeVendors = async () => {
      if (isInitialized) return;

      console.log('🚀 Initializing vendor WebSocket connections...');
      
      try {
        // Connect to all available vendors
        const result = await vendorManager.connectAllVendors();
        console.log(`✅ Connected to ${result.connected}/${result.total} vendors`);
        
        setIsInitialized(true);
        
        // Update vendor statuses
        updateVendorStatuses();
        
      } catch (error) {
        console.error('❌ Failed to initialize vendors:', error);
      }
    };

    initializeVendors();

    // Set up status update interval
    const statusInterval = setInterval(updateVendorStatuses, 5000);

    return () => {
      clearInterval(statusInterval);
    };
  }, [isInitialized]);

  const updateVendorStatuses = useCallback(() => {
    const statuses = vendorManager.getAllVendorStatuses();
    setVendorStatuses(statuses);
  }, []);

  const subscribeToMarketData = useCallback((symbols, preferredVendor = VENDOR_IDS.YAHOO_FINANCE) => {
    const symbolsArray = Array.isArray(symbols) ? symbols : [symbols];
    
    return dispatch(sendMessage({
      connectionId: preferredVendor,
      data: {
        type: MESSAGE_TYPES.SUBSCRIBE_MARKET,
        symbols: symbolsArray
      }
    }));
  }, [dispatch]);

  const subscribeToNews = useCallback((categories = ['general'], preferredVendor = VENDOR_IDS.FINNHUB_NEWS) => {
    return dispatch(sendMessage({
      connectionId: preferredVendor,
      data: {
        type: MESSAGE_TYPES.SUBSCRIBE_NEWS,
        categories: Array.isArray(categories) ? categories : [categories]
      }
    }));
  }, [dispatch]);

  const subscribeToBrokerUpdates = useCallback((preferredVendor = VENDOR_IDS.ICICI_BREEZE) => {
    return dispatch(sendMessage({
      connectionId: preferredVendor,
      data: {
        type: 'subscribe_broker_updates'
      }
    }));
  }, [dispatch]);

  const switchMarketDataVendor = useCallback((fromVendor, toVendor, symbols) => {
    // Unsubscribe from current vendor
    dispatch(sendMessage({
      connectionId: fromVendor,
      data: {
        type: MESSAGE_TYPES.UNSUBSCRIBE_MARKET,
        symbols
      }
    }));

    // Subscribe to new vendor
    return dispatch(sendMessage({
      connectionId: toVendor,
      data: {
        type: MESSAGE_TYPES.SUBSCRIBE_MARKET,
        symbols
      }
    }));
  }, [dispatch]);

  const reconnectVendor = useCallback(async (vendorId) => {
    try {
      await vendorManager.disconnectVendor(vendorId);
      await vendorManager.connectVendor(vendorId);
      updateVendorStatuses();
      return true;
    } catch (error) {
      console.error(`Failed to reconnect ${vendorId}:`, error);
      return false;
    }
  }, [updateVendorStatuses]);

  const getHealthReport = useCallback(() => {
    return vendorManager.getHealthReport();
  }, []);

  return {
    // State
    vendorStatuses,
    isInitialized,
    
    // Actions
    subscribeToMarketData,
    subscribeToNews,
    subscribeToBrokerUpdates,
    switchMarketDataVendor,
    reconnectVendor,
    updateVendorStatuses,
    getHealthReport
  };
}

export function useMarketDataVendors() {
  const { subscribeToMarketData, switchMarketDataVendor, vendorStatuses } = useVendorConnections();
  const marketData = useAppSelector(state => state.marketData.prices);
  const vendorData = useAppSelector(state => state.marketData.vendorData);
  
  const connectToVendor = useCallback((vendorId, symbols = []) => {
    return subscribeToMarketData(symbols, vendorId);
  }, [subscribeToMarketData]);

  const getVendorForSymbol = useCallback((symbol) => {
    return vendorData[symbol?.toUpperCase()];
  }, [vendorData]);

  const getConnectedMarketVendors = useCallback(() => {
    return Object.entries(vendorStatuses)
      .filter(([vendorId, status]) => {
        return Object.values(VENDOR_IDS).includes(vendorId) && 
               status.isConnected &&
               [VENDOR_IDS.YAHOO_FINANCE, VENDOR_IDS.ALPHA_VANTAGE, VENDOR_IDS.ICICI_BREEZE, VENDOR_IDS.ZERODHA_KITE].includes(vendorId);
      })
      .map(([vendorId, status]) => ({ vendorId, status }));
  }, [vendorStatuses]);

  const switchVendorForSymbols = useCallback((fromVendor, toVendor, symbols) => {
    return switchMarketDataVendor(fromVendor, toVendor, symbols);
  }, [switchMarketDataVendor]);

  return {
    // Data
    marketData,
    vendorData,
    vendorStatuses,
    
    // Actions
    connectToVendor,
    switchVendorForSymbols,
    getVendorForSymbol,
    getConnectedMarketVendors,
    
    // Available vendors
    availableVendors: [
      VENDOR_IDS.YAHOO_FINANCE,
      VENDOR_IDS.ALPHA_VANTAGE,
      VENDOR_IDS.ICICI_BREEZE,
      VENDOR_IDS.ZERODHA_KITE,
      VENDOR_IDS.ANGEL_ONE
    ]
  };
}

export function useBrokerVendors() {
  const { subscribeToBrokerUpdates, vendorStatuses } = useVendorConnections();
  const dispatch = useAppDispatch();
  
  const connectToBroker = useCallback((vendorId) => {
    return subscribeToBrokerUpdates(vendorId);
  }, [subscribeToBrokerUpdates]);

  const subscribeToMarketDataFromBroker = useCallback((vendorId, symbols) => {
    return dispatch(sendMessage({
      connectionId: vendorId,
      data: {
        type: MESSAGE_TYPES.SUBSCRIBE_MARKET,
        symbols: Array.isArray(symbols) ? symbols : [symbols]
      }
    }));
  }, [dispatch]);

  const getConnectedBrokers = useCallback(() => {
    const brokerVendors = [VENDOR_IDS.ICICI_BREEZE, VENDOR_IDS.ZERODHA_KITE, VENDOR_IDS.ANGEL_ONE];
    
    return Object.entries(vendorStatuses)
      .filter(([vendorId, status]) => {
        return brokerVendors.includes(vendorId) && status.isConnected;
      })
      .map(([vendorId, status]) => ({ vendorId, status }));
  }, [vendorStatuses]);

  const placeOrder = useCallback((vendorId, orderData) => {
    return dispatch(sendMessage({
      connectionId: vendorId,
      data: {
        type: 'place_order',
        ...orderData,
        timestamp: new Date().toISOString()
      }
    }));
  }, [dispatch]);

  return {
    // State
    vendorStatuses,
    
    // Actions
    connectToBroker,
    subscribeToMarketDataFromBroker,
    getConnectedBrokers,
    placeOrder,
    
    // Available brokers
    availableBrokers: [
      VENDOR_IDS.ICICI_BREEZE,
      VENDOR_IDS.ZERODHA_KITE,
      VENDOR_IDS.ANGEL_ONE
    ]
  };
}

export function useNewsVendors() {
  const { subscribeToNews, vendorStatuses } = useVendorConnections();
  const notifications = useAppSelector(state => 
    state.notifications.notifications.filter(n => n.type === 'news' || n.type === 'news_update')
  );
  
  const connectToNews = useCallback((categories = ['general']) => {
    return subscribeToNews(categories, VENDOR_IDS.FINNHUB_NEWS);
  }, [subscribeToNews]);

  const subscribeToNewsCategories = useCallback((categories) => {
    return subscribeToNews(categories, VENDOR_IDS.FINNHUB_NEWS);
  }, [subscribeToNews]);

  const getNewsVendorStatus = useCallback(() => {
    return vendorStatuses[VENDOR_IDS.FINNHUB_NEWS] || { isConnected: false };
  }, [vendorStatuses]);

  return {
    // Data
    newsNotifications: notifications,
    vendorStatus: getNewsVendorStatus(),
    
    // Actions
    connectToNews,
    subscribeToNewsCategories,
    
    // Available categories
    availableCategories: [
      'general',
      'market',
      'crypto',
      'forex',
      'indian_market'
    ]
  };
}

export function useVendorHealth() {
  const { getHealthReport, vendorStatuses } = useVendorConnections();
  const [healthReport, setHealthReport] = useState(null);

  useEffect(() => {
    const updateHealthReport = () => {
      const report = getHealthReport();
      setHealthReport(report);
    };

    updateHealthReport();
    const interval = setInterval(updateHealthReport, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [getHealthReport]);

  const getVendorsByType = useCallback((type) => {
    return Object.entries(vendorStatuses)
      .filter(([vendorId, status]) => {
        // Get vendor type from constants
        const vendorConfig = Object.entries(VENDOR_IDS).find(([key, id]) => id === vendorId);
        if (!vendorConfig) return false;
        
        // This is a simplified check - in practice you'd want to store vendor types
        switch (type) {
          case VENDOR_TYPES.MARKET_DATA:
            return [VENDOR_IDS.YAHOO_FINANCE, VENDOR_IDS.ALPHA_VANTAGE].includes(vendorId);
          case VENDOR_TYPES.BROKER:
            return [VENDOR_IDS.ICICI_BREEZE, VENDOR_IDS.ZERODHA_KITE, VENDOR_IDS.ANGEL_ONE].includes(vendorId);
          case VENDOR_TYPES.NEWS:
            return [VENDOR_IDS.FINNHUB_NEWS].includes(vendorId);
          default:
            return false;
        }
      })
      .map(([vendorId, status]) => ({ vendorId, status }));
  }, [vendorStatuses]);

  return {
    healthReport,
    vendorStatuses,
    getVendorsByType
  };
}
