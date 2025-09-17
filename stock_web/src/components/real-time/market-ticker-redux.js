// src/components/real-time/market-ticker-redux.js
'use client';

import React, { useEffect, useState } from 'react';
import { useMarketDataVendors } from '../../hooks/use-vendor-websocket.js';
import { useAppSelector, useAppDispatch } from '../../hooks/use-redux-store.js';
import { selectSymbol } from '../../store/slices/market-data-slice.js';

export function MarketTicker({ symbols = [], className = '', showVendorInfo = false }) {
  const dispatch = useAppDispatch();
  const [selectedSymbols, setSelectedSymbols] = useState(new Set());
  
  const { 
    marketData,
    vendorData,
    connectToVendor,
    switchVendorForSymbols,
    getVendorForSymbol,
    getConnectedMarketVendors,
    availableVendors
  } = useMarketDataVendors();

  const selectedSymbol = useAppSelector(state => state.marketData.selectedSymbol);
  const connectedVendors = getConnectedMarketVendors();

  // Subscribe to symbols when component mounts or symbols change
  useEffect(() => {
    if (connectedVendors.length > 0 && symbols.length > 0) {
      const primaryVendor = connectedVendors[0].vendorId;
      connectToVendor(primaryVendor, symbols);
    }
  }, [symbols, connectedVendors, connectToVendor]);

  const getPriceChangeClass = (change) => {
    if (change > 0) return 'text-green-600 bg-green-50 border-green-200';
    if (change < 0) return 'text-red-600 bg-red-50 border-red-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const formatPrice = (price) => {
    return price ? `₹${price.toFixed(2)}` : '---';
  };

  const formatChange = (change, changePercent) => {
    if (change === undefined || change === null) return '---';
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)} (${sign}${(changePercent || 0).toFixed(2)}%)`;
  };

  const formatVolume = (volume) => {
    if (!volume) return '---';
    if (volume >= 10000000) return `${(volume / 10000000).toFixed(1)}Cr`;
    if (volume >= 100000) return `${(volume / 100000).toFixed(1)}L`;
    if (volume >= 1000) return `${(volume / 1000).toFixed(1)}K`;
    return volume.toString();
  };

  const getVendorDisplayName = (vendorId) => {
    return vendorId?.replace('_', ' ').replace(/^\w/, c => c.toUpperCase()) || 'Unknown';
  };

  const handleSymbolClick = (symbol) => {
    dispatch(selectSymbol(symbol));
    setSelectedSymbols(prev => {
      const newSet = new Set(prev);
      if (newSet.has(symbol)) {
        newSet.delete(symbol);
      } else {
        newSet.add(symbol);
      }
      return newSet;
    });
  };

  const handleVendorSwitch = (symbol, newVendor) => {
    const currentVendor = getVendorForSymbol(symbol);
    if (currentVendor && currentVendor !== newVendor) {
      switchVendorForSymbols(currentVendor, newVendor, [symbol]);
    }
  };

  if (connectedVendors.length === 0) {
    return (
      <div className={`bg-red-100 border border-red-300 text-red-800 px-4 py-2 rounded-lg ${className}`}>
        <div className="flex items-center">
          <div className="animate-pulse w-2 h-2 bg-red-500 rounded-full mr-2"></div>
          <span>No market data vendors connected</span>
          <button 
            className="ml-4 px-2 py-1 bg-red-200 text-red-800 rounded text-sm hover:bg-red-300"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-3 border-b bg-gray-50">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-gray-800 flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            Live Market Data
            <span className="ml-2 text-xs text-gray-500">
              ({Object.keys(marketData).length} symbols tracked)
            </span>
          </h3>
          
          <div className="flex items-center space-x-2">
            {showVendorInfo && (
              <div className="text-xs text-gray-500">
                Connected: {connectedVendors.map(v => getVendorDisplayName(v.vendorId)).join(', ')}
              </div>
            )}
            
            <div className="flex items-center text-xs text-gray-500">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
              {connectedVendors.length} vendor{connectedVendors.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-3">
        {symbols.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            <div className="text-4xl mb-2">📊</div>
            <div>No symbols to display</div>
            <div className="text-sm mt-1">Add symbols to your watchlist</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {symbols.map(symbol => {
              const data = marketData[symbol];
              const vendor = getVendorForSymbol(symbol);
              const isSelected = selectedSymbols.has(symbol);
              const isGloballySelected = selectedSymbol === symbol;
              
              return (
                <div 
                  key={symbol} 
                  className={`border rounded-lg p-3 transition-all cursor-pointer hover:shadow-md ${
                    isGloballySelected ? 'ring-2 ring-blue-500 bg-blue-50' : 
                    isSelected ? 'ring-1 ring-gray-300 bg-gray-50' : ''
                  }`}
                  onClick={() => handleSymbolClick(symbol)}
                >
                  {/* Header */}
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-gray-800">{symbol}</span>
                      {data?.priceDirection && (
                        <span className="text-sm">
                          {data.priceDirection === 'up' ? '↗️' : 
                           data.priceDirection === 'down' ? '↘️' : '→'}
                        </span>
                      )}
                    </div>
                    
                    <div className="text-right">
                      {data && (
                        <span className="text-xs text-gray-500 block">
                          {data.timestamp && new Date(data.timestamp).toLocaleTimeString()}
                        </span>
                      )}
                      {showVendorInfo && vendor && (
                        <div className="text-xs text-gray-400 mt-1">
                          {getVendorDisplayName(vendor)}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Price Data */}
                  {!data ? (
                    <div className="space-y-2">
                      <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Current Price */}
                      <div className="text-xl font-bold text-gray-900 mb-2">
                        {formatPrice(data.ltp)}
                      </div>
                      
                      {/* Change */}
                      <div className={`text-sm font-medium px-2 py-1 rounded border ${getPriceChangeClass(data.change)}`}>
                        {formatChange(data.change, data.changePercent)}
                      </div>
                      
                      {/* OHLC + Volume */}
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="block text-gray-500">Open</span>
                          <span className="font-medium">{formatPrice(data.open)}</span>
                        </div>
                        <div>
                          <span className="block text-gray-500">Volume</span>
                          <span className="font-medium">{formatVolume(data.volume)}</span>
                        </div>
                        <div>
                          <span className="block text-gray-500">High</span>
                          <span className="font-medium text-green-600">{formatPrice(data.high)}</span>
                        </div>
                        <div>
                          <span className="block text-gray-500">Low</span>
                          <span className="font-medium text-red-600">{formatPrice(data.low)}</span>
                        </div>
                      </div>
                      
                      {/* Vendor Controls */}
                      {showVendorInfo && isSelected && connectedVendors.length > 1 && (
                        <div className="mt-3 pt-2 border-t">
                          <div className="text-xs text-gray-500 mb-1">Switch Vendor:</div>
                          <div className="flex flex-wrap gap-1">
                            {connectedVendors.map(({ vendorId }) => (
                              <button
                                key={vendorId}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleVendorSwitch(symbol, vendorId);
                                }}
                                className={`px-2 py-1 text-xs rounded ${
                                  vendor === vendorId
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                              >
                                {getVendorDisplayName(vendorId)}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Footer with vendor status */}
      {showVendorInfo && (
        <div className="px-3 py-2 border-t bg-gray-50 text-xs text-gray-500">
          <div className="flex justify-between items-center">
            <span>Market Data Sources:</span>
            <div className="flex space-x-2">
              {availableVendors.map(vendorId => {
                const isConnected = connectedVendors.some(v => v.vendorId === vendorId);
                return (
                  <span key={vendorId} className={`px-1 py-0.5 rounded ${
                    isConnected ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {getVendorDisplayName(vendorId)}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MarketTicker;
