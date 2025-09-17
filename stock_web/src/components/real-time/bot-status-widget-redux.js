// src/components/real-time/bot-status-widget-redux.js
'use client';

import React, { useEffect, useState } from 'react';
import { useBotWebSocket } from '../../hooks/use-redux-websocket.js';
import { useAppDispatch, useAppSelector } from '../../hooks/use-redux-store.js';
import { 
  selectBot, 
  updateFilters, 
  selectFilteredBots,
  selectBotStatistics 
} from '../../store/slices/bots-slice.js';

export function BotStatusWidget({ userId, showFilters = true, showStats = true }) {
  const dispatch = useAppDispatch();
  const [confirmAction, setConfirmAction] = useState(null);
  
  const {
    userBots,
    realTimeUpdates,
    loading,
    connected,
    startBot,
    stopBot,
    updateBotConfig,
    restartBot,
    refreshBots
  } = useBotWebSocket(userId);

  const filteredBots = useAppSelector(selectFilteredBots);
  const statistics = useAppSelector(selectBotStatistics);
  const filters = useAppSelector(state => state.bots.filters);
  const selectedBotId = useAppSelector(state => state.bots.selectedBotId);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'running': return 'text-green-600 bg-green-100 border-green-200';
      case 'stopped': return 'text-gray-600 bg-gray-100 border-gray-200';
      case 'paused': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'error': return 'text-red-600 bg-red-100 border-red-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'running': return '▶️';
      case 'stopped': return '⏹️';
      case 'paused': return '⏸️';
      case 'error': return '❌';
      default: return '⚪';
    }
  };

  const handleBotAction = async (action, botId, config = {}) => {
    let success = false;
    
    switch (action) {
      case 'start':
        success = await startBot(botId, config);
        break;
      case 'stop':
        success = await stopBot(botId);
        break;
      case 'restart':
        success = await restartBot(botId);
        break;
      case 'update':
        success = await updateBotConfig(botId, config);
        break;
    }
    
    if (!success) {
      alert(`Failed to ${action} bot. Check connection.`);
    }
    
    setConfirmAction(null);
  };

  const handleBotSelect = (botId) => {
    dispatch(selectBot(selectedBotId === botId ? null : botId));
  };

  const handleFilterChange = (filterType, value) => {
    dispatch(updateFilters({ [filterType]: value }));
  };

  const getBotsToDisplay = () => {
    return showFilters ? filteredBots : userBots;
  };

  if (loading) {
    return (
      <div className="bg-white border rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex justify-between items-center p-3 border rounded">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="flex space-x-2">
                  <div className="h-8 w-16 bg-gray-200 rounded"></div>
                  <div className="h-8 w-16 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-gray-800">Trading Bots</h3>
          <div className="flex items-center space-x-3">
            <button
              onClick={refreshBots}
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              🔄 Refresh
            </button>
            <div className="flex items-center text-sm">
              <div className={`w-2 h-2 rounded-full mr-2 ${
                connected ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className={connected ? 'text-green-600' : 'text-red-600'}>
                {connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>

        {/* Statistics */}
        {showStats && (
          <div className="grid grid-cols-4 gap-3 mb-3">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">{statistics.totalBots}</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{statistics.runningBots}</div>
              <div className="text-xs text-gray-500">Running</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{statistics.totalTrades}</div>
              <div className="text-xs text-gray-500">Trades</div>
            </div>
            <div className="text-center">
              <div className={`text-lg font-bold ${statistics.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{statistics.totalPnL?.toFixed(0) || '0'}
              </div>
              <div className="text-xs text-gray-500">P&L</div>
            </div>
          </div>
        )}

        {/* Filters */}
        {showFilters && (
          <div className="flex flex-wrap gap-2">
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="text-xs border rounded px-2 py-1"
            >
              <option value="all">All Status</option>
              <option value="running">Running</option>
              <option value="stopped">Stopped</option>
              <option value="error">Error</option>
            </select>

            <select
              value={filters.strategy}
              onChange={(e) => handleFilterChange('strategy', e.target.value)}
              className="text-xs border rounded px-2 py-1"
            >
              <option value="all">All Strategies</option>
              <option value="RSI_EMA">RSI EMA</option>
              <option value="MACD">MACD</option>
              <option value="BOLLINGER">Bollinger Bands</option>
            </select>

            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="text-xs border rounded px-2 py-1"
            >
              <option value="name">Sort by Name</option>
              <option value="created">Sort by Created</option>
              <option value="lastRun">Sort by Last Run</option>
              <option value="pnl">Sort by P&L</option>
            </select>

            <button
              onClick={() => handleFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
              className="text-xs border rounded px-2 py-1 hover:bg-gray-100"
            >
              {filters.sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {!connected && (
          <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 text-yellow-800 rounded-lg">
            ⚠️ Bot engine disconnected. Bot controls may not work.
          </div>
        )}

        {getBotsToDisplay().length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🤖</div>
            <div>
              {userBots.length === 0 ? 'No trading bots found' : 'No bots match current filters'}
            </div>
            <div className="text-sm mt-1">
              {userBots.length === 0 ? 'Create your first bot to get started' : 'Try adjusting your filters'}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {getBotsToDisplay().map(bot => {
              const currentStatus = bot.currentStatus;
              const isRunning = currentStatus?.toLowerCase() === 'running';
              const realTimeData = bot.realTimeData;
              const isSelected = selectedBotId === bot.id;

              return (
                <div 
                  key={bot.id} 
                  className={`border rounded-lg p-4 transition-all hover:shadow-md cursor-pointer ${
                    isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => handleBotSelect(bot.id)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      {/* Bot Header */}
                      <div className="flex items-center mb-2">
                        <span className="text-lg mr-2">{getStatusIcon(currentStatus)}</span>
                        <h4 className="font-semibold text-gray-800">{bot.name}</h4>
                        <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(currentStatus)}`}>
                          {currentStatus?.toUpperCase()}
                        </span>
                        
                        {/* Operation indicators */}
                        {bot.isStarting && (
                          <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full animate-pulse">
                            Starting...
                          </span>
                        )}
                        {bot.isStopping && (
                          <span className="ml-2 px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full animate-pulse">
                            Stopping...
                          </span>
                        )}
                      </div>
                      
                      {/* Bot Info */}
                      <div className="text-sm text-gray-600 mb-2">
                        <div>Strategy: {bot.strategyType}</div>
                        <div>Max Investment: ₹{bot.maxInvestment?.toLocaleString()}</div>
                        <div>Stop Loss: {bot.stopLossPercentage}% | Target: {bot.targetPercentage}%</div>
                      </div>
                      
                      {/* Stock symbols */}
                      {bot.stocks && (
                        <div className="text-sm text-gray-500 mb-2">
                          <span className="font-medium">Stocks:</span> {bot.stocks.join(', ')}
                        </div>
                      )}

                      {/* Real-time info */}
                      {realTimeData?.lastUpdate && (
                        <div className="text-xs text-gray-500">
                          Last update: {new Date(realTimeData.lastUpdate).toLocaleTimeString()}
                        </div>
                      )}

                      {/* Error display */}
                      {realTimeData?.error && (
                        <div className="text-xs text-red-600 mt-1 bg-red-50 p-2 rounded">
                          ❌ Error: {realTimeData.error}
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col space-y-1 ml-4">
                      <div className="flex space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBotAction('start', bot.id);
                          }}
                          disabled={!connected || isRunning || bot.isStarting}
                          className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                            !connected || isRunning || bot.isStarting
                              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              : 'bg-green-500 text-white hover:bg-green-600'
                          }`}
                        >
                          Start
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBotAction('stop', bot.id);
                          }}
                          disabled={!connected || !isRunning || bot.isStopping}
                          className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                            !connected || !isRunning || bot.isStopping
                              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              : 'bg-red-500 text-white hover:bg-red-600'
                          }`}
                        >
                          Stop
                        </button>
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmAction({ action: 'restart', botId: bot.id });
                        }}
                        disabled={!connected}
                        className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                          !connected
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-yellow-500 text-white hover:bg-yellow-600'
                        }`}
                      >
                        Restart
                      </button>
                    </div>
                  </div>

                  {/* Performance metrics */}
                  {realTimeData && isSelected && (
                    <div className="pt-3 border-t border-gray-200">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        {realTimeData.trades_today !== undefined && (
                          <div>
                            <span className="text-gray-500">Trades Today:</span>
                            <span className="ml-2 font-medium">{realTimeData.trades_today}</span>
                          </div>
                        )}
                        {realTimeData.pnl_today !== undefined && (
                          <div>
                            <span className="text-gray-500">P&L Today:</span>
                            <span className={`ml-2 font-medium ${
                              realTimeData.pnl_today >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              ₹{realTimeData.pnl_today.toFixed(2)}
                            </span>
                          </div>
                        )}
                        {realTimeData.win_rate !== undefined && (
                          <div>
                            <span className="text-gray-500">Win Rate:</span>
                            <span className="ml-2 font-medium">{realTimeData.win_rate.toFixed(1)}%</span>
                          </div>
                        )}
                        {realTimeData.active_positions !== undefined && (
                          <div>
                            <span className="text-gray-500">Positions:</span>
                            <span className="ml-2 font-medium">{realTimeData.active_positions}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirm Action</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to {confirmAction.action} this bot?
              {confirmAction.action === 'restart' && ' This will stop and then start the bot.'}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleBotAction(confirmAction.action, confirmAction.botId)}
                className={`px-4 py-2 rounded text-white ${
                  confirmAction.action === 'restart' ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                {confirmAction.action === 'restart' ? 'Restart' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BotStatusWidget;
