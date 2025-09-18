import { useState, useEffect, useCallback, useMemo } from 'react';
import { FaPlay, FaStop, FaCheck, FaPlus, FaTrash, FaEquals, FaArrowUp, FaArrowDown, FaExchangeAlt, FaGreaterThanEqual, FaLessThanEqual, FaWaveSquare, FaChartLine, FaArrowRight, FaCog, FaUser, FaDollarSign } from 'react-icons/fa';
import { MdOutlineRefresh, MdOutlineAirplanemodeInactive, MdOutlineAirplanemodeActive } from 'react-icons/md';
import { FcExpand } from 'react-icons/fc';
import { IoIosArrowUp } from 'react-icons/io';
import { HiOutlineArrowsExpand } from 'react-icons/hi';
import { BiCollapse } from 'react-icons/bi';
import { VscRunAll } from 'react-icons/vsc';

// Static Data
const USERS = ['VACHI', 'SWADESH', 'RAMKISHAN', 'RAMKISHANHUF', 'SWADESHHUF'];
const ALLSTOCKS = ['AADHOS', 'AARIND', 'ABB', 'ABBIND', 'ABBPOW', 'ACMSOL', 'ACTCON', 'ADATRA', 'ADAWIL', 'ADIAMC', 'AEGLOG', 'AFCINF', 'AJAPHA', 'AKUDRU', 'ALKAMI', 'ALKLAB', 'ALSTD', 'AMARAJ', 'AMBCE', 'AMIORG', 'ANARAT', 'APAIND', 'APLAPO', 'ASHLEY', 'ASTDM', 'ASTPOL', 'ATUL', 'BAJHOU', 'BALCHI', 'BANBAN', 'BASF', 'BHADYN', 'BHAELE', 'BHAFOR', 'BHAHEX', 'BIKFOO', 'BIRCOR', 'BLUDAR', 'BOMBUR', 'BRASOL', 'BRIENT', 'BSE', 'CADHEA', 'CAMACT', 'CAPPOI', 'CAREVE', 'CCLPRO', 'CDSL', 'CEINFO', 'CERSAN', 'CHEPET', 'CITUNI', 'CLESCI', 'COALIN', 'COCSHI', 'CONBIO', 'CRAAUT', 'CROGR', 'CROGRE', 'CYILIM', 'DATPAT', 'DCMSHR', 'DEEFER', 'DELLIM', 'DIVLAB', 'DOMIND', 'DRLAL', 'ECLSER', 'EIDPAR', 'EMALIM', 'EMCPHA', 'ENDTEC', 'ESCORT', 'EXIIND', 'FDC', 'FINCAB', 'FIRSOU', 'FSNECO', 'GAIL', 'GARREA', 'GIC', 'GLAPH', 'GLELIF', 'GLEPHA', 'GLOHEA', 'GODIGI', 'GODPRO', 'GOKEXP', 'GRAVIN', 'GUJGA', 'GUJPPL', 'HAPMIN', 'HBLPOW', 'HDFAMC', 'HILLTD', 'HIMCHE', 'HINAER', 'HINCON', 'HINCOP', 'HINDAL', 'HINPET', 'HONAUT', 'HONCON', 'HYUMOT', 'IIFHOL', 'IIFWEA', 'INDBA', 'INDLTD', 'INDOVE', 'INDR', 'INDRAI', 'INDREN', 'INFEDG', 'INOIND', 'INOWIN', 'INTGEM', 'INVKNO', 'IPCLAB', 'IRBINF', 'IRCINT', 'JAMKAS', 'JBCHEM', 'JBMAUT', 'JINSAW', 'JINSP', 'JINSTA', 'JIOFIN', 'JKCEME', 'JMFINA', 'JSWENE', 'JSWHOL', 'JSWINF', 'JYOCNC', 'KALJEW', 'KALPOW', 'KANNER', 'KARVYS', 'KAYTEC', 'KCPLTD', 'KECIN', 'KFITEC', 'KIRBRO', 'KIRENG', 'KPITE', 'KPITEC', 'KPRMIL', 'KRIINS', 'LATVIE', 'LAULAB', 'LEMTRE', 'LIC', 'LININ', 'LLOMET', 'LTOVER', 'LTTEC', 'MAPHA', 'MCX', 'MININD', 'MOLPAC', 'MOTOSW', 'MOTSU', 'MUTFIN', 'NARHRU', 'NATALU', 'NATPHA', 'NETTEC', 'NEULAB', 'NEWSOF', 'NHPC', 'NIVBUP', 'NOCIL', 'NTPGRE', 'NUVWEA', 'OBEREA', 'OLAELE', 'ORAFIN', 'ORIREF', 'PAGIND', 'PBFINT', 'PEAGL', 'PERSYS', 'PGELEC', 'PHICAR', 'PHOMIL', 'PIRPHA', 'POLI', 'PREENR', 'PREEST', 'PVRLIM', 'RAICHI', 'RAICOR', 'RAIVIK', 'RAMFOR', 'RATINF', 'RAYLIF', 'RELNIP', 'RENSUG', 'RITLIM', 'ROUMOB', 'RRKAB', 'RUCSOY', 'RURELE', 'SAIL', 'SAILIF', 'SAREIN', 'SARENE', 'SBFFIN', 'SCHELE', 'SHIME', 'SHRPIS', 'SHYMET', 'SIEMEN', 'SIGI', 'SKFIND', 'SOLIN', 'SONBLW', 'STAHEA', 'STYABS', 'SUDCHE', 'SUNFAS', 'SUNFIN', 'SUNPHA', 'SUPIND', 'SWAENE', 'SWILIM', 'TATCOM', 'TATELX', 'TATTE', 'TATTEC', 'TBOTEK', 'TECEEC', 'TECIND', 'TECMAH', 'TEJNET', 'THERMA', 'THICHE', 'TATMOT', 'TRILTD', 'TUBIN', 'TVSMOT', 'UCOBAN', 'UNIBAN', 'UNIP', 'UNISPI', 'UTIAMC', 'VARBEV', 'VARTEX', 'VEDFAS', 'VEDLIM', 'VIJDIA', 'VISMEG', 'VOLTAS', 'WAAENE', 'WABIND', 'WELIND', 'WHIIND', 'WOCKHA', 'XPRIND', 'ZENTE', 'ZOMLIM'];
console.log("ALLSTOCK:: length:: ", ALLSTOCKS.length)
const OPERATORS = [
  { value: '>', icon: <FaArrowUp />, label: 'Greater Than' },
  { value: '<', icon: <FaArrowDown />, label: 'Less Than' },
  { value: '>=', icon: <FaGreaterThanEqual />, label: 'Greater Than Equal' },
  { value: '<=', icon: <FaLessThanEqual />, label: 'Less Than Equal' },
  { value: '==', icon: <FaEquals />, label: 'Equal To' },
];

const INDICATORS = ['RSI_D', 'RSI_W', 'RSI_M', 'EMA_50_D', 'EMA_100_D', 'EMA_200_D', 'EMA_50_W', 'EMA_100_W', 'EMA_200_W', 'EMA_50_M', 'EMA_100_M', 'EMA_200_M', 'open', 'close', 'high', 'low', 'volume'];
const INTERVALS = ['1minute', '5minute', '30minute', '1day'];

// API utility functions
const apiCall = async (endpoint, method = 'GET', data = null) => {
  const config = {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  };

  if (data) config.body = JSON.stringify(data);

  const response = await fetch(endpoint, config);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || `Request failed with status ${response.status}`);
  }

  return result;
};

export default function BotPage() {
  // Main State
  const [botStatus, setBotStatus] = useState({
    capital_per_stock: 5000,
    is_live: false,
    interval: '30minute',
    session_token: '',
    user: 'SWADESH',
    symbols: ['AADHOS', 'AARIND', 'ABB'] });

  const [entryConditions, setEntryConditions] = useState([
    { left: 'RSI_D', operator: '>', right: '58', type: 'number' },
    { left: 'RSI_W', operator: '>', right: '58', type: 'number' },
    { left: 'RSI_M', operator: '>', right: '58', type: 'number' },
    { left: 'open', operator: '>', right: 'EMA_100_D', type: 'field' },
    { left: 'EMA_100_D', operator: '>', right: 'EMA_200_D', type: 'field' },
    { left: 'open', operator: '>', right: 'EMA_200_W', type: 'field' },
    { left: 'open', operator: '>', right: 'EMA_200_M', type: 'field' }
  ]);

  const [exitConditions, setExitConditions] = useState([
    { left: 'close', operator: '<', right: 'EMA_200_D', type: 'field' },
    { left: 'RSI_W', operator: '<', right: '40', type: 'number' }
  ]);

  // UI State
  const [selectedStocks, setSelectedStocks] = useState(new Set());
  const [stockSearchTerm, setStockSearchTerm] = useState('');
  const [isConditionsExpanded, setIsConditionsExpanded] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  // Optimized filtered stocks with useMemo
  const filteredStocks = useMemo(() => {
    return ALLSTOCKS.filter(stock => 
      stock.toLowerCase().includes(stockSearchTerm.toLowerCase()) && 
      !botStatus.symbols.includes(stock)
    ).slice(0, 50); // Limit for performance
  }, [stockSearchTerm, botStatus.symbols]);

  // API Functions
  const fetchBotConfig = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiCall('/api/getBotConfig');
      if (!data || Object.keys(data).length === 0) {
      // No data returned, set default values but don't disable update button
      setMessage('⚠️ No configuration returned from server, using default values.');
      setBotStatus({
        capital_per_stock: 5000,
        is_live: false,
        interval: '5minute',
        session_token: '56776589',
        user: 'SWADESHHUF',
        symbols: ['AADHOS', 'AARIND', 'ABB'],
      });
      setEntryConditions([
        { left: 'RSI_D', operator: '>', right: '58', type: 'number' },
        { left: 'RSI_W', operator: '>', right: '58', type: 'number' },
        { left: 'RSI_M', operator: '>', right: '58', type: 'number' },
        { left: 'open', operator: '>', right: 'EMA_100_D', type: 'field' },
        { left: 'EMA_100_D', operator: '>', right: 'EMA_200_D', type: 'field' },
        { left: 'open', operator: '>', right: 'EMA_200_W', type: 'field' },
      { left: 'open', operator: '>', right: 'EMA_200_M', type: 'field' }

      ]);
      setExitConditions([
        { left: 'close', operator: '<', right: 'EMA_200_D', type: 'field' },
        { left: 'RSI_W', operator: '<', right: '40', type: 'number' },
      ]);
    } else {
      setBotStatus({
        capital_per_stock: data.capitalPerStock || 5000,
        is_live: data.isLive || false,
        interval: data.interval || '30minute',
        session_token: data.sessionToken || '',
        user: data.sessionUser || 'SWADESH',
        symbols: data.symbols || ['RELIANCE', 'HDFCBANK'],
      });

      setEntryConditions(data.entryCondition || []);
      setExitConditions(data.exitCondition || []);
    }

    } catch (error) {
      console.error('Error fetching bot config:', error);
      setMessage(`❌ Failed to load configuration: ${error.message}`);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, []);

  const updateBotConfig = useCallback(async () => {
    if (!botStatus.session_token.trim()) {
      setMessage('❌ Session token is required');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      const payload = {
        sessionToken: botStatus.session_token,
        sessionUser: botStatus.user, // ✅ Fixed: Added sessionUser
        capitalPerStock: parseFloat(botStatus.capital_per_stock),
        isLive: botStatus.is_live,
        interval: botStatus.interval,
        symbols: botStatus.symbols,
        entryCondition: entryConditions,
        exitCondition: exitConditions
      };

      await apiCall('/api/updateBot', 'POST', payload);
      setMessage('✅ Bot configuration updated successfully!');

    } catch (error) {
      console.error('Error updating bot config:', error);
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [botStatus, entryConditions, exitConditions]);

  const runBot = useCallback(async () => {
    try {
      setLoading(true);
      setMessage('');

      const result = await apiCall('/api/runBot', 'POST');
      setMessage('🚀 Bot started successfully!');
      console.log('Bot output:', result.output);

    } catch (error) {
      console.error('Error running bot:', error);
      setMessage(`❌ Bot Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  // Condition Handlers - optimized with useCallback
  const addEntryCondition = useCallback(() => {
    setEntryConditions(prev => [...prev, { left: 'RSI_D', operator: '>', right: '50', type: 'number' }]);
  }, []);

  const removeEntryCondition = useCallback((index) => {
    setEntryConditions(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateEntryCondition = useCallback((index, field, value) => {
    setEntryConditions(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);

  const addExitCondition = useCallback(() => {
    setExitConditions(prev => [...prev, { left: 'RSI_D', operator: '<', right: '30', type: 'number' }]);
  }, []);

  const removeExitCondition = useCallback((index) => {
    setExitConditions(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateExitCondition = useCallback((index, field, value) => {
    setExitConditions(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);

  // Stock Handlers - optimized
  const addSelectedStocks = useCallback(() => {
    const newSymbols = [...new Set([...botStatus.symbols, ...Array.from(selectedStocks)])];
    setBotStatus(prev => ({ ...prev, symbols: newSymbols }));
    setSelectedStocks(new Set());
    setStockSearchTerm('');
  }, [botStatus.symbols, selectedStocks]);

  const removeStock = useCallback((stock) => {
    setBotStatus(prev => ({
      ...prev,
      symbols: prev.symbols.filter(s => s !== stock)
    }));
  }, []);

  // Auto-save functionality with proper debounce
  // useEffect(() => {
  //   if (initialLoad) return; // Don't auto-save on initial load

  //   const timeoutId = setTimeout(() => {
  //     if (botStatus.session_token && botStatus.user) {
  //       updateBotConfig();
  //     }
  //   }, 2000); // Increased to 2 seconds for better UX

  //   return () => clearTimeout(timeoutId);
  // }, [botStatus, entryConditions, exitConditions, initialLoad, updateBotConfig]);

  // Load configuration on mount
  useEffect(() => {
    fetchBotConfig();
  }, [fetchBotConfig]);

  // Auto-dismiss messages
  useEffect(() => {
    if (message && !loading) {
      const timer = setTimeout(() => setMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [message, loading]);

  const ConditionRow = useCallback(({ condition, index, type, onUpdate, onRemove }) => (
    <div className="flex items-center gap-2 p-2 border rounded bg-gray-50">
      <select 
        value={condition.left}
        onChange={(e) => onUpdate(index, 'left', e.target.value)}
        className="px-2 py-1 border rounded text-sm min-w-0 flex-1"
      >
        {INDICATORS.map(indicator => (
          <option key={indicator} value={indicator}>{indicator}</option>
        ))}
      </select>

      <select
        value={condition.operator}
        onChange={(e) => onUpdate(index, 'operator', e.target.value)}
        className="px-2 py-1 border rounded text-sm w-16"
      >
        {OPERATORS.map(op => (
          <option key={op.value} value={op.value}>{op.value}</option>
        ))}
      </select>

      <select
        value={condition.type}
        onChange={(e) => onUpdate(index, 'type', e.target.value)}
        className="px-2 py-1 border rounded text-sm w-20"
      >
        <option value="number">Number</option>
        <option value="field">Field</option>
      </select>

      {condition.type === 'number' ? (
        <input
          type="number"
          value={condition.right}
          onChange={(e) => onUpdate(index, 'right', e.target.value)}
          className="px-2 py-1 border rounded text-sm w-20"
          step="0.1"
        />
      ) : (
        <select
          value={condition.right}
          onChange={(e) => onUpdate(index, 'right', e.target.value)}
          className="px-2 py-1 border rounded text-sm min-w-0 flex-1"
        >
          {INDICATORS.map(indicator => (
            <option key={indicator} value={indicator}>{indicator}</option>
          ))}
        </select>
      )}

      <button
        onClick={() => onRemove(index)}
        className="px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
        title="Remove condition"
      >
        <FaTrash size={12} />
      </button>
    </div>
  ), []);

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">🤖 Trading Bot Configuration</h1>
        <p className="text-gray-600">Configure your automated trading bot with dynamic conditions</p>
      </div>

      {/* Status Messages */}
      {message && (
        <div className={`mb-4 p-3 rounded-lg transition-all duration-300 ${
          message.includes('❌') 
            ? 'bg-red-100 text-red-700 border border-red-200' 
            : 'bg-green-100 text-green-700 border border-green-200'
        }`}>
          <div className="flex items-center justify-between">
            <span>{message}</span>
            <button 
              onClick={() => setMessage('')}
              className="ml-4 text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && initialLoad && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg flex items-center gap-3">
            <MdOutlineRefresh className="animate-spin text-blue-500" size={24} />
            <span>Loading configuration...</span>
          </div>
        </div>
      )}

      {/* Main Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Left Column - Basic Settings */}
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg border">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <FaCog className="text-blue-500" />
              Basic Settings
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">User</label>
                <select
                  value={botStatus.user}
                  onChange={(e) => setBotStatus(prev => ({ ...prev, user: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {USERS.map(user => (
                    <option key={user} value={user}>{user}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Session Token</label>
                <input
                  type="text"
                  value={botStatus.session_token}
                  onChange={(e) => setBotStatus(prev => ({ ...prev, session_token: e.target.value }))}
                  placeholder="Enter session token..."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Capital Per Stock</label>
                <div className="relative">
                  <FaDollarSign className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="number"
                    value={botStatus.capital_per_stock}
                    onChange={(e) => setBotStatus(prev => ({ ...prev, capital_per_stock: parseFloat(e.target.value) || 0 }))}
                    className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="100"
                    step="100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Interval</label>
                <select
                  value={botStatus.interval}
                  onChange={(e) => setBotStatus(prev => ({ ...prev, interval: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {INTERVALS.map(interval => (
                    <option key={interval} value={interval}>{interval}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={botStatus.is_live}
                  onChange={(e) => setBotStatus(prev => ({ ...prev, is_live: e.target.checked }))}
                  className="rounded"
                />
                <label className="text-sm font-medium flex items-center gap-2">
                  {botStatus.is_live ? (
                    <MdOutlineAirplanemodeActive className="text-green-500" />
                  ) : (
                    <MdOutlineAirplanemodeInactive className="text-gray-500" />
                  )}
                  Live Trading Mode
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Stocks */}
        <div className="bg-gray-50 p-4 rounded-lg border">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <FaChartLine className="text-green-500" />
            Selected Stocks ({botStatus.symbols.length})
          </h2>

          <div className="space-y-3">
            <div>
              <input
                type="text"
                value={stockSearchTerm}
                onChange={(e) => setStockSearchTerm(e.target.value)}
                placeholder="Search stocks..."
                className="w-full px-3 py-2 border rounded-lg mb-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />

              <div className="max-h-32 overflow-y-auto border rounded p-2 mb-2 bg-white">
                {filteredStocks.length === 0 ? (
                  <p className="text-gray-500 text-sm">No stocks found</p>
                ) : (
                  filteredStocks.map(stock => (
                    <div key={stock} className="flex items-center gap-2 hover:bg-gray-50 px-1">
                      <input
                        type="checkbox"
                        checked={selectedStocks.has(stock)}
                        onChange={(e) => {
                          const newSet = new Set(selectedStocks);
                          if (e.target.checked) {
                            newSet.add(stock);
                          } else {
                            newSet.delete(stock);
                          }
                          setSelectedStocks(newSet);
                        }}
                      />
                      <span className="text-sm">{stock}</span>
                    </div>
                  ))
                )}
              </div>

              <button
                onClick={addSelectedStocks}
                disabled={selectedStocks.size === 0}
                className="w-full px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FaPlus className="inline mr-2" />
                Add Selected ({selectedStocks.size})
              </button>
            </div>

            <div className="max-h-40 overflow-y-auto">
              <div className="flex flex-wrap gap-1">
                {botStatus.symbols.map(stock => (
                  <span
                    key={stock}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                  >
                    {stock}
                    <button
                      onClick={() => removeStock(stock)}
                      className="text-red-500 hover:text-red-700 ml-1"
                      title="Remove stock"
                    >
                      <FaTrash size={10} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trading Conditions */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6 border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FaWaveSquare className="text-purple-500" />
            Trading Conditions
          </h2>
          <button
            onClick={() => setIsConditionsExpanded(!isConditionsExpanded)}
            className="p-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            title={isConditionsExpanded ? 'Collapse conditions' : 'Expand conditions'}
          >
            {isConditionsExpanded ? <BiCollapse /> : <HiOutlineArrowsExpand />}
          </button>
        </div>

        {isConditionsExpanded && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Entry Conditions */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-green-600">Entry Conditions (BUY)</h3>
                <button
                  onClick={addEntryCondition}
                  className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
                  title="Add entry condition"
                >
                  <FaPlus size={12} />
                </button>
              </div>
              <div className="space-y-2">
                {entryConditions.map((condition, index) => (
                  <ConditionRow
                    key={index}
                    condition={condition}
                    index={index}
                    type="entry"
                    onUpdate={updateEntryCondition}
                    onRemove={removeEntryCondition}
                  />
                ))}
              </div>
            </div>

            {/* Exit Conditions */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-red-600">Exit Conditions (SELL)</h3>
                <button
                  onClick={addExitCondition}
                  className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
                  title="Add exit condition"
                >
                  <FaPlus size={12} />
                </button>
              </div>
              <div className="space-y-2">
                {exitConditions.map((condition, index) => (
                  <ConditionRow
                    key={index}
                    condition={condition}
                    index={index}
                    type="exit"
                    onUpdate={updateExitCondition}
                    onRemove={removeExitCondition}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <button
          onClick={updateBotConfig}
          disabled={loading}
          className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors ${
            loading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white`}
        >
          {loading ? <MdOutlineRefresh className="animate-spin" /> : <FaCheck />}
          {loading ? 'Saving...' : 'Save Configuration'}
        </button>

        <button
          onClick={runBot}
          disabled={loading || !botStatus.session_token.trim()}
          className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors ${
            loading || !botStatus.session_token.trim()
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-green-600 hover:bg-green-700'
          } text-white`}
        >
          {loading ? <MdOutlineRefresh className="animate-spin" /> : <VscRunAll />}
          {loading ? 'Running...' : 'Run Bot'}
        </button>

        <button
          onClick={fetchBotConfig}
          disabled={loading}
          className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors ${
            loading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-purple-600 hover:bg-purple-700'
          } text-white`}
        >
          <MdOutlineRefresh className={loading ? 'animate-spin' : ''} />
          Refresh Config
        </button>
      </div>

      {/* Status Display */}
      <div className="bg-gray-100 p-4 rounded-lg border">
        <h3 className="font-medium mb-2">Current Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-600">
          <div>
            <strong>Mode:</strong> {botStatus.is_live ? '🟢 Live Trading' : '🟡 Paper Trading'}
          </div>
          <div>
            <strong>Capital:</strong> ₹{botStatus.capital_per_stock?.toLocaleString()}
          </div>
          <div>
            <strong>User:</strong> {botStatus.user}
          </div>
          <div>
            <strong>Stocks:</strong> {botStatus.symbols.length} selected
          </div>
          <div>
            <strong>Entry Rules:</strong> {entryConditions.length} conditions
          </div>
          <div>
            <strong>Exit Rules:</strong> {exitConditions.length} conditions
          </div>
        </div>
      </div>
    </div>
  );
}