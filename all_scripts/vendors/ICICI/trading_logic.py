import os, sys
import threading
import time
import traceback
import json
import pandas as pd
from breeze_connection import *
import asyncio
from datetime import datetime, timedelta

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'common_scripts'))
from enable_logging import print_log

from websocket_connections import start_websocket_in_thread

# Paths
home = os.path.expanduser("~")
DATA_DIR = os.path.join(home, "Documents", "Stock_Market","final_stock")
POSITION_DIR = os.path.join(DATA_DIR, "Documents", "Stock_Market", "Positions")
os.makedirs(POSITION_DIR, exist_ok=True)

tracked_order_stocks = set()
tracked_order_stocks_lock = threading.Lock()

# Global config and lock
config_lock = threading.Lock()

CONFIG = {
    "capital_per_stock": 5000,
    "is_live": True,
    "interval": "5minute",
    "session_token": "123456",
    "user": "SWADESHHUF",
    # "symbols": ["HBLPOW", "HDFAMC", "JINSTA", "JMFINA", "LAULAB", "MININD", "ADIAMC"],
    "symbols": ["AADHOS", "AARIND", "ABB", "ABBIND", "ABBPOW", "ACMSOL", "ACTCON", "ADATRA",
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
        "TEJNET", "THERMA", "THICHE", "TRILTD", "TUBIN", "TVSMOT", "UCOBAN",
        "UNIBAN", "UNIP", "UNISPI", "UTIAMC", "VARBEV", "VARTEX", "VEDFAS", "VEDLIM",
        "VIJDIA", "VISMEG", "VOLTAS", "WAAENE", "WABIND", "WELIND", "WHIIND", "WOCKHA",
        "XPRIND", "ZENTE", "ZOMLIM"],
    "entry_condition": [
        {"left": "RSI_D", "operator": ">", "right": "58", "type": "number"},
        {"left": "RSI_W", "operator": ">", "right": "58", "type": "number"},
        {"left": "RSI_M", "operator": ">", "right": "58", "type": "number"},
        {"left": "open", "operator": ">", "right": "EMA_100_D", "type": "field"},
        {"left": "EMA_100_D", "operator": ">", "right": "EMA_200_D", "type": "field"},
        {"left": "open", "operator": ">", "right": "EMA_200_W", "type": "field"},
        {"left": "open", "operator": ">", "right": "EMA_200_M", "type": "field"}
    ],
    "exit_condition": [
        {"left": "close", "operator": "<", "right": "EMA_200_D", "type": "field"},
        {"left": "RSI_W", "operator": "<", "right": "40", "type": "number"}
    ],
}

breeze = None
breeze_clients = {}
symbol_states = {}
last_portfolio_sync = 0  # Track last portfolio sync time
PORTFOLIO_SYNC_INTERVAL = 60  # Sync portfolio every 60 seconds

# Helper functions
def load_historical_df(symbol):
    path = os.path.join(DATA_DIR, f"{symbol}.csv")
    df = pd.read_csv(path, parse_dates=["datetime"])
    df.set_index("datetime", inplace=True)
    return df

def load_state(symbol):
    file_path = os.path.join(POSITION_DIR, f"{symbol}.json")
    if os.path.exists(file_path):
        with open(file_path, "r") as f:
            data = json.load(f)
        return data.get("position"), data.get("units", 0)
    return None, 0

def is_stock_already_ordered(symbol):
    """Check if stock already has an order or position"""
    with tracked_order_stocks_lock:
        return symbol in tracked_order_stocks

def add_stock_to_tracked_orders(symbol):
    """Add stock to tracked orders after placing order"""
    with tracked_order_stocks_lock:
        tracked_order_stocks.add(symbol)
        print_log(f"✅ Added {symbol} to tracked order stocks")

def remove_stock_from_tracked_orders(symbol):
    """Remove stock from tracked orders list after selling"""
    with tracked_order_stocks_lock:
        tracked_order_stocks.discard(symbol)
        print_log(f"🗑️ Removed {symbol} from tracked order stocks")

def save_state(symbol, position, units):
    file_path = os.path.join(POSITION_DIR, f"{symbol}.json")
    with open(file_path, "w") as f:
        json.dump({"position": position, "units": units}, f)
    print_log(f"[{symbol}] 💾 State saved: Position={position}, Units={units}")

def get_date_ranges():
    """Get dynamic date ranges for API calls"""
    now = datetime.now()
    dates = {}
    # For portfolio holdings: 2 months back to now
    two_months_ago = now - timedelta(days=60)
    dates['portfolio_from_date'] = two_months_ago.strftime("%Y-%m-%dT06:00:00.000Z")
    dates['portfolio_to_date'] = now.strftime("%Y-%m-%dT23:59:59.000Z")
    
    # For order list: today only  
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = now.replace(hour=23, minute=59, second=59, microsecond=999000)
    dates['order_from_date'] = today_start.strftime("%Y-%m-%dT%H:%M:%S.000Z")
    dates['order_to_date'] = today_end.strftime("%Y-%m-%dT%H:%M:%S.000Z")
    return dates


def sync_broker_position(symbol):
    """Sync position from broker portfolio - improved version"""
    global breeze
    try:
        if not breeze:
            print_log(f"[{symbol}] Breeze client not available for portfolio sync", level="warning")
            return None, 0
        dates = get_date_ranges()
        # resp = None
        try:
            resp = breeze.get_portfolio_holdings(exchange_code="NSE",
                    from_date=dates['portfolio_from_date'], 
                    to_date=dates['portfolio_to_date'], 
                    stock_code="", 
                    portfolio_type="")
        except Exception as api_error:
            print_log(f"❌ Failed to get portfolio holdings: {api_error} DetailError:: {traceback.print_exc()} ", level="error")
            return  # Skip this sync cycle
        
        try:
            orders = breeze.get_order_list(exchange_code="NSE",
                      from_date=dates['order_from_date'],
                      to_date=dates['order_to_date'])
        except Exception as api_error:
            print_log(f"❌ Failed to get order list: {api_error} DetailError:: {traceback.print_exc()} ", level="warning")
            orders = {"Success": []}

        with tracked_order_stocks_lock:
            # tracked_order_stocks.clear()
            
            # Add stocks from positions
            if resp.get("Success"):
                for pos in resp["Success"]:
                    if pos.get("stock_code"):
                        tracked_order_stocks.add(pos["stock_code"])
            
            # Add stocks from pending/executed orders
            if orders.get("Success"):
                for order in orders["Success"]:
                    if order.get("stock_code") and order.get("status") in ["ORDERED", "EXECUTED"]:
                        tracked_order_stocks.add(order["stock_code"])


        if resp.get("Success") is None:
            print_log(f"[{symbol}] No portfolio data received from broker", level="debug")
            return None, 0
        
        # Find position for this specific symbol
        pos = next((p for p in resp["Success"] if p.get("stock_code") == symbol), None)
        if pos:
            quantity = int(pos.get("quantity", 0))
            if quantity != 0:
                position = "LONG" if quantity > 0 else None
                units = abs(quantity)
                print_log(f"[{symbol}] 📊 Broker position synced: {position}, Units: {units}")
                return position, units
        
        # No position found for this symbol
        print_log(f"[{symbol}] No position found in broker portfolio", level="debug")
        return None, 0
        
    except Exception as e:
        print_log(f"[{symbol}] Failed to sync broker position: {e}", level="warning")
        return None, 0

def sync_all_portfolio_positions():
    """Sync all portfolio positions from broker"""
    global breeze, last_portfolio_sync
    
    current_time = time.time()
    if current_time - last_portfolio_sync < PORTFOLIO_SYNC_INTERVAL:
        return  # Don't sync too frequently
    
    try:
        if not breeze:
            return
            
        print_log("🔄 Syncing all portfolio positions from broker...")
        dates = get_date_ranges()

        try:
            resp = breeze.get_portfolio_holdings(exchange_code="NSE",
                    from_date=dates['portfolio_from_date'], 
                    to_date=dates['portfolio_to_date'], 
                    stock_code="", 
                    portfolio_type="")
        except Exception as api_error:
            print_log(f"❌ Failed to get portfolio holdings: {api_error}, DetailError:: {traceback.print_exc()}", level="error")
            return  # Skip this sync cycle
        
        try:
            orders = breeze.get_order_list(exchange_code="NSE",
                      from_date=dates['order_from_date'],
                      to_date=dates['order_to_date'])
        except Exception as api_error:
            print_log(f"❌ Failed to get order list: {api_error}, DetailError:: {traceback.print_exc()}", level="warning")
            orders = {"Success": []}
        
        if resp.get("Success") is None:
            print_log("No portfolio data received from broker", level="warning")
            return
        

        with tracked_order_stocks_lock:
            # tracked_order_stocks.clear()
            
            # Add stocks from positions
            if resp.get("Success"):
                for pos in resp["Success"]:
                    if pos.get("stock_code"):
                        tracked_order_stocks.add(pos["stock_code"])
            
            # Add stocks from pending/executed orders
            if orders.get("Success"):
                print_log(f"Ordered Data :: {orders}")
                for order in orders["Success"]:
                    if order.get("stock_code") and order.get("status") in ["Ordered", "Executed"]:
                        tracked_order_stocks.add(order["stock_code"])

        # Update positions for all tracked symbols
        with config_lock:
            for symbol in symbol_states.keys():
                pos = next((p for p in resp["Success"] if p.get("stock_code") == symbol), None)
                if pos:
                    quantity = int(pos.get("quantity", 0))
                    if quantity != 0:
                        position = "LONG" if quantity > 0 else None
                        units = abs(quantity)
                        
                        # Update local state
                        symbol_states[symbol]["position"] = position
                        symbol_states[symbol]["units"] = units
                        save_state(symbol, position, units)
                        print_log(f"[{symbol}] 📊 Position updated from broker: {position}, Units: {units}")
                    else:
                        # No position in broker
                        symbol_states[symbol]["position"] = None
                        symbol_states[symbol]["units"] = 0
                        save_state(symbol, None, 0)
                        print_log(f"[{symbol}] 📊 Position cleared from broker sync")
                else:
                    # Symbol not found in portfolio
                    symbol_states[symbol]["position"] = None
                    symbol_states[symbol]["units"] = 0
                    save_state(symbol, None, 0)
        
        last_portfolio_sync = current_time
        print_log("✅ Portfolio sync completed")
        
    except Exception as e:
        print_log(f"Error syncing portfolio positions: {e} ", level="error")

def evaluate_condition(condition, row):
    """Evaluate a single condition against a row of data"""
    try:
        left_val = row.get(condition["left"], 0) if condition["left"] in row else 0
        
        if condition["type"] == "number":
            right_val = float(condition["right"])
        else:  # field type
            right_val = row.get(condition["right"], 0) if condition["right"] in row else 0
        
        operator = condition["operator"]
        
        if operator == ">":
            return left_val > right_val
        elif operator == ">=":
            return left_val >= right_val
        elif operator == "<":
            return left_val < right_val
        elif operator == "<=":
            return left_val <= right_val
        elif operator == "==":
            return left_val == right_val
        elif operator == "!=":
            return left_val != right_val
        else:
            print_log(f"Unknown operator: {operator}", level="warning")
            return False
            
    except Exception as e:
        print_log(f"Error evaluating condition {condition}: {e}", level="warning")
        return False

def check_strategy(symbol, row):
    """Improved strategy checking with better position management"""
    global breeze
    
    with config_lock:
        state = symbol_states.get(symbol)
        if not state:
            print_log(f"[{symbol}] No state found for symbol", level="warning")
            return
        
        entry_conditions = CONFIG.get("entry_condition", [])
        exit_conditions = CONFIG.get("exit_condition", [])
        capital = CONFIG.get("capital_per_stock", 10000)
        is_live = CONFIG.get("is_live", False)
        
        # Get current position info
        current_position = state.get("position")
        current_units = state.get("units", 0)

    # Check if required columns exist
    required_cols = ["RSI_D", "RSI_W", "RSI_M", "EMA_100_D", "EMA_200_D", "EMA_200_W", "open", "close"]
    if any(pd.isna(row.get(col)) for col in required_cols):
        print_log(f"[{symbol}] Skipping due to missing data.", level="debug")
        return

    # Re-check current position after potential sync
    with config_lock:
        current_position = symbol_states[symbol].get("position")
        current_units = symbol_states[symbol].get("units", 0)

    # ENTRY LOGIC - Only buy if we don't have a LONG position
    if current_position != "LONG":
        # Evaluate all entry conditions (ALL must be true)
        print_log(f"For purchaseing symbol position:: {symbol_states[symbol]["position"]}")
        entry_condition_met = all(evaluate_condition(condition, row) for condition in entry_conditions)
        
        if entry_condition_met:
            # Double-check with broker if live trading
            if is_stock_already_ordered(symbol):
                print_log(f"[{symbol}] ⚠️ Already ordered/positioned. Skipping duplicate order.")
                return
            
            if is_live:
                broker_position, broker_units = sync_broker_position(symbol)
                if broker_position == "LONG":
                    print_log(f"[{symbol}] ⚠️  Entry signal but broker already has LONG position. Skipping buy.")
                    # Update local state to match broker
                    with config_lock:
                        symbol_states[symbol]["position"] = "LONG"
                        symbol_states[symbol]["units"] = broker_units
                    save_state(symbol, "LONG", broker_units)
                    return
            
            # Calculate units to buy
            units = max(1, int(capital / max(row.get("open", 1), 1)))  # At least 1 unit

            add_stock_to_tracked_orders(symbol)
            
            print_log(f"[{symbol}] 📈 Entry conditions met. Buying {units} units @ {row.get('close', 0):.2f}, Current Position: {current_position}")
            print_log(f"After purchased symbol position:: {symbol_states[symbol]["position"]}, units:: {symbol_states[symbol]["units"]}")
            
            # Place buy order if live trading
            if is_live and breeze:
                try:
                    # resp = breeze.place_order(
                    #     stock_code=symbol,
                    #     exchange_code="NSE",
                    #     product="cash",
                    #     action="buy",
                    #     order_type="limit",
                    #     stoploss="",
                    #     quantity=str(units),
                    #     price=str(row.get("close", 0)),
                    #     validity="day"
                    # )
                    print_log(f"[{symbol}] 📊 Buy order placed: ")
                    
                    # Only update position if order was successful
                    # if resp.get("Success"):
                    #     with config_lock:
                    #         symbol_states[symbol]["position"] = "LONG"
                    #         symbol_states[symbol]["units"] = units
                    #     save_state(symbol, "LONG", units)
                    #     print_log(f"[{symbol}] ✅ Position updated after successful buy order")
                    # else:
                    #     print_log(f"[{symbol}] ❌ Buy order failed: {resp}")
                        
                except Exception as e:
                    print_log(f"[{symbol}] Failed to place buy order: {e}", level="error")
                    return
            else:
                # Paper trading - just update position
                with config_lock:
                    symbol_states[symbol]["position"] = "LONG"
                    symbol_states[symbol]["units"] = units
                save_state(symbol, "LONG", units)
                print_log(f"[{symbol}] 📝 Paper trade: Position updated to LONG with {units} units")

    # EXIT LOGIC - Only sell if we have a LONG position
    elif current_position == "LONG" and current_units > 0:
        # Evaluate all exit conditions (ANY can be true)
        exit_condition_met = any(evaluate_condition(condition, row) for condition in exit_conditions)
        
        if exit_condition_met:
            print_log(f"[{symbol}] 🛑 Exit condition met. Selling {current_units} units @ {row.get('close', 0):.2f}")
            
            # Place sell order if live trading
            if is_live and breeze:
                try:
                    # resp = breeze.place_order(
                    #     stock_code=symbol,
                    #     exchange_code="NSE",
                    #     product="cash",
                    #     action="sell",
                    #     order_type="market",
                    #     stoploss="",
                    #     quantity=str(current_units),
                    #     price=str(row.get("close", 0)),
                    #     validity="day"
                    # )
                    print_log(f"[{symbol}] 📊 Sell order placed: ")
                    remove_stock_from_tracked_orders(symbol)
                    # Only update position if order was successful
                    # with config_lock:
                    #     symbol_states[symbol]["position"] = None
                    #     symbol_states[symbol]["units"] = 0
                    #     save_state(symbol, None, 0)
                    #     print_log(f"[{symbol}] ✅ Position cleared after successful sell order")
                    # if resp.get("Success"):
                    #     with config_lock:
                    #         symbol_states[symbol]["position"] = None
                    #         symbol_states[symbol]["units"] = 0
                    #     save_state(symbol, None, 0)
                    #     print_log(f"[{symbol}] ✅ Position cleared after successful sell order")
                    # else:
                    #     print_log(f"[{symbol}] ❌ Sell order failed: {resp}")
                        
                except Exception as e:
                    print_log(f"[{symbol}] Failed to place sell order: {e}", level="error")
                    return
            else:
                # Paper trading - just clear position
                with config_lock:
                    symbol_states[symbol]["position"] = None
                    symbol_states[symbol]["units"] = 0
                save_state(symbol, None, 0)
                print_log(f"[{symbol}] 📝 Paper trade: Position cleared")

def initialize_websocket_feeds(session_key, script_codes, on_ticks):
    try:
        print_log(f"Calling function initialize_websocket_feeds")
        start_websocket_in_thread(session_key, script_codes, on_ticks)
    except Exception as e:
        print_log(f"Error in initialize_websocket_feeds Error:{e}, Detail Error::{traceback.print_exc()}")

def on_ticks(tick):
    symbol = tick.get("stock_code")
    # print(f"Data are comming from websocket: {tick}")
    # print_log(f"Data are comming from websocket: {tick}")
    with config_lock:
        if symbol not in symbol_states:
            return

    try:
        price = float(tick.get("close", 0))
        print_log(f"[{symbol}] → {price}", level="debug")
    except Exception as e:
        print_log(f"[{symbol}] Tick parse error: {e}", level="warning")
        return

    with config_lock:
        latest_row = symbol_states[symbol]["historical"].iloc[-1].copy()
        latest_row["open"] = price
        latest_row["close"] = price

    check_strategy(symbol, latest_row)

# API async endpoints (keeping your existing API structure)
async def update_session(req):
    print_log(f"Call update_session function Payload:: {req}")
    global breeze
    user = req.user
    session_token = req.session_token
    CONFIG['session_token'] = session_token

    allowed_users = ['VACHI','SWADESH','RAMKISHAN','RAMKISHANHUF','SWADESHHUF']
    if user not in allowed_users:
        raise Exception("Invalid user")

    try:
        ICICI_CREDENTIALS[user]['SESSION_TOKEN'] = session_token
        breeze = multi_connect(user)
        if breeze:
            breeze_clients[user] = breeze
            # breeze.on_ticks = on_ticks
            # breeze.ws_connect()
            stock_codes = CONFIG.get("symbols")
            session_token = ICICI_CREDENTIALS[user]['SESSION_KEY']
            initialize_websocket_feeds(session_token, stock_codes, on_ticks)
            print_log(f"Breeze client connected for user: {user}")
            
            # Sync portfolio after connection
            sync_all_portfolio_positions()
            
            return {"message": f"Session updated and Breeze connected for user {user}"}
        else:
            raise Exception("Failed to connect Breeze client")
    except Exception as e:
        print_log(f"Error updating session for user {user}: {e}", level="error")
        raise

async def add_stock(req):
    print_log(f"Call add_stock function Payload:: {req}")
    stock = req.stock
    if stock is None:
        return {"status_code":400, "detail":"Missing 'stock' field"}

    with config_lock:
        if stock in CONFIG["symbols"]:
            return {"message": f"Stock {stock} already in list"}
        CONFIG["symbols"].append(stock)

    try:
        df = load_historical_df(stock)
        with config_lock:
            is_live = CONFIG["is_live"]
            
        if is_live:
            position, units = sync_broker_position(stock)
        else:
            position, units = load_state(stock)
            
        with config_lock:
            symbol_states[stock] = {
                "position": position,
                "units": units,
                "historical": df
            }

        # Subscribe to websocket feed
        session_token = ICICI_CREDENTIALS["SWADESHHUF"]["SESSION_KEY"]
        stock_codes = CONFIG.get("symbols")
        initialize_websocket_feeds(session_token, [stock], on_ticks)

        # Subscribe to breeze feed
        user = "SWADESHHUF"
        interval = CONFIG['interval']
        if user in breeze_clients:
            client = breeze_clients[user]
            client.subscribe_feeds(
                exchange_code="NSE",
                stock_code=stock,
                expiry_date="",
                strike_price="",
                right="",
                interval=interval,
                product_type="cash",
                get_market_depth=False,
                get_exchange_quotes=True
            )
            print_log(f"[{stock}] Subscribed to feed after add_stock API.")
            
    except Exception as e:
        print_log(f"[{stock}] Failed to add and subscribe: {e}", level="error")

    return {"message": f"Stock {stock} added"}

async def remove_stock(req):
    print_log(f"Call remove_stock function Payload:: {req}")
    stock = req.stock
    if stock is None:
        return {"status_code":400, "detail":"Missing 'stock' field"}

    with config_lock:
        if stock not in CONFIG["symbols"]:
            return {"message": f"Stock {stock} not found"}
        CONFIG["symbols"].remove(stock)
        if stock in symbol_states:
            symbol_states.pop(stock)

    return {"message": f"Stock {stock} removed"}

async def update_capital(req):
    print_log(f"Call update_capital function Payload:: {req}")
    if req.capital_per_stock is None:
        return {"status_code":400, "detail":"Missing 'capital_per_stock' field"}

    with config_lock:
        CONFIG["capital_per_stock"] = req.capital_per_stock

    return {"message": f"capital_per_stock updated to {req.capital_per_stock}"}

async def update_interval(req):
    print_log(f"Call update_interval function Payload:: {req}")
    if req.interval is None:
        return {"status_code":400, "detail":"Missing 'interval' field"}

    with config_lock:
        CONFIG["interval"] = req.interval

    return {"message": f"interval updated to {req.interval}"}

async def update_is_live(req):
    print_log(f"Call update_is_live function Payload:: {req}")
    if req.is_live is None:
        return {"status_code":400, "detail":"Missing 'is_live' field"}

    with config_lock:
        CONFIG["is_live"] = req.is_live

    return {"message": f"is_live updated to {req.is_live}"}

async def update_entry_condition(req):
    print_log(f"Call update_entry_condition function Payload:: {req}")
    if req.entry_condition is None:
        return {"status_code":400, "detail":"entry_condition is required"}

    # Validate condition format
    for condition in req.entry_condition:
        if not all(key in condition for key in ["left", "operator", "right", "type"]):
            return {"status_code":400, "detail":"Invalid condition format"}
        if condition["operator"] not in [">", ">=", "<", "<=", "==", "!="]:
            return {"status_code":400, "detail":"Invalid operator"}
        if condition["type"] not in ["number", "field"]:
            return {"status_code":400, "detail":"Invalid condition type"}

    with config_lock:
        CONFIG["entry_condition"] = req.entry_condition

    print_log(f"Entry conditions updated: {req.entry_condition}")
    return {"message": "Entry condition updated"}

async def update_exit_condition(req):
    print_log(f"Call update_exit_condition function Payload:: {req}")
    if req.exit_condition is None:
        return {"status_code":400, "detail":"exit_condition is required"}

    # Validate condition format
    for condition in req.exit_condition:
        if not all(key in condition for key in ["left", "operator", "right", "type"]):
            return {"status_code":400, "detail":"Invalid condition format"}
        if condition["operator"] not in [">", ">=", "<", "<=", "==", "!="]:
            return {"status_code":400, "detail":"Invalid operator"}
        if condition["type"] not in ["number", "field"]:
            return {"status_code":400, "detail":"Invalid condition type"}

    with config_lock:
        CONFIG["exit_condition"] = req.exit_condition

    print_log(f"Exit conditions updated: {req.exit_condition}")
    return {"message": "Exit condition updated"}

async def lifespan_setup():
    print_log("Starting lifespan - initializing Breeze clients...")

    # Initialize breeze
    for user in ['SWADESHHUF']:
        global breeze
        breeze = multi_connect(user)
        session_token = ICICI_CREDENTIALS[user]['SESSION_KEY']
        CONFIG['session_token'] = ICICI_CREDENTIALS[user]['SESSION_TOKEN']
        if breeze:
            breeze_clients[user] = breeze
            print_log(f"Connected Breeze for user {user}")
            
            # Initialize websocket
            stock_codes = CONFIG.get("symbols")
            initialize_websocket_feeds(session_token, stock_codes, on_ticks)
            print_log(f"WebSocket connected for user {user}")
            
            # Initial portfolio sync
            sync_all_portfolio_positions()
        else:
            print_log(f"Failed to connect Breeze for user {user}", level="warning")

    # Load historical data and sync positions for all symbols
    with config_lock:
        current_symbols = CONFIG["symbols"][:]
        is_live = CONFIG["is_live"]

    BATCH_SIZE = 50
    for batch_start in range(0, len(current_symbols), BATCH_SIZE):
        batch = current_symbols[batch_start:batch_start + BATCH_SIZE]
        print_log(f"Processing batch {batch_start // BATCH_SIZE + 1}")

        for symbol in batch:
            try:
                df = load_historical_df(symbol)
            except Exception as e:
                print_log(f"[{symbol}] Failed to load historical data: {e}", level="error")
                continue

            if is_live:
                position, units = sync_broker_position(symbol)
            else:
                position, units = load_state(symbol)

            with config_lock:
                symbol_states[symbol] = {
                    "position": position,
                    "units": units,
                    "historical": df
                }

            print_log(f"[{symbol}] Ready | Position: {position}, Units: {units}")

            # Subscribe to feeds
            for user, client in breeze_clients.items():
                try:
                    client.subscribe_feeds(
                        exchange_code="NSE",
                        stock_code=symbol,
                        expiry_date="",
                        strike_price="",
                        right="",
                        product_type="cash",
                        get_market_depth=False,
                        get_exchange_quotes=True
                    )
                    print_log(f"[{symbol}] Subscribed to feed on user {user}")
                except Exception as e:
                    print_log(f"[{symbol}] Failed to subscribe feed on user {user}: {e}", level="error")

        await asyncio.sleep(1)

    print_log("🚀 Live trading started.")

    # Background worker thread
    def background_worker():
        while True:
            try:
                # Periodic portfolio sync
                if CONFIG.get("is_live", False):
                    sync_all_portfolio_positions()
                time.sleep(20)  # Check every minute
            except Exception as e:
                print_log(f"Background worker error: {e}", level="error")
                time.sleep(5)

    threading.Thread(target=background_worker, daemon=True).start()
