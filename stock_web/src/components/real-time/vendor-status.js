// src/components/real-time/vendor-status.js
'use client';

import React, { useState, useEffect } from 'react';
import { useVendorHealth, useVendorConnections } from '../../hooks/use-vendor-websocket.js';
import { VENDOR_TYPES } from '../../utils/constants.js';

export function VendorStatus({ showDetails = false, className = '' }) {
  const { healthReport, vendorStatuses, getVendorsByType } = useVendorHealth();
  const { reconnectVendor, updateVendorStatuses } = useVendorConnections();
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showReconnectModal, setShowReconnectModal] = useState(false);

  useEffect(() => {
    // Update vendor statuses every 5 seconds
    const interval = setInterval(updateVendorStatuses, 5000);
    return () => clearInterval(interval);
  }, [updateVendorStatuses]);

  const getStatusColor = (isConnected, hasError = false) => {
    if (hasError) return 'text-red-600 bg-red-100 border-red-200';
    if (isConnected) return 'text-green-600 bg-green-100 border-green-200';
    return 'text-gray-600 bg-gray-100 border-gray-200';
  };

  const getStatusIcon = (isConnected, hasError = false) => {
    if (hasError) return '❌';
    if (isConnected) return '✅';
    return '⚪';
  };

  const formatUptime = (uptime) => {
    if (!uptime) return '---';
    const seconds = Math.floor(uptime / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
  };

  const handleReconnect = async (vendorId) => {
    setShowReconnectModal(false);
    const success = await reconnectVendor(vendorId);
    if (!success) {
      alert(`Failed to reconnect to ${vendorId}`);
    }
  };

  const getVendorDisplayName = (vendorId) => {
    return vendorId.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const marketDataVendors = getVendorsByType(VENDOR_TYPES.MARKET_DATA);
  const brokerVendors = getVendorsByType(VENDOR_TYPES.BROKER);
  const newsVendors = getVendorsByType(VENDOR_TYPES.NEWS);

  return (
    <div className={`bg-white border rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-gray-800">Vendor Status</h3>
          
          {healthReport && (
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  healthReport.healthPercentage >= 80 ? 'bg-green-500' : 
                  healthReport.healthPercentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <span>{healthReport.healthPercentage}% Healthy</span>
              </div>
              
              <span className="text-gray-500">
                {healthReport.connected}/{healthReport.total} Connected
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Market Data Vendors */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            📊 Market Data Providers
            <span className="ml-2 text-xs text-gray-500">
              ({marketDataVendors.filter(v => v.status.isConnected).length}/{marketDataVendors.length})
            </span>
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {marketDataVendors.map(({ vendorId, status }) => (
              <VendorCard
                key={vendorId}
                vendorId={vendorId}
                status={status}
                onReconnect={handleReconnect}
                onShowDetails={() => setSelectedVendor(vendorId)}
                showDetails={showDetails}
              />
            ))}
          </div>
        </div>

        {/* Broker Vendors */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            🏦 Broker Connections
            <span className="ml-2 text-xs text-gray-500">
              ({brokerVendors.filter(v => v.status.isConnected).length}/{brokerVendors.length})
            </span>
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {brokerVendors.map(({ vendorId, status }) => (
              <VendorCard
                key={vendorId}
                vendorId={vendorId}
                status={status}
                onReconnect={handleReconnect}
                onShowDetails={() => setSelectedVendor(vendorId)}
                showDetails={showDetails}
              />
            ))}
          </div>
        </div>

        {/* News Vendors */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            📰 News Sources
            <span className="ml-2 text-xs text-gray-500">
              ({newsVendors.filter(v => v.status.isConnected).length}/{newsVendors.length})
            </span>
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {newsVendors.map(({ vendorId, status }) => (
              <VendorCard
                key={vendorId}
                vendorId={vendorId}
                status={status}
                onReconnect={handleReconnect}
                onShowDetails={() => setSelectedVendor(vendorId)}
                showDetails={showDetails}
              />
            ))}
          </div>
        </div>

        {/* Overall Health */}
        {healthReport && (
          <div className="pt-4 border-t">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">{healthReport.connected}</div>
                <div className="text-xs text-gray-500">Connected</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-red-600">{healthReport.disconnected}</div>
                <div className="text-xs text-gray-500">Disconnected</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">{healthReport.authenticated}</div>
                <div className="text-xs text-gray-500">Authenticated</div>
              </div>
              <div className="text-center">
                <div className={`text-lg font-bold ${
                  healthReport.hasErrors ? 'text-red-600' : 'text-green-600'
                }`}>
                  {healthReport.hasErrors ? 'Yes' : 'No'}
                </div>
                <div className="text-xs text-gray-500">Errors</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Vendor Details Modal */}
      {selectedVendor && (
        <VendorDetailsModal
          vendorId={selectedVendor}
          status={vendorStatuses[selectedVendor]}
          onClose={() => setSelectedVendor(null)}
          onReconnect={handleReconnect}
        />
      )}
    </div>
  );
}

// Individual vendor card component
function VendorCard({ vendorId, status, onReconnect, onShowDetails, showDetails }) {
  const getStatusColor = (isConnected, hasError = false) => {
    if (hasError) return 'text-red-600 bg-red-100 border-red-200';
    if (isConnected) return 'text-green-600 bg-green-100 border-green-200';
    return 'text-gray-600 bg-gray-100 border-gray-200';
  };

  const getStatusIcon = (isConnected, hasError = false) => {
    if (hasError) return '❌';
    if (isConnected) return '✅';
    return '⚪';
  };

  const getVendorDisplayName = (vendorId) => {
    return vendorId.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatUptime = (uptime) => {
    if (!uptime) return '---';
    const seconds = Math.floor(uptime / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
  };

  return (
    <div className="border rounded-lg p-3 hover:shadow-sm transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getStatusIcon(status.isConnected, status.lastError)}</span>
          <div>
            <div className="font-medium text-sm">{getVendorDisplayName(vendorId)}</div>
            <div className={`text-xs px-2 py-0.5 rounded-full border ${
              getStatusColor(status.isConnected, status.lastError)
            }`}>
              {status.isConnected ? 'Connected' : 'Disconnected'}
            </div>
          </div>
        </div>
        
        <div className="flex space-x-1">
          {showDetails && (
            <button
              onClick={onShowDetails}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Details
            </button>
          )}
          {!status.isConnected && (
            <button
              onClick={() => onReconnect(vendorId)}
              className="text-xs text-green-600 hover:text-green-800"
            >
              Reconnect
            </button>
          )}
        </div>
      </div>
      
      {status.isConnected && (
        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex justify-between">
            <span>Messages:</span>
            <span>{status.messageCount || 0}</span>
          </div>
          <div className="flex justify-between">
            <span>Uptime:</span>
            <span>{formatUptime(status.uptime)}</span>
          </div>
          {status.subscriptions && status.subscriptions.length > 0 && (
            <div className="flex justify-between">
              <span>Subscriptions:</span>
              <span>{status.subscriptions.length}</span>
            </div>
          )}
        </div>
      )}
      
      {status.lastError && (
        <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
          Error: {status.lastError}
        </div>
      )}
    </div>
  );
}

// Vendor details modal
function VendorDetailsModal({ vendorId, status, onClose, onReconnect }) {
  const getVendorDisplayName = (vendorId) => {
    return vendorId.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-96 overflow-y-auto">
        <div className="p-4 border-b bg-gray-50">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">{getVendorDisplayName(vendorId)}</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>
        </div>
        
        <div className="p-4">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Status:</span>
              <span className={status.isConnected ? 'text-green-600' : 'text-red-600'}>
                {status.isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-500">Authenticated:</span>
              <span className={status.isAuthenticated ? 'text-green-600' : 'text-red-600'}>
                {status.isAuthenticated ? 'Yes' : 'No'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-500">Messages:</span>
              <span>{status.messageCount || 0}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-500">Reconnect Attempts:</span>
              <span>{status.reconnectAttempts || 0}</span>
            </div>
            
            {status.uptime && (
              <div className="flex justify-between">
                <span className="text-gray-500">Uptime:</span>
                <span>{Math.floor(status.uptime / 1000)}s</span>
              </div>
            )}
            
            {status.subscriptions && status.subscriptions.length > 0 && (
              <div>
                <div className="text-gray-500 mb-2">Subscriptions ({status.subscriptions.length}):</div>
                <div className="bg-gray-50 p-2 rounded text-xs max-h-20 overflow-y-auto">
                  {status.subscriptions.join(', ')}
                </div>
              </div>
            )}
            
            {status.lastError && (
              <div>
                <div className="text-gray-500 mb-2">Last Error:</div>
                <div className="bg-red-50 text-red-700 p-2 rounded text-xs">
                  {status.lastError}
                </div>
              </div>
            )}
          </div>
          
          {!status.isConnected && (
            <div className="mt-4 pt-4 border-t">
              <button
                onClick={() => {
                  onReconnect(vendorId);
                  onClose();
                }}
                className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600"
              >
                Reconnect
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VendorStatus;
