// src/components/websocket-connection-manager.js
'use client';

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/use-redux-store.js';
import { useVendorConnections } from '../hooks/use-vendor-websocket.js';
import { 
  initializeWebSocket,
  selectConnections,
  selectGlobalStatus,
  selectAreAllConnected,
  selectConnectionStatistics
} from '../store/slices/websocket-slice.js';

export function WebSocketConnectionManager({ children }) {
  const dispatch = useAppDispatch();
  const [userId, setUserId] = useState(null);
  
  // Redux state
  const connections = useAppSelector(selectConnections);
  const globalStatus = useAppSelector(selectGlobalStatus);
  const areAllConnected = useAppSelector(selectAreAllConnected);
  const statistics = useAppSelector(selectConnectionStatistics);
  
  // Vendor connections
  const { isInitialized, vendorStatuses } = useVendorConnections();

  // Get user ID from authentication
  useEffect(() => {
    const getUserId = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const user = await response.json();
          setUserId(user.id);
        }
      } catch (error) {
        console.error('Failed to get user ID:', error);
        // For demo purposes, use a mock user ID
        setUserId(1);
      }
    };

    getUserId();
  }, []);

  // Initialize WebSocket system
  useEffect(() => {
    console.log('🏗️ Initializing WebSocket system...');
    dispatch(initializeWebSocket());
  }, [dispatch]);

  return (
    <>
      {children}
      <ConnectionStatusIndicator 
        connections={connections}
        globalStatus={globalStatus}
        areAllConnected={areAllConnected}
        statistics={statistics}
        vendorStatuses={vendorStatuses}
        isVendorInitialized={isInitialized}
      />
    </>
  );
}

// Connection status indicator component
function ConnectionStatusIndicator({ 
  connections, 
  globalStatus, 
  areAllConnected, 
  statistics,
  vendorStatuses,
  isVendorInitialized
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showVendors, setShowVendors] = useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'text-green-600 bg-green-100';
      case 'connecting': return 'text-yellow-600 bg-yellow-100';
      case 'disconnected': return 'text-gray-600 bg-gray-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected': return '🟢';
      case 'connecting': return '🟡';
      case 'disconnected': return '⚪';
      case 'error': return '🔴';
      default: return '⚪';
    }
  };

  const getGlobalStatusColor = () => {
    switch (globalStatus) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatUptime = (uptime) => {
    if (!uptime) return '---';
    const seconds = Math.floor(uptime / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  // Separate regular connections from vendor connections
  const regularConnections = Object.entries(connections).filter(([id]) => 
    !Object.values(vendorStatuses).find(v => v.vendorId === id)
  );

  const vendorConnections = Object.entries(vendorStatuses);

  return (
    <div className="fixed top-4 right-4 z-50">
      {/* Compact indicator */}
      <div 
        className="bg-white border rounded-lg shadow-lg p-2 cursor-pointer hover:shadow-xl transition-shadow"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${getGlobalStatusColor()}`}></div>
          <span className="text-sm font-medium">
            {areAllConnected && isVendorInitialized ? 'All Connected' : 'Issues'}
          </span>
          <span className="text-xs text-gray-500">
            ({statistics.activeConnections + Object.values(vendorStatuses).filter(v => v.isConnected).length})
          </span>
          <button className="text-xs text-gray-500 hover:text-gray-700">
            {isExpanded ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* Expanded view */}
      {isExpanded && (
        <div className="mt-2 bg-white border rounded-lg shadow-lg p-3 min-w-80 max-w-96">
          <div className="text-sm font-semibold mb-3 text-gray-800">
            WebSocket Connections
          </div>
          
          {/* Tab switcher */}
          <div className="flex space-x-1 mb-3 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setShowVendors(false)}
              className={`flex-1 py-1 px-2 text-xs font-medium rounded transition-colors ${
                !showVendors ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Internal ({regularConnections.length})
            </button>
            <button
              onClick={() => setShowVendors(true)}
              className={`flex-1 py-1 px-2 text-xs font-medium rounded transition-colors ${
                showVendors ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Vendors ({vendorConnections.length})
            </button>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {!showVendors ? (
              // Regular connections
              <div className="space-y-2">
                {regularConnections.length === 0 ? (
                  <div className="text-xs text-gray-500 text-center py-2">
                    No internal connections
                  </div>
                ) : (
                  regularConnections.map(([connectionId, connection]) => (
                    <div key={connectionId} className="flex items-center justify-between text-xs border-b pb-2">
                      <div className="flex items-center space-x-2">
                        <span>{getStatusIcon(connection.status)}</span>
                        <span className="font-medium">
                          {connectionId.replace('_', ' ').replace(/^\w/, c => c.toUpperCase())}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(connection.status)}`}>
                          {connection.status}
                        </span>
                        
                        {connection.messageCount > 0 && (
                          <span className="text-gray-500">
                            ({connection.messageCount})
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              // Vendor connections
              <div className="space-y-2">
                {vendorConnections.length === 0 ? (
                  <div className="text-xs text-gray-500 text-center py-2">
                    No vendor connections
                  </div>
                ) : (
                  vendorConnections.map(([vendorId, status]) => (
                    <div key={vendorId} className="border-b pb-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <div className="flex items-center space-x-2">
                          <span>{getStatusIcon(status.isConnected ? 'connected' : 'disconnected')}</span>
                          <span className="font-medium">
                            {vendorId.replace('_', ' ').replace(/^\w/, c => c.toUpperCase())}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            getStatusColor(status.isConnected ? 'connected' : 'disconnected')
                          }`}>
                            {status.isConnected ? 'Connected' : 'Disconnected'}
                          </span>
                        </div>
                      </div>
                      
                      {status.isConnected && (
                        <div className="text-xs text-gray-500 ml-6">
                          <div className="flex justify-between">
                            <span>Messages: {status.messageCount || 0}</span>
                            <span>Uptime: {formatUptime(status.uptime)}</span>
                          </div>
                          {status.subscriptions && status.subscriptions.length > 0 && (
                            <div className="mt-1">
                              Subscriptions: {status.subscriptions.slice(0, 3).join(', ')}
                              {status.subscriptions.length > 3 && ` +${status.subscriptions.length - 3}`}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {status.lastError && (
                        <div className="text-xs text-red-600 ml-6 mt-1">
                          Error: {status.lastError}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Overall statistics */}
          <div className="mt-3 pt-2 border-t text-xs text-gray-600">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-gray-500">Total Messages:</span>
                <span className="ml-1 font-medium">{statistics.totalMessages}</span>
              </div>
              <div>
                <span className="text-gray-500">Active:</span>
                <span className="ml-1 font-medium">
                  {statistics.activeConnections + Object.values(vendorStatuses).filter(v => v.isConnected).length}
                </span>
              </div>
            </div>
            
            {statistics.lastActivity && (
              <div className="mt-1">
                <span className="text-gray-500">Last Activity:</span>
                <span className="ml-1 font-medium">
                  {new Date(statistics.lastActivity).toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default WebSocketConnectionManager;
