import { useState, useEffect } from "react";
import {
  FaPlay, FaStop, FaCheck, FaPlus, FaTrash, FaEquals,
  FaArrowUp, FaArrowDown, FaExchangeAlt, FaGreaterThanEqual, FaLessThanEqual,
  FaWaveSquare, FaChartLine, FaArrowRight, FaCog, FaUser, FaDollarSign
} from "react-icons/fa";
import { MdOutlineRefresh, MdOutlineAirplanemodeInactive, MdOutlineAirplanemodeActive } from "react-icons/md";
import { FcExpand } from "react-icons/fc";
import { IoIosArrowUp } from "react-icons/io";
import { HiOutlineArrowsExpand } from "react-icons/hi";
import { BiCollapse } from "react-icons/bi";
import { VscRunAll } from "react-icons/vsc";

// Static Data
const USERS = ['VACHI', 'SWADESH', 'RAMKISHAN', 'RAMKISHANHUF', 'SWADESHHUF'];
const ALL_STOCKS = [
  "AADHOS", "AARIND", "ABB", "ABBIND", "ABBPOW", "ACMSOL", "ACTCON", "ADATRA", 
  "ADAWIL", "ADIAMC", "AEGLOG", "AFCINF", "AJAPHA", "AKUDRU", "ALKAMI", "ALKLAB", 
  "ALSTD", "AMARAJ", "AMBCE", "AMIORG", "ANARAT", "APAIND", "APLAPO", "ASHLEY", 
  "ASTDM", "ASTPOL", "ATUL", "BAJHOU", "BALCHI", "BANBAN", "BASF", "BHADYN", 
  "BHAELE", "BHAFOR", "BHAHEX", "BIKFOO", "BIRCOR", "BLUDAR", "BOMBUR", "BRASOL", 
  "BRIENT", "BSE", "CADHEA", "CAMACT", "CAPPOI", "CAREVE", "CCLPRO", "CDSL", 
  "CEINFO", "CERSAN", "CHEPET", "CITUNI", "CLESCI", "COALIN", "COCSHI", "CONBIO", 
  "CRAAUT", "CROGR", "CROGRE", "CYILIM", "DATPAT", "DCMSHR", "DEEFER", "DELLIM", 
  "DIVLAB", "DOMIND", "DRLAL", "ECLSER", "EIDPAR", "EMALIM", "EMCPHA", "ENDTEC", 
  "ESCORT", "EXIIND", "FDC", "FINCAB", "FIRSOU", "FSNECO", "GAIL", "GARREA", "GIC", 
  "GLAPH", "GLELIF", "GLEPHA", "GLOHEA", "GODIGI", "GODPRO", "GOKEXP", "GRAVIN", 
  "GUJGA", "GUJPPL", "HAPMIN", "HBLPOW", "HDFAMC", "HILLTD", "HIMCHE", "HINAER", 
  "HINCON", "HINCOP", "HINDAL", "HINPET", "HONAUT", "HONCON", "HYUMOT", "IIFHOL", 
  "IIFWEA", "INDBA", "INDLTD", "INDOVE", "INDR", "INDRAI", "INDREN", "INFEDG", 
  "INOIND", "INOWIN", "INTGEM", "INVKNO", "IPCLAB", "IRBINF", "IRCINT", "JAMKAS", 
  "JBCHEM", "JBMAUT", "JINSAW", "JINSP", "JINSTA", "JIOFIN", "JKCEME", "JMFINA", 
  "JSWENE", "JSWHOL", "JSWINF", "JYOCNC", "KALJEW", "KALPOW", "KANNER", "KARVYS", 
  "KAYTEC", "KCPLTD", "KECIN", "KFITEC", "KIRBRO", "KIRENG", "KPITE", "KPITEC", 
  "KPRMIL", "KRIINS", "LATVIE", "LAULAB", "LEMTRE", "LIC", "LININ", "LLOMET", 
  "LTOVER", "LTTEC", "MAPHA", "MCX", "MININD", "MOLPAC", "MOTOSW", "MOTSU", 
  "MUTFIN", "NARHRU", "NATALU", "NATPHA", "NETTEC", "NEULAB", "NEWSOF", "NHPC", 
  "NIVBUP", "NOCIL", "NTPGRE", "NUVWEA", "OBEREA", "OLAELE", "ORAFIN", "ORIREF", 
  "PAGIND", "PBFINT", "PEAGL", "PERSYS", "PGELEC", "PHICAR", "PHOMIL", "PIRPHA", 
  "POLI", "PREENR", "PREEST", "PVRLIM", "RAICHI", "RAICOR", "RAIVIK", "RAMFOR", 
  "RATINF", "RAYLIF", "RELNIP", "RENSUG", "RITLIM", "ROUMOB", "RRKAB", "RUCSOY", 
  "RURELE", "SAIL", "SAILIF", "SAREIN", "SARENE", "SBFFIN", "SCHELE", "SHIME", 
  "SHRPIS", "SHYMET", "SIEMEN", "SIGI", "SKFIND", "SOLIN", "SONBLW", "STAHEA", 
  "STYABS", "SUDCHE", "SUNFAS", "SUNFIN", "SUNPHA", "SUPIND", "SWAENE", "SWILIM", 
  "TATCOM", "TATELX", "TATTE", "TATTEC", "TBOTEK", "TECEEC", "TECIND", "TECMAH", 
  "TEJNET", "THERMA", "THICHE", "TATMOT", "TRILTD", "TUBIN", "TVSMOT", "UCOBAN", 
  "UNIBAN", "UNIP", "UNISPI", "UTIAMC", "VARBEV", "VARTEX", "VEDFAS", "VEDLIM", 
  "VIJDIA", "VISMEG", "VOLTAS", "WAAENE", "WABIND", "WELIND", "WHIIND", "WOCKHA", 
  "XPRIND", "ZENTE", "ZOMLIM"
];

// Field options for conditions
const FIELD_OPTIONS = [
  { key: "RSI_D", label: "RSI Daily", icon: FaArrowUp },
  { key: "RSI_W", label: "RSI Weekly", icon: FaArrowUp },
  { key: "RSI_M", label: "RSI Monthly", icon: FaArrowUp },
  { key: "EMA_100_D", label: "EMA 100 Daily", icon: FaChartLine },
  { key: "EMA_200_D", label: "EMA 200 Daily", icon: FaChartLine },
  { key: "EMA_200_W", label: "EMA 200 Weekly", icon: FaWaveSquare },
  { key: "EMA_200_M", label: "EMA 200 Monthly", icon: FaWaveSquare },
  { key: "open", label: "Open Price", icon: FcExpand },
  { key: "close", label: "Close Price", icon: IoIosArrowUp },
  { key: "high", label: "High Price", icon: FaArrowUp },
  { key: "low", label: "Low Price", icon: FaArrowDown }
];

const OPERATOR_OPTIONS = [
  { key: ">", label: ">", icon: FaArrowRight },
  { key: ">=", label: "≥", icon: FaGreaterThanEqual },
  { key: "<", label: "<", icon: FaArrowDown },
  { key: "<=", label: "≤", icon: FaLessThanEqual },
  { key: "==", label: "=", icon: FaEquals },
  { key: "!=", label: "≠", icon: FaExchangeAlt }
];

const API_BASE_URL = 'http://127.0.0.1:9000';

export default function TradingBots() {
  // State management
  const [botStatus, setBotStatus] = useState({
    capital_per_stock: 10000,
    is_live: false,
    interval: 30,
    symbols: ['ASHLEY']
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState('SWADESHHUF');
  const [sessionToken, setSessionToken] = useState('');
  const [allStockShow, setAllStockShow] = useState(false);
  const [stockList, setStockList] = useState([]);
  
  // Entry/Exit conditions state - now as arrays of condition objects
  const [entryConditions, setEntryConditions] = useState([
    { left: "RSI_D", operator: ">", right: "58", type: "number" },
    { left: "RSI_W", operator: ">", right: "58", type: "number" },
    { left: "RSI_M", operator: ">", right: "58", type: "number" },
    { left: "open", operator: ">", right: "EMA_100_D", type: "field" },
    { left: "EMA_100_D", operator: ">", right: "EMA_200_D", type: "field" },
    { left: "open", operator: ">", right: "EMA_200_W", type: "field" }
  ]);
  
  const [exitConditions, setExitConditions] = useState([
    { left: "close", operator: "<", right: "EMA_200_D", type: "field" },
    { left: "RSI_W", operator: "<", right: "40", type: "number" }
  ]);

  // Form states
  const [newStock, setNewStock] = useState('');
  const [newCapital, setNewCapital] = useState('');
  const [newInterval, setNewInterval] = useState('');

  // API call helper function
  const apiCall = async (endpoint, method = 'GET', data = null) => {
    setLoading(true);
    setMessage('');
    
    try {
      const config = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };
      
      if (data) {
        config.body = JSON.stringify(data);
      }
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      const result = await response.json();
      
      if (response.ok) {
        setMessage(`✅ ${result.message || 'Success'}`);
        return result;
      } else {
        throw new Error(result.detail || 'API call failed');
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
      console.error('API Error:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Fetch current status
  const fetchStatus = async () => {
    const result = await apiCall('/');
    if (result && result.status) {
      setBotStatus(result.status);
      
      // Update conditions if they exist in the response
      if (result.status.entry_condition) {
        setEntryConditions(result.status.entry_condition);
      }
      if (result.status.exit_condition) {
        setExitConditions(result.status.exit_condition);
      }
    }
  };

  // API Functions
  const updateSession = async () => {
    if (!sessionToken.trim()) {
      setMessage('❌ Please enter session token');
      return;
    }
    
    const result = await apiCall('/update_session', 'POST', {
      user: selectedUser,
      session_token: sessionToken
    });
    
    if (result) {
      setSessionToken('');
    }
  };

  const addStock = async () => {
    if (!newStock.trim()) {
      setMessage('❌ Please enter stock symbol');
      return;
    }
    
    const result = await apiCall('/add_stock', 'POST', {
      stock: newStock.toUpperCase()
    });
    
    if (result) {
      setNewStock('');
      fetchStatus();
    }
  };

  const removeStock = async (stock) => {
    const result = await apiCall('/remove_stock', 'POST', {
      stock: stock
    });
    
    if (result) {
      fetchStatus();
    }
  };

  const updateCapital = async () => {
    const capital = parseFloat(newCapital);
    if (isNaN(capital) || capital <= 0) {
      setMessage('❌ Please enter valid capital amount');
      return;
    }
    
    const result = await apiCall('/update_capital', 'POST', {
      capital_per_stock: capital
    });
    
    if (result) {
      setNewCapital('');
      fetchStatus();
    }
  };

  const updateInterval = async () => {
    const interval_time = parseInt(newInterval);
    if (isNaN(interval_time) || interval_time < 1) {
      setMessage('❌ Please enter valid interval');
      return;
    }
    
    const result = await apiCall('/update_interval', 'POST', {
      interval: interval_time+"minute"
    });
    
    if (result) {
      setNewInterval('');
      fetchStatus();
    }
  };

  const toggleLiveMode = async () => {
    const result = await apiCall('/update_is_live', 'POST', {
      is_live: !botStatus.is_live
    });
    
    if (result) {
      fetchStatus();
    }
  };

  const updateEntryConditions = async () => {
    const result = await apiCall('/update_entry_condition', 'POST', {
      entry_condition: entryConditions
    });
    
    if (result) {
      setMessage('✅ Entry conditions updated');
    }
  };

  const updateExitConditions = async () => {
    const result = await apiCall('/update_exit_condition', 'POST', {
      exit_condition: exitConditions
    });
    
    if (result) {
      setMessage('✅ Exit conditions updated');
    }
  };

  // Condition management functions
  const addEntryCondition = () => {
    setEntryConditions([...entryConditions, { left: "RSI_D", operator: ">", right: "50", type: "number" }]);
  };

  const removeEntryCondition = (index) => {
    setEntryConditions(entryConditions.filter((_, i) => i !== index));
  };

  const updateEntryCondition = (index, field, value) => {
    const updated = [...entryConditions];
    updated[index] = { ...updated[index], [field]: value };
    setEntryConditions(updated);
  };

  const addExitCondition = () => {
    setExitConditions([...exitConditions, { left: "RSI_D", operator: "<", right: "30", type: "number" }]);
  };

  const removeExitCondition = (index) => {
    setExitConditions(exitConditions.filter((_, i) => i !== index));
  };

  const updateExitCondition = (index, field, value) => {
    const updated = [...exitConditions];
    updated[index] = { ...updated[index], [field]: value };
    setExitConditions(updated);
  };

  const runbot = async () => {
    try {
    const response = await fetch('/api/run_bot', { method: 'POST' });
    const data = await response.json();
    if (data.success) {
      console.log('Bot Output:', data.output);
      // Update UI accordingly
    } else {
      console.error('Error running bot:', data.error);
    }
  } catch (error) {
    console.error('Fetch error:', error);
  }
  }

  // Load status on component mount
  useEffect(() => {
    fetchStatus();
  }, []);

//   Handle stock minimization
const MAX_STOCK_TO_SHOW = 12
let stock_list = ALL_STOCKS.slice(0,MAX_STOCK_TO_SHOW);
useEffect(() => {
    const updatedList = allStockShow ? botStatus.symbols : botStatus.symbols.slice(0, MAX_STOCK_TO_SHOW);
    setStockList(updatedList);
  }, [allStockShow, botStatus.symbols]);

const handleMinizeStock = () => {
    setAllStockShow(!allStockShow)
}

  return (
    <div className="min-h-screen bg-white border border-gray-900 rounded text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl text-gray-600 font-bold flex items-center gap-3">
            <FaChartLine className="text-gray-400" />
            {/* Trading Bot Dashboard */}
            RSI WealthBot
          </h1>
          <div className="flex items-center gap-2">
            {/* <div className={`px-4 py-2 rounded-lg font-semibold  ${
              botStatus.is_live ? 'bg-green-600' : 'bg-red-600'
            }`}>
              {botStatus.is_live ? <MdOutlineAirplanemodeActive title="You are Active"/> : <MdOutlineAirplanemodeInactive title="You are Inactive"/>}
            </div> */}

            <div>
            <button className={`px-4 py-2 rounded-lg font-semibold  cursor-pointer ${
              botStatus.is_live ? 'bg-green-600' : 'bg-green-600'
            }`}
            onClick={runbot}>
              { <VscRunAll title="Run"/>}
            </button>
            </div>

            <div>
              <button
            onClick={toggleLiveMode}
            className={`px-6 py-2 rounded-lg text-sm cursor-pointer transition-colors ${
                botStatus.is_live 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-green-600 hover:bg-green-700'
            }`}
            disabled={loading}
            >
            {botStatus.is_live ? (
                <>🔴 Disable Live</>
            ) : (
                <>🟢 Enable Live</>
            )}
            </button>
            </div>

            <button
              onClick={fetchStatus}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 cursor-pointer rounded-lg transition-colors"
              disabled={loading}
              title="Refresh Me"
            >
            <MdOutlineRefresh />
            </button>
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div className="mb-6 p-4 bg-white border border-green-500 rounded-lg">
            <p className="font-mono text-sm text-green-400">{message}</p>
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="mb-6 p-4 bg-yellow-900 border border-yellow-700 rounded-lg">
            <p className="text-yellow-200">⏳ Processing...</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Session Management */}
            <div className="bg-white border border-gray-300 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-400 mb-4 flex items-center gap-2">
                <FaUser className="text-gray-400" />
                Session Management
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">User</label>
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="w-full px-3 py-2 text-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-green-500"
                  >
                    {USERS.map(user => (
                      <option key={user} value={user}>{user}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Session Token</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={sessionToken}
                      onChange={(e) => setSessionToken(e.target.value)}
                      placeholder="Enter session token"
                      className="flex-1 px-3 py-2 text-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-green-500"
                    />
                    <button
                      onClick={updateSession}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 cursor-pointer rounded-lg transition-colors"
                      disabled={loading}
                    >
                      Update
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Stock Management */}
            <div className="rounded-lg border border-gray-300 p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-400 flex items-center gap-2">
                <FaChartLine className="text-gray-400" />
                Stock Management
              </h2>
              
              {/* Add Stock */}
              <div className="mb-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value.toUpperCase())}
                    placeholder="Enter stock symbol"
                    list="stocks"
                    className="flex-1 px-3 py-2 text-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                  <datalist id="stocks">
                    {ALL_STOCKS.map(stock => (
                      <option key={stock} value={stock} />
                    ))}
                  </datalist>
                  <button
                    onClick={addStock}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg cursor-pointer transition-colors flex items-center gap-2"
                    disabled={loading}
                  >
                    <FaPlus />
                  </button>
                </div>
              </div>

              {/* Current Stocks */}
              <div>
                <div className="flex items-center justify-between py-4">
                    <h3 className="text-lg font-medium mb-2 text-gray-700">Current Stocks ({botStatus.symbols.length})</h3>
                    <button className=" cursor-pointer" onClick={handleMinizeStock}>
                        {allStockShow ? (
                            <BiCollapse className="text-green-400 text-xl" />
                        ) : (
                            <HiOutlineArrowsExpand className="text-green-400 text-xl" />
                        )}
                    </button>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {stockList.map(stock => (
                    <div key={stock} className="flex items-center justify-between text-gray-700 px-3 py-2 border border-gray-500 rounded-lg">
                      <span className="font-mono text-sm">{stock}</span>
                      <button
                        onClick={() => removeStock(stock)}
                        className="text-red-400 hover:text-red-300 cursor-pointer transition-colors"
                        disabled={loading}
                      >
                        <FaTrash className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Configuration */}
            <div className=" border border-gray-300 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-400 gap-2">
                <FaCog className="text-gray-400" />
                Configuration
              </h2>
              
              <div className="space-y-4">
                {/* Capital */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-500">
                    Capital per Stock (Current: ₹{botStatus.capital_per_stock.toLocaleString()})
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={newCapital}
                      onChange={(e) => setNewCapital(e.target.value)}
                      placeholder="Enter capital amount"
                      className="flex-1 px-3 py-2 text-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-green-500"
                    />
                    <button
                      onClick={updateCapital}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 cursor-pointer rounded-lg transition-colors"
                      disabled={loading}
                    >
                      {/* <FaDollarSign /> */}
                      Update
                    </button>
                  </div>
                </div>

                {/* Interval */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-500">
                    Interval (Current: {botStatus.interval}s)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={newInterval}
                      onChange={(e) => setNewInterval(e.target.value)}
                      placeholder="Interval in seconds"
                      className="flex-1 px-3 py-2 text-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-green-500"
                    />
                    <button
                      onClick={updateInterval}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 cursor-pointer rounded-lg transition-colors"
                      disabled={loading}
                    >
                      Update
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Entry Conditions */}
            <div className="text-gray-800 border border-gray-300 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-400">
                  <FaArrowUp className="text-gray-400" />
                  Entry Conditions
                </h2>
                <button
                  onClick={addEntryCondition}
                  className="px-3 py-1 text-white bg-green-600 hover:bg-green-700 cursor-pointer rounded-lg transition-colors flex items-center gap-1 text-sm"
                >
                  <FaPlus className="w-3 h-3" /> Add
                </button>
              </div>
              
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {entryConditions.map((condition, index) => (
                  <div key={index} className="bg-gray-100 p-3 rounded-lg">
                    <div className="grid grid-cols-12 gap-2 items-center">
                      {/* Left Field */}
                      <div className="col-span-4">
                        <select
                          value={condition.left}
                          onChange={(e) => updateEntryCondition(index, 'left', e.target.value)}
                          className="w-full px-2 py-1 bg-gray-100 border border-gray-500 rounded text-xs focus:outline-none focus:border-green-500"
                        >
                          {FIELD_OPTIONS.map(field => (
                            <option key={field.key} value={field.key}>{field.label}</option>
                          ))}
                        </select>
                      </div>
                      
                      {/* Operator */}
                      <div className="col-span-2">
                        <select
                          value={condition.operator}
                          onChange={(e) => updateEntryCondition(index, 'operator', e.target.value)}
                          className="w-full px-2 py-1 bg-gray-100 border border-gray-500 rounded text-xs focus:outline-none focus:border-green-500"
                        >
                          {OPERATOR_OPTIONS.map(op => (
                            <option key={op.key} value={op.key}>{op.label}</option>
                          ))}
                        </select>
                      </div>
                      
                      {/* Right Value */}
                      <div className="col-span-4">
                        {condition.type === "field" ? (
                          <select
                            value={condition.right}
                            onChange={(e) => updateEntryCondition(index, 'right', e.target.value)}
                            className="w-full px-2 py-1 bg-gray-100 border border-gray-500 rounded text-xs focus:outline-none focus:border-green-500"
                          >
                            {FIELD_OPTIONS.map(field => (
                              <option key={field.key} value={field.key}>{field.label}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="number"
                            value={condition.right}
                            onChange={(e) => updateEntryCondition(index, 'right', e.target.value)}
                            className="w-full px-2 py-1 bg-gray-100 border border-gray-500 rounded text-xs focus:outline-none focus:border-green-500"
                          />
                        )}
                      </div>
                      
                      {/* Type Toggle */}
                      <div className="col-span-1">
                        <button
                          onClick={() => updateEntryCondition(index, 'type', condition.type === "number" ? "field" : "number")}
                          className="w-full px-1 py-1 bg-green-600 text-white hover:bg-green-700 cursor-pointer rounded text-xs transition-colors"
                          title={condition.type === "number" ? "Switch to Field" : "Switch to Number"}
                        >
                          {condition.type === "number" ? "123" : "ABC"}
                        </button>
                      </div>
                      
                      {/* Remove */}
                      <div className="col-span-1">
                        <button
                          onClick={() => removeEntryCondition(index)}
                          className="w-full px-1 py-1 bg-red-600 hover:bg-red-700 cursor-pointer rounded text-xs transition-colors"
                        >
                          <FaTrash className="w-3 h-3 mx-auto text-white" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <button
                onClick={updateEntryConditions}
                className="w-full px-4 py-2 bg-green-600 text-white cursor-pointer hover:bg-green-700 rounded-lg transition-colors mt-4"
                disabled={loading}
              >
                Update Entry Conditions
              </button>
            </div>

            {/* Exit Conditions */}
            <div className="border border-gray-300 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl text-gray-400 font-semibold flex items-center gap-2">
                  <FaArrowDown className="text-gray-400" />
                  Exit Conditions
                </h2>
                <button
                  onClick={addExitCondition}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 cursor-pointer rounded-lg transition-colors flex items-center gap-1 text-sm"
                >
                  <FaPlus className="w-3 h-3" /> Add
                </button>
              </div>
              
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {exitConditions.map((condition, index) => (
                  <div key={index} className="bg-gray-100 p-3 rounded-lg">
                    <div className="grid grid-cols-12 gap-2 items-center">
                      {/* Left Field */}
                      <div className="col-span-4">
                        <select
                          value={condition.left}
                          onChange={(e) => updateExitCondition(index, 'left', e.target.value)}
                          className="w-full px-2 py-1 bg-gray-100 text-gray-800 border border-gray-500 rounded text-xs focus:outline-none focus:border-green-500"
                        >
                          {FIELD_OPTIONS.map(field => (
                            <option key={field.key} value={field.key}>{field.label}</option>
                          ))}
                        </select>
                      </div>
                      
                      {/* Operator */}
                      <div className="col-span-2">
                        <select
                          value={condition.operator}
                          onChange={(e) => updateExitCondition(index, 'operator', e.target.value)}
                          className="w-full px-2 py-1 bg-gray-100 text-gray-800 border border-gray-500 rounded text-xs focus:outline-none focus:border-green-500"
                        >
                          {OPERATOR_OPTIONS.map(op => (
                            <option key={op.key} value={op.key}>{op.label}</option>
                          ))}
                        </select>
                      </div>
                      
                      {/* Right Value */}
                      <div className="col-span-4">
                        {condition.type === "field" ? (
                          <select
                            value={condition.right}
                            onChange={(e) => updateExitCondition(index, 'right', e.target.value)}
                            className="w-full px-2 py-1 bg-gray-100 text-gray-800 border border-gray-500 rounded text-xs focus:outline-none focus:border-green-500"
                          >
                            {FIELD_OPTIONS.map(field => (
                              <option key={field.key} value={field.key}>{field.label}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="number"
                            value={condition.right}
                            onChange={(e) => updateExitCondition(index, 'right', e.target.value)}
                            className="w-full px-2 py-1 bg-gray-100 text-gray-800 border border-gray-500 rounded text-xs focus:outline-none focus:border-green-500"
                          />
                        )}
                      </div>
                      
                      {/* Type Toggle */}
                      <div className="col-span-1">
                        <button
                          onClick={() => updateExitCondition(index, 'type', condition.type === "number" ? "field" : "number")}
                          className="w-full px-1 py-1 bg-green-600 hover:bg-green-700 cursor-pointer rounded text-xs transition-colors"
                          title={condition.type === "number" ? "Switch to Field" : "Switch to Number"}
                        >
                          {condition.type === "number" ? "123" : "ABC"}
                        </button>
                      </div>
                      
                      {/* Remove */}
                      <div className="col-span-1">
                        <button
                          onClick={() => removeExitCondition(index)}
                          className="w-full px-1 py-1 bg-red-600 hover:bg-red-700 cursor-pointer rounded text-xs transition-colors"
                        >
                          <FaTrash className="w-3 h-3 mx-auto" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <button
                onClick={updateExitConditions}
                className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 cursor-pointer rounded-lg transition-colors mt-4"
                disabled={loading}
              >
                Update Exit Conditions
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
