import { useState, useEffect, useCallback, useMemo } from 'react';
import { FaPlay, FaStop, FaCheck, FaPlus, FaTrash, FaEquals, FaArrowUp, FaArrowDown, FaExchangeAlt, FaGreaterThanEqual, FaLessThanEqual, FaWaveSquare, FaChartLine, FaArrowRight, FaCog, FaUser, FaLock, FaUnlock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { MdOutlineRefresh, MdOutlineAirplanemodeInactive, MdOutlineAirplanemodeActive } from 'react-icons/md';
import { FcExpand } from 'react-icons/fc';
import { IoIosArrowUp } from 'react-icons/io';
import { HiOutlineArrowsExpand } from 'react-icons/hi';
import { BiCollapse } from 'react-icons/bi';
import { VscRunAll } from 'react-icons/vsc';
import CryptoJS from 'crypto-js';
import { RxTokens } from "react-icons/rx";
import { BsCurrencyRupee } from "react-icons/bs";
import { ImStopwatch } from "react-icons/im";

// Static Data
const USERS = ['VACHI', 'SWADESH', 'RAMKISHAN', 'RAMKISHANHUF', 'SWADESHHUF'];
const ALLSTOCKS = ['AADHOS', 'AARIND', 'ABB', 'ABBIND', 'ABBPOW', 'ACMSOL', 'ACTCON', 'ADATRA', 'ADAWIL', 'ADIAMC', 'AEGLOG', 'AFCINF', 'AJAPHA', 'AKUDRU', 'ALKAMI', 'ALKLAB', 'ALSTD', 'AMARAJ', 'AMBCE', 'AMIORG', 'ANARAT', 'APAIND', 'APLAPO', 'ASHLEY', 'ASTDM', 'ASTPOL', 'ATUL', 'BAJHOU', 'BALCHI', 'BANBAN', 'BASF', 'BHADYN', 'BHAELE', 'BHAFOR', 'BHAHEX', 'BIKFOO', 'BIRCOR', 'BLUDAR', 'BOMBUR', 'BRASOL', 'BRIENT', 'BSE', 'CADHEA', 'CAMACT', 'CAPPOI', 'CAREVE', 'CCLPRO', 'CDSL', 'CEINFO', 'CERSAN', 'CHEPET', 'CITUNI', 'CLESCI', 'COALIN', 'COCSHI', 'CONBIO', 'CRAAUT', 'CROGR', 'CROGRE', 'CYILIM', 'DATPAT', 'DCMSHR', 'DEEFER', 'DELLIM', 'DIVLAB', 'DOMIND', 'DRLAL', 'ECLSER', 'EIDPAR', 'EMALIM', 'EMCPHA', 'ENDTEC', 'ESCORT', 'EXIIND', 'FDC', 'FINCAB', 'FIRSOU', 'FSNECO', 'GAIL', 'GARREA', 'GIC', 'GLAPH', 'GLELIF', 'GLEPHA', 'GLOHEA', 'GODIGI', 'GODPRO', 'GOKEXP', 'GRAVIN', 'GUJGA', 'GUJPPL', 'HAPMIN', 'HBLPOW', 'HDFAMC', 'HILLTD', 'HIMCHE', 'HINAER', 'HINCON', 'HINCOP', 'HINDAL', 'HINPET', 'HONAUT', 'HONCON', 'HYUMOT', 'IIFHOL', 'IIFWEA', 'INDBA', 'INDLTD', 'INDOVE', 'INDR', 'INDRAI', 'INDREN', 'INFEDG', 'INOIND', 'INOWIN', 'INTGEM', 'INVKNO', 'IPCLAB', 'IRBINF', 'IRCINT', 'JAMKAS', 'JBCHEM', 'JBMAUT', 'JINSAW', 'JINSP', 'JINSTA', 'JIOFIN', 'JKCEME', 'JMFINA', 'JSWENE', 'JSWHOL', 'JSWINF', 'JYOCNC', 'KALJEW', 'KALPOW', 'KANNER', 'KARVYS', 'KAYTEC', 'KCPLTD', 'KECIN', 'KFITEC', 'KIRBRO', 'KIRENG', 'KPITE', 'KPITEC', 'KPRMIL', 'KRIINS', 'LATVIE', 'LAULAB', 'LEMTRE', 'LIC', 'LININ', 'LLOMET', 'LTOVER', 'LTTEC', 'MAPHA', 'MCX', 'MININD', 'MOLPAC', 'MOTOSW', 'MOTSU', 'MUTFIN', 'NARHRU', 'NATALU', 'NATPHA', 'NETTEC', 'NEULAB', 'NEWSOF', 'NHPC', 'NIVBUP', 'NOCIL', 'NTPGRE', 'NUVWEA', 'OBEREA', 'OLAELE', 'ORAFIN', 'ORIREF', 'PAGIND', 'PBFINT', 'PEAGL', 'PERSYS', 'PGELEC', 'PHICAR', 'PHOMIL', 'PIRPHA', 'POLI', 'PREENR', 'PREEST', 'PVRLIM', 'RAICHI', 'RAICOR', 'RAIVIK', 'RAMFOR', 'RATINF', 'RAYLIF', 'RELNIP', 'RENSUG', 'RITLIM', 'ROUMOB', 'RRKAB', 'RUCSOY', 'RURELE', 'SAIL', 'SAILIF', 'SAREIN', 'SARENE', 'SBFFIN', 'SCHELE', 'SHIME', 'SHRPIS', 'SHYMET', 'SIEMEN', 'SIGI', 'SKFIND', 'SOLIN', 'SONBLW', 'STAHEA', 'STYABS', 'SUDCHE', 'SUNFAS', 'SUNFIN', 'SUNPHA', 'SUPIND', 'SWAENE', 'SWILIM', 'TATCOM', 'TATELX', 'TATTE', 'TATTEC', 'TBOTEK', 'TECEEC', 'TECIND', 'TECMAH', 'TEJNET', 'THERMA', 'THICHE', 'TATMOT', 'TRILTD', 'TUBIN', 'TVSMOT', 'UCOBAN', 'UNIBAN', 'UNIP', 'UNISPI', 'UTIAMC', 'VARBEV', 'VARTEX', 'VEDFAS', 'VEDLIM', 'VIJDIA', 'VISMEG', 'VOLTAS', 'WAAENE', 'WABIND', 'WELIND', 'WHIIND', 'WOCKHA', 'XPRIND', 'ZENTE', 'ZOMLIM'];

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
    { left: 'open', operator: '>', right: 'EMA_200_M', type: 'field' },
  ]);

  const [exitConditions, setExitConditions] = useState([
    { left: 'close', operator: '<', right: 'EMA_200_D', type: 'field' },
    { left: 'RSI_W', operator: '<', right: '40', type: 'number' }
  ]);

  // UI State
  const [selectedStocks, setSelectedStocks] = useState(new Set());
  const [stockSearchTerm, setStockSearchTerm] = useState('');
  const [manualStockEntry, setManualStockEntry] = useState(''); // New state for manual stock entry
  const [isConditionsExpanded, setIsConditionsExpanded] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [dbPasswordHash, setDbPasswordHash] = useState(null);

  // Security/Lock State
  const [isLocked, setIsLocked] = useState(true); // Configuration is locked by default
  const [passwordInput, setPasswordInput] = useState('');
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Optimized filtered stocks with useMemo
  const filteredStocks = useMemo(() => {
    return ALLSTOCKS.filter(stock => 
      stock.toLowerCase().includes(stockSearchTerm.toLowerCase()) && 
      !botStatus.symbols.includes(stock)
    ).slice(0, 50);
  }, [stockSearchTerm, botStatus.symbols]);

const hashPassword = (password) => {
  return CryptoJS.SHA256(password).toString();
};
  // Fix the fetchBotPassword function
const fetchBotPassword = useCallback(async () => {
  try {
    setLoading(true);
    const response = await apiCall('/api/getBotPassword');
    const passwordHash = response.passwordHash;
    
    setDbPasswordHash(passwordHash);
    return passwordHash;
  } catch (error) {
    console.error('Error fetching bot password:', error);
    setMessage('⚠️ Could not load password configuration from server.');
    return null;
  } finally {
    setLoading(false);
  }
}, []);

  const validatePassword = useCallback(async () => {
  if (!passwordInput.trim()) {
    setMessage('❌ Please enter a password');
    return;
  }

  try {
    setLoading(true);
    
    // Hash the input password
    const hashedInput = hashPassword(passwordInput);
    
    // Get password hash from database if not already loaded
    let passwordHash = dbPasswordHash;
    if (!passwordHash) {
      passwordHash = await fetchBotPassword();
    }
    
    if (!passwordHash) {
      setMessage('❌ No password configured. Please contact administrator.');
      setPasswordInput('');
      return;
    }
    
    // Compare hashed input with stored hash
    if (hashedInput === passwordHash) {
      setIsLocked(false);
      setPasswordInput('');
      setShowPasswordInput(false);
      setMessage('🔓 Configuration unlocked! You can now edit all fields.');
      setTimeout(() => setMessage(''), 3000);
    } else {
      setMessage('❌ Invalid password. Please try again.');
      setPasswordInput('');
      setTimeout(() => setMessage(''), 3000);
    }
  } catch (error) {
    console.error('Error validating password:', error);
    setMessage('❌ Error validating password. Please try again.');
    setPasswordInput('');
  } finally {
    setLoading(false);
  }
}, [passwordInput, dbPasswordHash, fetchBotPassword]);

  // Lock the configuration
  const lockConfiguration = useCallback(() => {
    setIsLocked(true);
    setPasswordInput('');
    setShowPasswordInput(false);
    setMessage('🔒 Configuration locked for security.');
    setTimeout(() => setMessage(''), 3000);
  }, []);

  // API Functions
  const fetchBotConfig = useCallback(async () => {
    try {
      setLoading(true);
      setMessage('');

      const data = await apiCall('/api/getBotConfig');

      if (data && Object.keys(data).length > 0 && (data.sessionToken || data.symbols?.length > 0)) {
        setBotStatus({
          capital_per_stock: data.capitalPerStock || 5000,
          is_live: data.isLive || false,
          interval: data.interval || '30minute',
          session_token: data.sessionToken || '',
          user: data.sessionUser || 'SWADESH',
          symbols: data.symbols || ['RELIANCE', 'TCS', 'HDFCBANK'],
        });

        setEntryConditions(data.entryCondition || [
          { left: 'RSI_D', operator: '>', right: '58', type: 'number' },
          { left: 'RSI_W', operator: '>', right: '58', type: 'number' },
          { left: 'RSI_M', operator: '>', right: '58', type: 'number' },
          { left: 'open', operator: '>', right: 'EMA_100_D', type: 'field' },
          { left: 'EMA_100_D', operator: '>', right: 'EMA_200_D', type: 'field' },
          { left: 'open', operator: '>', right: 'EMA_200_W', type: 'field' }
        ]);

        setExitConditions(data.exitCondition || [
          { left: 'close', operator: '<', right: 'EMA_200_D', type: 'field' },
          { left: 'RSI_W', operator: '<', right: '40', type: 'number' }
        ]);

        setMessage('✅ Configuration loaded from database');

      } else {
        setMessage('ℹ️ No configuration found in database. Using default settings - you can edit and save.');

        setBotStatus({
          capital_per_stock: 5000,
          is_live: false,
          interval: '30minute',
          session_token: '',
          user: 'SWADESH',
          symbols: ['RELIANCE', 'TCS', 'HDFCBANK'],
        });

        setEntryConditions([
          { left: 'RSI_D', operator: '>', right: '58', type: 'number' },
          { left: 'RSI_W', operator: '>', right: '58', type: 'number' },
          { left: 'RSI_M', operator: '>', right: '58', type: 'number' },
          { left: 'open', operator: '>', right: 'EMA_100_D', type: 'field' },
          { left: 'EMA_100_D', operator: '>', right: 'EMA_200_D', type: 'field' },
          { left: 'open', operator: '>', right: 'EMA_200_W', type: 'field' }
        ]);

        setExitConditions([
          { left: 'close', operator: '<', right: 'EMA_200_D', type: 'field' },
          { left: 'RSI_W', operator: '<', right: '40', type: 'number' }
        ]);
      }

    } catch (error) {
      console.error('Error fetching bot config:', error);
      setMessage(`⚠️ Could not load configuration from server. Using default settings - you can edit and save.`);

      setBotStatus({
        capital_per_stock: 5000,
        is_live: false,
        interval: '30minute',
        session_token: '',
        user: 'SWADESH',
        symbols: ['RELIANCE', 'TCS', 'HDFCBANK'],
      });

      setEntryConditions([
        { left: 'RSI_D', operator: '>', right: '58', type: 'number' },
        { left: 'RSI_W', operator: '>', right: '58', type: 'number' },
        { left: 'RSI_M', operator: '>', right: '58', type: 'number' },
        { left: 'open', operator: '>', right: 'EMA_100_D', type: 'field' },
        { left: 'EMA_100_D', operator: '>', right: 'EMA_200_D', type: 'field' },
        { left: 'open', operator: '>', right: 'EMA_200_W', type: 'field' }
      ]);

      setExitConditions([
        { left: 'close', operator: '<', right: 'EMA_200_D', type: 'field' },
        { left: 'RSI_W', operator: '<', right: '40', type: 'number' }
      ]);

    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, []);

  useEffect(() => {
    const initializeApp = async () => {
      await fetchBotConfig();
      await fetchBotPassword(); // Pre-load password hash
    };
    
    initializeApp();
  }, [fetchBotConfig, fetchBotPassword]);

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
        sessionUser: botStatus.user,
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

  // Condition Handlers
  const addEntryCondition = useCallback(() => {
    if (isLocked) {
      setMessage('🔒 Please unlock configuration to add conditions');
      return;
    }
    setEntryConditions(prev => [...prev, { left: 'RSI_D', operator: '>', right: '50', type: 'number' }]);
  }, [isLocked]);

  const removeEntryCondition = useCallback((index) => {
    if (isLocked) {
      setMessage('🔒 Please unlock configuration to remove conditions');
      return;
    }
    setEntryConditions(prev => prev.filter((_, i) => i !== index));
  }, [isLocked]);

  const updateEntryCondition = useCallback((index, field, value) => {
    if (isLocked) {
      setMessage('🔒 Please unlock configuration to edit conditions');
      return;
    }
    setEntryConditions(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, [isLocked]);

  const addExitCondition = useCallback(() => {
    if (isLocked) {
      setMessage('🔒 Please unlock configuration to add conditions');
      return;
    }
    setExitConditions(prev => [...prev, { left: 'RSI_D', operator: '<', right: '30', type: 'number' }]);
  }, [isLocked]);

  const removeExitCondition = useCallback((index) => {
    if (isLocked) {
      setMessage('🔒 Please unlock configuration to remove conditions');
      return;
    }
    setExitConditions(prev => prev.filter((_, i) => i !== index));
  }, [isLocked]);

  const updateExitCondition = useCallback((index, field, value) => {
    if (isLocked) {
      setMessage('🔒 Please unlock configuration to edit conditions');
      return;
    }
    setExitConditions(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, [isLocked]);

  // Stock Handlers
  const addSelectedStocks = useCallback(() => {
    if (isLocked) {
      setMessage('🔒 Please unlock configuration to add stocks');
      return;
    }
    const newSymbols = [...new Set([...botStatus.symbols, ...Array.from(selectedStocks)])];
    setBotStatus(prev => ({ ...prev, symbols: newSymbols }));
    setSelectedStocks(new Set());
    setStockSearchTerm('');
  }, [botStatus.symbols, selectedStocks, isLocked]);

  // New function to add stock manually by typing
  const addManualStock = useCallback(() => {
    if (isLocked) {
      setMessage('🔒 Please unlock configuration to add stocks');
      return;
    }
    if (!manualStockEntry.trim()) {
      setMessage('❌ Please enter a stock symbol');
      return;
    }

    const stockSymbol = manualStockEntry.trim().toUpperCase();

    if (botStatus.symbols.includes(stockSymbol)) {
      setMessage(`❌ ${stockSymbol} is already added`);
      setManualStockEntry('');
      return;
    }

    const newSymbols = [...botStatus.symbols, stockSymbol];
    setBotStatus(prev => ({ ...prev, symbols: newSymbols }));
    setManualStockEntry('');
    setMessage(`✅ ${stockSymbol} added successfully`);
    setTimeout(() => setMessage(''), 2000);
  }, [manualStockEntry, botStatus.symbols, isLocked]);

  const removeStock = useCallback((stock) => {
    if (isLocked) {
      setMessage('🔒 Please unlock configuration to remove stocks');
      return;
    }
    setBotStatus(prev => ({
      ...prev,
      symbols: prev.symbols.filter(s => s !== stock)
    }));
  }, [isLocked]);

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
    <div className={`flex items-center gap-2 p-2 border rounded ${isLocked ? 'bg-gray-100 opacity-50' : 'bg-gray-50'}`}>
      <select 
        value={condition.left}
        onChange={(e) => onUpdate(index, 'left', e.target.value)}
        className={`px-2 py-1 border rounded text-sm min-w-0 flex-1 ${isLocked ? 'bg-gray-200 cursor-not-allowed' : ''}`}
        disabled={isLocked}
      >
        {INDICATORS.map(indicator => (
          <option key={indicator} value={indicator}>{indicator}</option>
        ))}
      </select>

      <select
        value={condition.operator}
        onChange={(e) => onUpdate(index, 'operator', e.target.value)}
        className={`px-2 py-1 border rounded text-sm w-16 ${isLocked ? 'bg-gray-200 cursor-not-allowed' : ''}`}
        disabled={isLocked}
      >
        {OPERATORS.map(op => (
          <option key={op.value} value={op.value}>{op.value}</option>
        ))}
      </select>

      <select
        value={condition.type}
        onChange={(e) => onUpdate(index, 'type', e.target.value)}
        className={`px-2 py-1 border rounded text-sm w-20 ${isLocked ? 'bg-gray-200 cursor-not-allowed' : ''}`}
        disabled={isLocked}
      >
        <option value="number">Number</option>
        <option value="field">Field</option>
      </select>

      {condition.type === 'number' ? (
        <input
          type="number"
          value={condition.right}
          onChange={(e) => onUpdate(index, 'right', e.target.value)}
          className={`px-2 py-1 border rounded text-sm w-20 ${isLocked ? 'bg-gray-200 cursor-not-allowed' : ''}`}
          step="0.1"
          disabled={isLocked}
        />
      ) : (
        <select
          value={condition.right}
          onChange={(e) => onUpdate(index, 'right', e.target.value)}
          className={`px-2 py-1 border rounded text-sm min-w-0 flex-1 ${isLocked ? 'bg-gray-200 cursor-not-allowed' : ''}`}
          disabled={isLocked}
        >
          {INDICATORS.map(indicator => (
            <option key={indicator} value={indicator}>{indicator}</option>
          ))}
        </select>
      )}

      <button
        onClick={() => onRemove(index)}
        className={`px-2 py-1 bg-red-500 cursor-pointer text-white rounded text-sm hover:bg-red-600 transition-colors ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
        title="Remove condition"
        disabled={isLocked}
      >
        <FaTrash size={12} />
      </button>
    </div>
  ), [isLocked]);

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white border border-gray-300 rounded-md">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">🤖 Trading Bot Configuration</h1>
            <p className="text-gray-600">Configure your automated trading bot with dynamic conditions</p>
          </div>

          {/* Security Lock/Unlock Controls */}
          <div className="flex items-center gap-2">
            {isLocked ? (
              <div className="flex items-center gap-2">
                <FaLock className="text-red-500" />
                <span className="text-sm text-red-600 font-medium">Configuration Locked</span>
                <button
                  onClick={() => setShowPasswordInput(!showPasswordInput)}
                  className="px-3 py-1 cursor-pointer bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
                >
                  Unlock
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <FaUnlock className="text-green-500" />
                <span className="text-sm text-green-600 font-medium">Configuration Unlocked</span>
                <button
                  onClick={lockConfiguration}
                  className="px-3 py-1 cursor-pointer bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
                >
                  Lock
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Password Input Modal */}
        {showPasswordInput && (
          <div className="mt-4 p-4 border border-blue-200 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2">
              <input
                type={showPassword ? "text" : "password"}
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter password to unlock configuration"
                className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && validatePassword()}
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="px-2 py-2 cursor-pointer text-gray-500 hover:text-gray-700"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
              <button
                onClick={validatePassword}
                className="px-4 py-2 cursor-pointer bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Unlock
              </button>
              <button
                onClick={() => {
                  setShowPasswordInput(false);
                  setPasswordInput('');
                }}
                className="px-4 py-2 bg-gray-500 cursor-pointer text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Status Messages */}
      {message && (
        <div className={`mb-4 p-3 rounded-lg transition-all duration-300 ${
          message.includes('❌') 
            ? 'bg-red-100 text-red-700 border border-red-200' 
            : message.includes('⚠️')
            ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
            : message.includes('ℹ️')
            ? 'bg-blue-100 text-blue-700 border border-blue-200'
            : message.includes('🔒') || message.includes('🔓')
            ? 'bg-orange-100 text-orange-700 border border-orange-200'
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 ">
        {/* Left Column - Basic Settings */}
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-400">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <FaCog className="text-blue-500" />
              Basic Settings
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">User</label>
                <div className="relative">
                  <FaUser className="absolute left-3 top-3 text-gray-400" />
                <select
                  value={botStatus.user}
                  onChange={(e) => setBotStatus(prev => ({ ...prev, user: e.target.value }))}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isLocked ? 'bg-gray-200 cursor-not-allowed' : ''}`}
                  disabled={isLocked}
                >
                  {USERS.map(user => (
                    <option key={user} value={user}>{user}</option>
                  ))}
                </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Session Token</label>
                <div className="relative">
                  <RxTokens className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={botStatus.session_token}
                  onChange={(e) => setBotStatus(prev => ({ ...prev, session_token: e.target.value }))}
                  placeholder="Enter session token..."
                  className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                </div>
                <small className="text-gray-500 text-xs">Session token can be edited without unlocking</small>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Capital Per Stock</label>
                <div className="relative">
                  <BsCurrencyRupee className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="number"
                    value={botStatus.capital_per_stock}
                    onChange={(e) => setBotStatus(prev => ({ ...prev, capital_per_stock: parseFloat(e.target.value) || 0 }))}
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isLocked ? 'bg-gray-200 cursor-not-allowed' : ''}`}
                    min="100"
                    step="100"
                    disabled={isLocked}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Interval</label>
                <div className="relative">
                  <ImStopwatch className="absolute left-3 top-3 text-gray-400" />
                <select
                  value={botStatus.interval}
                  onChange={(e) => setBotStatus(prev => ({ ...prev, interval: e.target.value }))}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isLocked ? 'bg-gray-200 cursor-not-allowed' : ''}`}
                  disabled={isLocked}
                >
                  {INTERVALS.map(interval => (
                    <option key={interval} value={interval}>{interval}</option>
                  ))}
                </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={botStatus.is_live}
                  onChange={(e) => setBotStatus(prev => ({ ...prev, is_live: e.target.checked }))}
                  className="rounded"
                  disabled={isLocked}
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
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-400">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <FaChartLine className="text-green-500" />
            Selected Stocks ({botStatus.symbols.length})
          </h2>

          <div className="space-y-3">
            {/* Manual Stock Entry */}
            <div>
              <label className="block text-sm font-medium mb-1">Add Stock Manually</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualStockEntry}
                  onChange={(e) => setManualStockEntry(e.target.value.toUpperCase())}
                  placeholder="Enter stock symbol (e.g., RELIANCE)"
                  className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isLocked ? 'bg-gray-200 cursor-not-allowed' : ''}`}
                  disabled={isLocked}
                  onKeyPress={(e) => e.key === 'Enter' && addManualStock()}
                />
                <button
                  onClick={addManualStock}
                  disabled={isLocked || !manualStockEntry.trim()}
                  className={`px-4 py-2 bg-green-500 cursor-pointer text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${isLocked ? 'bg-gray-400' : ''}`}
                >
                  <FaPlus size={12} />
                </button>
              </div>
            </div>

            {/* Search and Select Stocks */}
            <div>
              <label className="block text-sm font-medium mb-1">Search & Select Stocks</label>
              <input
                type="text"
                value={stockSearchTerm}
                onChange={(e) => setStockSearchTerm(e.target.value)}
                placeholder="Search stocks..."
                className={`w-full px-3 py-2 border rounded-lg mb-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isLocked ? 'bg-gray-200 cursor-not-allowed' : ''}`}
                disabled={isLocked}
              />

              <div className={`max-h-32 overflow-y-auto border rounded p-2 mb-2 bg-white ${isLocked ? 'opacity-50' : ''}`}>
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
                        disabled={isLocked}
                      />
                      <span className="text-sm">{stock}</span>
                    </div>
                  ))
                )}
              </div>

              <button
                onClick={addSelectedStocks}
                disabled={isLocked || selectedStocks.size === 0}
                className={`w-full px-3 py-2 bg-blue-500 cursor-pointer text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${isLocked ? 'bg-gray-400' : ''}`}
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
                      className={`text-red-500 hover:text-red-700 ml-1 ${isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      title="Remove stock"
                      disabled={isLocked}
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
      <div className={`bg-gray-50 p-4 rounded-lg mb-6 border border-gray-400 ${isLocked ? 'opacity-50' : ''}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FaWaveSquare className="text-purple-500" />
            Trading Conditions
            {isLocked && <FaLock className="text-red-500 text-sm" />}
          </h2>
          <button
            onClick={() => setIsConditionsExpanded(!isConditionsExpanded)}
            className={`p-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors ${isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            title={isConditionsExpanded ? 'Collapse conditions' : 'Expand conditions'}
            disabled={isLocked}
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
                  className={`px-3 py-1 bg-green-500 text-white cursor-pointer rounded text-sm hover:bg-green-600 transition-colors ${isLocked ? 'opacity-50 cursor-not-allowed bg-gray-400' : ''}`}
                  title="Add entry condition"
                  disabled={isLocked}
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
                  className={`px-3 py-1 bg-red-500 text-white cursor-pointer rounded text-sm hover:bg-red-600 transition-colors ${isLocked ? 'opacity-50 cursor-not-allowed bg-gray-400' : ''}`}
                  title="Add exit condition"
                  disabled={isLocked}
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
          className={`px-6 py-3 rounded-lg cursor-pointer font-semibold flex items-center gap-2 transition-colors ${
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
          className={`px-6 py-3 rounded-lg cursor-pointer font-semibold flex items-center gap-2 transition-colors ${
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
          className={`px-6 py-3 rounded-lg cursor-pointer font-semibold flex items-center gap-2 transition-colors ${
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
          <div className="md:col-span-3">
            <strong>Security:</strong> {isLocked ? '🔒 Configuration Locked' : '🔓 Configuration Unlocked'}
          </div>
        </div>
      </div>
    </div>
  );
}