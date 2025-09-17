// src/app/dashboard/page.js
'use client';

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/use-redux-store.js';
import { MarketTicker } from '@/components/real-time/market-ticker-redux.js';
import { BotStatusWidget } from '@/components/real-time/bot-status-widget-redux.js';
import { VendorStatus } from '@/components/real-time/vendor-status.js';
import { 
  setPageLoading, 
  selectPinnedSymbols,
  selectPreferences,
  selectDashboardLayout,
  initializeFromStorage,
  updatePreferences,
  addPinnedSymbol,
  removePinnedSymbol
} from '@/store/slices/ui-slice.js';

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const [userId] = useState(1); // Mock user ID
  const [showSettings, setShowSettings] = useState(false);
  
  // UI state
  const pinnedSymbols = useAppSelector(selectPinnedSymbols);
  const preferences = useAppSelector(selectPreferences);
  const dashboardLayout = useAppSelector(selectDashboardLayout);
  const pageLoading = useAppSelector(state => state.ui.loading.page);
  
  // WebSocket status
  const globalStatus = useAppSelector(state => state.websocket.status.globalStatus);
  const connectionStats = useAppSelector(state => state.websocket.statistics);

  // Initialize UI from localStorage
  useEffect(() => {
    dispatch(initializeFromStorage());
    dispatch(setPageLoading(false));
  }, [dispatch]);

  const handleAddSymbol = (symbol) => {
    if (symbol && !pinnedSymbols.includes(symbol.toUpperCase())) {
      dispatch(addPinnedSymbol({ symbol }));
    }
  };

  const handleRemoveSymbol = (symbol) => {
    dispatch(removePinnedSymbol({ symbol }));
  };

  const handlePreferenceChange = (key, value) => {
    dispatch(updatePreferences({ [key]: value }));
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
          <div className="mt-4 text-gray-600">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Trading Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Real-time market data and bot management with vendor integration
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Connection status */}
              <div className="flex items-center text-sm bg-gray-50 px-3 py-2 rounded-lg">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  globalStatus === 'connected' ? 'bg-green-500' : 
                  globalStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <span className="font-medium">
                  {globalStatus === 'connected' ? 'All Connected' : 
                   globalStatus === 'connecting' ? 'Connecting...' : 'Issues'}
                </span>
                <span className="ml-2 text-gray-500">
                  ({connectionStats.activeConnections} active)
                </span>
              </div>
              
              {/* Settings button */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors"
              >
                ⚙️
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Settings Panel */}
        {showSettings && (
          <div className="mb-6 bg-white border rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-4">Dashboard Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  View Mode
                </label>
                <select
                  value={dashboardLayout.layout}
                  onChange={(e) => dispatch(updateDashboardLayout({ layout: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="default">Default</option>
                  <option value="compact">Compact</option>
                  <option value="detailed">Detailed</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Auto Refresh
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.autoRefresh}
                    onChange={(e) => handlePreferenceChange('autoRefresh', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="ml-2 text-sm">Enable auto refresh</span>
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Show Vendor Info
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.showVendorInfo}
                    onChange={(e) => handlePreferenceChange('showVendorInfo', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="ml-2 text-sm">Show data sources</span>
                </label>
              </div>
            </div>
            
            {/* Symbol Management */}
            <div className="mt-4 pt-4 border-t">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Watchlist Symbols</h4>
              <div className="flex flex-wrap gap-2 mb-3">
                {pinnedSymbols.map(symbol => (
                  <span key={symbol} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm flex items-center">
                    {symbol}
                    <button
                      onClick={() => handleRemoveSymbol(symbol)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex space-x-2">
                <SymbolInput onAdd={handleAddSymbol} />
              </div>
            </div>
          </div>
        )}

        {/* Widget Grid */}
        <div className="space-y-6">
          {/* Vendor Status */}
          {dashboardLayout.widgetOrder.includes('vendor-status') && (
            <VendorStatus 
              showDetails={preferences.showVendorInfo}
              className="w-full"
            />
          )}

          {/* Market Data Section */}
          {dashboardLayout.widgetOrder.includes('market') && (
            <MarketTicker 
              symbols={pinnedSymbols}
              className="w-full"
              showVendorInfo={preferences.showVendorInfo}
            />
          )}

          {/* Bots and Notifications Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bot Status */}
            {dashboardLayout.widgetOrder.includes('bots') && (
              <BotStatusWidget 
                userId={userId}
                showFilters={dashboardLayout.layout !== 'compact'}
                showStats={dashboardLayout.layout === 'detailed'}
              />
            )}
            
            {/* Additional widgets placeholder */}
            {dashboardLayout.widgetOrder.includes('notifications') && (
              <div className="bg-white border rounded-lg p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">System Online</div>
                      <div className="text-xs text-gray-500">All vendors connected successfully</div>
                    </div>
                    <div className="text-xs text-gray-500">now</div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">Market Data Streaming</div>
                      <div className="text-xs text-gray-500">{pinnedSymbols.length} symbols tracked</div>
                    </div>
                    <div className="text-xs text-gray-500">1m ago</div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">Dashboard Loaded</div>
                      <div className="text-xs text-gray-500">Ready for trading operations</div>
                    </div>
                    <div className="text-xs text-gray-500">2m ago</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Stats */}
        <div className="mt-8 bg-white border rounded-lg p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {connectionStats.totalMessages || 0}
              </div>
              <div className="text-sm text-gray-500">Messages Processed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {connectionStats.activeConnections || 0}
              </div>
              <div className="text-sm text-gray-500">Active Connections</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {pinnedSymbols.length}
              </div>
              <div className="text-sm text-gray-500">Tracked Symbols</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {connectionStats.lastActivity ? 
                  new Date(connectionStats.lastActivity).toLocaleTimeString() : 
                  '---'
                }
              </div>
              <div className="text-sm text-gray-500">Last Activity</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Symbol input component
function SymbolInput({ onAdd }) {
  const [symbol, setSymbol] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (symbol.trim()) {
      onAdd(symbol.trim().toUpperCase());
      setSymbol('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex">
      <input
        type="text"
        value={symbol}
        onChange={(e) => setSymbol(e.target.value)}
        placeholder="Add symbol (e.g., RELIANCE)"
        className="border rounded-l-lg px-3 py-1 text-sm flex-1"
      />
      <button
        type="submit"
        className="bg-blue-500 text-white px-3 py-1 rounded-r-lg text-sm hover:bg-blue-600"
      >
        Add
      </button>
    </form>
  );
}
