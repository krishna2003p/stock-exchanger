
#########################################################################################
#                                                                                       #
# 📊 Dynamic Daily Trading Bot - API Configured 📈                                     #
# Fetches all configuration from API: http://127.0.0.1:9000                           #
# Runs daily - completely configurable via API response                                #
#                                                                                       #
# Author: KRISHNA PRAJAPATI 😊                                                         #
# Date: 2025-09-16                                                                     #
#                                                                                       #
#########################################################################################

import os
import pandas as pd
from datetime import datetime, timedelta
from breeze_connect import BreezeConnect
import ta
import logging
import time
import sys
import traceback
import requests
import json

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
from breeze_connection import multi_connect, ICICI_CREDENTIALS, CONFIG_API_URL

sys.path.append(os.path.join(os.path.dirname(__file__),'..', '..', 'common_scripts'))
from enable_logging import print_log

# API Configuration
API_TIMEOUT = 30  # seconds

# def fetch_trading_config():
#     """Fetch trading configuration from API"""
#     try:
#         print_log(f"🔗 Fetching configuration from: {CONFIG_API_URL}")

#         response = requests.get(CONFIG_API_URL, timeout=API_TIMEOUT)
        
#         response.raise_for_status()

#         config = response.json()
#         config = config['status']
#         # Validate required fields
#         required_fields = ['capital_per_stock', 'is_live', 'symbols', 'entry_condition', 'exit_condition', 'interval']
#         for field in required_fields:
#             if field not in config:
#                 raise ValueError(f"Missing required field: {field}")

#         print_log(f"✅ Configuration loaded successfully")
#         print_log(f"📊 Capital per stock: ₹{config['capital_per_stock']:,}")
#         print_log(f"🔄 Trading mode: {'LIVE' if config['is_live'] else 'DRY RUN'}")
#         print_log(f"📈 Symbols count: {len(config['symbols'])}")
#         print_log(f"📈 Interval: {config['interval']}")
#         print_log(f"🎯 Entry conditions: {len(config['entry_condition'])}")
#         print_log(f"🚪 Exit conditions: {len(config['exit_condition'])}")

#         return config

#     except requests.exceptions.RequestException as e:
#         print_log(f"❌ Failed to fetch configuration from API: {e}")
#         return None
#     except json.JSONDecodeError as e:
#         print_log(f"❌ Invalid JSON response from API: {e}")
#         return None
#     except Exception as e:
#         print_log(f"❌ Error loading configuration: {e}")
#         return None

def fetch_trading_config(user_id):
    """Fetch trading configuration from getBotConfig API first, then fallback to MySQL"""
    
    # First, try getBotConfig API with cookie authentication
    try:
        print_log("🔗 Trying getBotConfig API with cookie authentication...")
        
        # Try the getBotConfig API endpoint
        getBotConfig_url = f"{CONFIG_API_URL}getBotConfig"
        print(f"getBotConfigURL:: {getBotConfig_url}")
        response = requests.get(getBotConfig_url, timeout=API_TIMEOUT)
        response.raise_for_status()
        
        api_data = response.json()
        
        # Transform getBotConfig response to expected format
        if api_data:
            config = {
                "capital_per_stock": api_data.get("capitalPerStock", 5000),
                "is_live": api_data.get("isLive", False),
                "symbols": api_data.get("symbols", ["RELIANCE", "TCS", "HDFCBANK"]),
                "entry_condition": api_data.get("entryCondition", []),
                "exit_condition": api_data.get("exitCondition", []),
                "interval": api_data.get("interval", "1day"),
                "session_token": api_data.get("sessionToken", ""),
                "user": api_data.get("sessionUser", "SWADESH")
            }
            
            print_log("✅ Configuration loaded from getBotConfig API")
            print_log(f"📊 Capital per stock: ₹{config['capital_per_stock']:,}")
            print_log(f"🔄 Trading mode: {'LIVE' if config['is_live'] else 'DRY RUN'}")
            print_log(f"📈 Symbols count: {len(config['symbols'])}")
            print_log(f"📈 Interval: {config['interval']}")
            print_log(f"🎯 Entry conditions: {len(config['entry_condition'])}")
            print_log(f"🚪 Exit conditions: {len(config['exit_condition'])}")
            
            return config
            
    except Exception as e:
        print_log(f"⚠️ getBotConfig API failed: {e}")
        print_log("🔄 Falling back to MySQL direct query...")
    
    # Fallback to MySQL direct query if API fails
    try:
        import mysql.connector
        from mysql.connector import Error
        
        print_log("🗄️ Connecting to MySQL database...")
        
        # MySQL connection details - adjust as needed
        connection = mysql.connector.connect(
            host='localhost',  # Change to your MySQL host
            database='stock_exchnage',  # Change to your database name
            user='root',  # Change to your MySQL username
            password='Stock@321'  # Change to your MySQL password
        )
        
        if connection.is_connected():
            cursor = connection.cursor(dictionary=True)
            
            # Get main bot config
            cursor.execute("SELECT * FROM botConfig WHERE userId = %s", (user_id,))
            bot_config = cursor.fetchone()
            
            if not bot_config:
                raise Exception("No bot configuration found in database")
            
            # Get symbols
            cursor.execute("SELECT name FROM Symbol WHERE botConfigId = %s", (bot_config['id'],))
            symbols_result = cursor.fetchall()
            symbols = [row['name'] for row in symbols_result]
            
            # Get entry conditions
            cursor.execute("SELECT * FROM entryCondition WHERE botConfigId = %s", (bot_config['id'],))
            entry_conditions_result = cursor.fetchall()
            entry_conditions = [{
                "left": row['left'],
                "operator": row['operator'],
                "right": row['right'],
                "type": row['type']
            } for row in entry_conditions_result]
            
            # Get exit conditions
            cursor.execute("SELECT * FROM exitCondition WHERE botConfigId = %s", (bot_config['id'],))
            exit_conditions_result = cursor.fetchall()
            exit_conditions = [{
                "left": row['left'],
                "operator": row['operator'],
                "right": row['right'],
                "type": row['type']
            } for row in exit_conditions_result]
            
            # Build final config
            config = {
                "capital_per_stock": float(bot_config['capitalPerStock']),
                "is_live": bool(bot_config['isLive']),
                "symbols": symbols,
                "entry_condition": entry_conditions,
                "exit_condition": exit_conditions,
                "interval": bot_config['interval'],
                "session_token": bot_config['sessionToken'],
                "user": bot_config['user']  # You might want to get this from the user table
            }
            
            print_log("✅ Configuration loaded from MySQL database")
            print_log(f"📊 Capital per stock: ₹{config['capital_per_stock']:,}")
            print_log(f"🔄 Trading mode: {'LIVE' if config['is_live'] else 'DRY RUN'}")
            print_log(f"📈 Symbols count: {len(config['symbols'])}")
            print_log(f"📈 Interval: {config['interval']}")
            print_log(f"🎯 Entry conditions: {len(config['entry_condition'])}")
            print_log(f"🚪 Exit conditions: {len(config['exit_condition'])}")
            
            return config
            
    except Error as e:
        print_log(f"❌ MySQL connection error: {e}")
    except Exception as e:
        print_log(f"❌ Error loading configuration from MySQL: {e}")
    finally:
        if 'connection' in locals() and connection.is_connected():
            cursor.close()
            connection.close()
            print_log("🔌 MySQL connection closed")
    
    # Ultimate fallback - return None to use get_fallback_config()
    return None


def get_fallback_config():
    """Return fallback configuration if API is unavailable"""
    print_log("⚠️ Using fallback configuration (API unavailable)")

    return {
        "capital_per_stock": 5000,
        "is_live": False,  # Always use dry run as fallback for safety
        "symbols": ["RELIANCE", "TCS", "HDFCBANK", "INFY", "HINDUNILVR"],  # Small sample
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
        ]
    }

def evaluate_condition(condition, row):
    """Evaluate a single trading condition"""
    try:
        left_value = row[condition["left"]] if condition["left"] in row.index else None
        
        if condition["type"] == "number":
            right_value = float(condition["right"])
        else:  # field type
            right_value = row[condition["right"]] if condition["right"] in row.index else None

        if pd.isna(left_value): 
            left_value = 0
            print_log(f"Left Value is NA, Making 0")
        if pd.isna(right_value):
            right_value = 0
            print_log(f"Right Value is NA, Making 0")

        operator = condition["operator"]


        if operator == ">":
            return left_value > right_value
        elif operator == "<":
            return left_value < right_value
        elif operator == ">=":
            return left_value >= right_value
        elif operator == "<=":
            return left_value <= right_value
        elif operator == "==":
            return left_value == right_value
        else:
            return False

    except Exception as e:
        print_log(f"❌ Error evaluating condition: {e}")
        return False

def check_entry_conditions(row, entry_conditions, symbol):
    """Check if all entry conditions are met"""
    
    for condition in entry_conditions:

        required_cols = ["RSI_D", "RSI_W", "RSI_M", "EMA_100_D", "EMA_200_D", "EMA_200_W", "open", "close"]
        if any(pd.isna(row.get(col)) for col in required_cols):
            print_log(f"[{symbol}] Skipping due to missing data.", level="debug")
            return False
        if not evaluate_condition(condition, row):
            return False
    return True

def check_exit_conditions(row, exit_conditions):
    """Check if any exit condition is met"""
    for condition in exit_conditions:
        if evaluate_condition(condition, row):
            return True
    return False

def get_current_holdings(breeze):
    """Get current portfolio holdings"""
    try:
        today = datetime.now()
        from_date = (today - timedelta(days=30)).strftime("%Y-%m-%dT00:00:00.000Z")
        to_date = today.strftime("%Y-%m-%dT23:59:59.000Z")

        resp = breeze.get_portfolio_holdings(
            exchange_code="NSE",
            from_date=from_date, 
            to_date=to_date, 
            stock_code="", 
            portfolio_type=""
        )

        holdings = resp.get("Success", [])
        holdings_dict = {}

        for holding in holdings:
            stock_code = holding.get('stock_code', '')
            quantity = int(float(holding.get('quantity', 0)))
            if quantity > 0:
                holdings_dict[stock_code] = quantity

        return holdings_dict

    except Exception as e:
        print_log(f"❌ Failed to get portfolio holdings: {e}")
        return {}
    
def get_current_orders(breeze):
    """Get current portfolio orders"""
    try:
        today = datetime.now()
        from_date = (today - timedelta(days=1)).strftime("%Y-%m-%dT00:00:00.000Z")
        to_date = today.strftime("%Y-%m-%dT23:59:59.000Z")

        resp = breeze.get_order_list(
            exchange_code="NSE",
            from_date=from_date, 
            to_date=to_date, 
        )

        orders = resp.get("Success", [])
        orders_dict = {}

        if orders is not None:
            for order in orders:
                stock_code = order.get('stock_code', '')
                quantity = int(float(order.get('quantity', 0)))
                if quantity > 0:
                    orders_dict[stock_code] = quantity

        return orders_dict

    except Exception as e:
        print_log(f"❌ Failed to get portfolio orders: {e}")
        return {}


def place_buy_order(breeze, symbol, quantity, price, is_live):
    """Place a buy order"""
    if not is_live:
        print_log(f"🔄 DRY RUN - Would BUY {symbol}: {quantity} shares at ₹{price:.2f}")
        return True

    try:
        response = breeze.place_order(
            stock_code=symbol,
            exchange_code="NSE",
            product="cash",
            action="buy",
            order_type="limit",
            stoploss="",
            quantity=str(quantity),
            price=str(price),
            validity="day",
            validity_date="",
            disclosed_quantity="0",
            expiry_date="",
            right="",
            strike_price=""
        )

        if response.get("Status") == 200:
            print_log(f"✅ BUY order placed: {symbol} - {quantity} shares at ₹{price:.2f}")
            return True
        else:
            print_log(f"❌ Failed to place BUY order for {symbol}: {response}")
            return False

    except Exception as e:
        print_log(f"❌ Error placing BUY order for {symbol}: {e}")
        return False

def place_sell_order(breeze, symbol, quantity, price, is_live):
    """Place a sell order"""
    if not is_live:
        print_log(f"🔄 DRY RUN - Would SELL {symbol}: {quantity} shares at ₹{price:.2f}")
        return True

    try:
        response = breeze.place_order(
            stock_code=symbol,
            exchange_code="NSE",
            product="cash",
            action="sell",
            order_type="limit",
            stoploss="",
            quantity=str(quantity),
            price=str(price),
            validity="day",
            validity_date="",
            disclosed_quantity="0",
            expiry_date="",
            right="",
            strike_price=""
        )

        if response.get("Status") == 200:
            print_log(f"✅ SELL order placed: {symbol} - {quantity} shares at ₹{price:.2f}")
            return True
        else:
            print_log(f"❌ Failed to place SELL order for {symbol}: {response}")
            return False

    except Exception as e:
        print_log(f"❌ Error placing SELL order for {symbol}: {e}")
        return False

def calculate_indicators(df):
    """Calculate all technical indicators"""
    try:
        # Daily indicators
        df["RSI_D"] = ta.momentum.RSIIndicator(df["close"], window=14).rsi()
        df["EMA_50_D"] = ta.trend.EMAIndicator(df["close"], window=50).ema_indicator()
        df["EMA_100_D"] = ta.trend.EMAIndicator(df["close"], window=100).ema_indicator()
        df["EMA_200_D"] = ta.trend.EMAIndicator(df["close"], window=200).ema_indicator()

        # Weekly indicators
        weekly = df.resample("W").agg({
            "open": "first",
            "high": "max",
            "low": "min",
            "close": "last",
            "volume": "sum"
        }).dropna()

        weekly["RSI_W"] = ta.momentum.RSIIndicator(weekly["close"], window=14).rsi()
        weekly["EMA_50_W"] = ta.trend.EMAIndicator(weekly["close"], window=50).ema_indicator()
        weekly["EMA_100_W"] = ta.trend.EMAIndicator(weekly["close"], window=100).ema_indicator()
        weekly["EMA_200_W"] = ta.trend.EMAIndicator(weekly["close"], window=200).ema_indicator()

        weekly_indicators = weekly.filter(like="RSI").join(weekly.filter(like="EMA")).reindex(df.index, method="ffill")

        # Monthly indicators
        monthly = df.resample("ME").agg({
            "open": "first",
            "high": "max",
            "low": "min",
            "close": "last",
            "volume": "sum"
        }).dropna()

        monthly["RSI_M"] = ta.momentum.RSIIndicator(monthly["close"], window=14).rsi()
        monthly["EMA_50_M"] = ta.trend.EMAIndicator(monthly["close"], window=50).ema_indicator()
        monthly["EMA_100_M"] = ta.trend.EMAIndicator(monthly["close"], window=100).ema_indicator()
        monthly["EMA_200_M"] = ta.trend.EMAIndicator(monthly["close"], window=200).ema_indicator()

        monthly_indicators = monthly.filter(like="RSI").join(monthly.filter(like="EMA")).reindex(df.index, method="ffill")

        # Combine all
        final_df = pd.concat([
            df[["open", "high", "low", "close", "volume", "RSI_D", "EMA_50_D", "EMA_100_D", "EMA_200_D"]],
            weekly_indicators,
            monthly_indicators
        ], axis=1)

        return final_df

    except Exception as e:
        print_log(f"❌ Error calculating indicators: {e}")
        return df

def update_stock_data(breeze, symbol, save_dir, interval):
    """Update historical data for a stock and return latest row"""
    try:
        file_path = os.path.join(save_dir, f"{symbol}.csv")

        # Find last date from existing file or default to 2008-01-01
        if os.path.exists(file_path):
            last_row = pd.read_csv(file_path, usecols=['datetime']).tail(1)
            last_date_str = last_row.iloc[0]['datetime']
            last_date = pd.to_datetime(last_date_str).normalize()
            from_date = last_date + timedelta(days=1)
        else:
            from_date = datetime(2008, 1, 1)

        to_date = datetime.today()

        if from_date.date() >= to_date.date():
            print_log(f"⏩ Data for {symbol} is already up to date. Skipping.")
            if os.path.exists(file_path):
                df = pd.read_csv(file_path, parse_dates=['datetime'], index_col='datetime')
                return df.iloc[-1] if len(df) > 0 else None
            else:
                return None

        # Format dates for API
        from_date_str = from_date.strftime("%Y-%m-%dT09:15:00.000Z")
        to_date_str = to_date.strftime("%Y-%m-%dT15:30:00.000Z")

        print_log(f"📥 Fetching data for {symbol} from {from_date.date()}")

        response = breeze.get_historical_data(
            interval="1day",
            stock_code=symbol,
            exchange_code="NSE",
            from_date=from_date_str,
            to_date=to_date_str
        )

        time.sleep(2)  # Rate limiting

        new_data = response.get("Success", [])
        if not new_data:
            # Load existing data if no new data
            if os.path.exists(file_path):
                df = pd.read_csv(file_path, parse_dates=['datetime'], index_col='datetime')
                return df.iloc[-1] if len(df) > 0 else None
            else:
                return None

        new_df = pd.DataFrame(new_data)
        new_df["datetime"] = pd.to_datetime(new_df["datetime"])
        new_df.set_index("datetime", inplace=True)
        new_df.sort_index(inplace=True)

        # Load existing data (if any)
        if os.path.exists(file_path):
            old_df = pd.read_csv(file_path, parse_dates=['datetime'], index_col='datetime')
            combined_df = pd.concat([old_df, new_df])
            combined_df = combined_df[~combined_df.index.duplicated(keep='last')]
            combined_df.sort_index(inplace=True)
        else:
            combined_df = new_df

        # Ensure numeric columns
        for col in ["open", "high", "low", "close", "volume"]:
            combined_df[col] = pd.to_numeric(combined_df[col], errors='coerce')
        combined_df.dropna(subset=["close"], inplace=True)

        # Calculate technical indicators
        combined_df = calculate_indicators(combined_df)

        # Save back to CSV
        combined_df.to_csv(file_path)
        print_log(f"✅ Updated data for {symbol}")

        return combined_df.iloc[-1] if len(combined_df) > 0 else None

    except Exception as e:
        print_log(f"❌ Error updating data for {symbol}: {e}")
        return None

def main(user_id):
    """Main trading function - runs once daily with dynamic configuration"""
    print_log("🚀 Starting Dynamic Trading Bot...")
    print_log(f"📅 Trading Date: {datetime.now().strftime('%Y-%m-%d')}")
    
    try:
        # Step 1: Fetch dynamic configuration from API
        config = fetch_trading_config(user_id)
        if config is None:
            print_log("⚠️ API configuration failed, using fallback settings")
            config = get_fallback_config()
        
        # Extract configuration values
        capital_per_stock = config["capital_per_stock"]
        is_live = config["is_live"]
        symbols = config["symbols"]
        # symbols = ["ALSTD", "BHAELE", "NEULAB", "CAPPOI"]
        entry_conditions = config["entry_condition"]
        exit_conditions = config["exit_condition"]
        interval = config["interval"]

        print_log(f"💰 Capital per stock: ₹{capital_per_stock:,}")
        print_log(f"🔄 Trading Mode: {'LIVE' if is_live else 'DRY RUN'}")

        # Step 2: Breeze session setup
        ICICI_CREDENTIALS[config['user']]['SESSION_TOKEN'] = config['session_token']
        breeze = multi_connect('SWADESHHUF')
        print_log("✅ Breeze session established")

        # Step 3: Paths setup
        home = os.path.expanduser("~")
        data_dir = os.path.join(home, "Documents", "Stock_Market")
        save_dir = os.path.join(data_dir, "final_stock")
        os.makedirs(save_dir, exist_ok=True)

        print_log(f"📊 Processing {len(symbols)} symbols from API")

        # Step 4: Get current holdings
        current_holdings = get_current_holdings(breeze)
        current_orders = get_current_orders(breeze)
        print_log(f"📈 Current holdings: {len(current_holdings)} stocks")
        print_log(f"📈 Current orders: {len(current_orders)} stocks")
        
        buy_signals = []
        sell_signals = []

        # Step 5: Update data for all stocks and evaluate conditions
        print_log("📥 Step 1: Fetching data and evaluating conditions...")

        for symbol in symbols:
            try:
                # Update data and get latest row
                latest_row = update_stock_data(breeze, symbol, save_dir, interval)
                if latest_row is None:
                    continue
                to_date = datetime.today()
                to_date_str = to_date.strftime("%Y-%m-%dT15:30:00.000Z")
                from_date_str = to_date.strftime("%Y-%m-%dT09:30:00.000Z")
                response = breeze.get_historical_data(
                    interval=interval,
                    stock_code=symbol,
                    exchange_code="NSE",
                    from_date=from_date_str,
                    to_date=to_date_str
                )

                time.sleep(2)  # Rate limiting

                new_data = response.get("Success", [])

                if new_data:
                    df = pd.DataFrame(new_data)
                    df["datetime"] = pd.to_datetime(df["datetime"])
                    df.sort_values("datetime", inplace=True)
                    closing_price = float(df.iloc[-1]["close"])
                else:
                    closing_price = latest_row['close']
                # Skip stocks above capital limit
                if closing_price > capital_per_stock:
                    continue

                # Check if we own this stock
                owned_quantity = current_holdings.get(symbol, 0)
                owned_quantity_orders = current_orders.get(symbol, 0)

                # For stocks we DON'T own - check BUY conditions
                if owned_quantity == 0:
                    if check_entry_conditions(latest_row, entry_conditions, symbol):
                        quantity = int(capital_per_stock / closing_price)
                        if quantity > 0:
                            buy_signals.append({
                                'symbol': symbol,
                                'price': closing_price,
                                'quantity': quantity,
                                'investment': quantity * closing_price
                            })

                # For stocks we DO own - check SELL conditions
                else:
                    if check_exit_conditions(latest_row, exit_conditions):
                        sell_signals.append({
                            'symbol': symbol,
                            'price': closing_price,
                            'quantity': owned_quantity,
                            'value': owned_quantity * closing_price
                        })

            except Exception as e:
                print_log(f"❌ Error processing {symbol}: {e}")
                continue
        # return
        # Step 6: Execute SELL orders first (to free up capital)
        print_log(f"\n💸 Step 2: Executing {len(sell_signals)} SELL orders...")
        total_sell_value = 0

        for signal in sell_signals:
            print_log(f"🔴 SELL: {signal['symbol']} - {signal['quantity']} shares at ₹{signal['price']:.2f} = ₹{signal['value']:.2f}")
            if place_sell_order(breeze, signal['symbol'], signal['quantity'], signal['price'], is_live):
                total_sell_value += signal['value']
            time.sleep(1)  # Rate limiting

        # Step 7: Execute BUY orders
        print_log(f"\n💰 Step 3: Executing {len(buy_signals)} BUY orders...")
        total_buy_value = 0

        for signal in buy_signals:
            print_log(f"🟢 BUY: {signal['symbol']} - {signal['quantity']} shares at ₹{signal['price']:.2f} = ₹{signal['investment']:.2f}")
            if place_buy_order(breeze, signal['symbol'], signal['quantity'], signal['price'], is_live):
                total_buy_value += signal['investment']
            time.sleep(1)  # Rate limiting

        # Step 8: Summary
        print_log("\n" + "="*60)
        print_log("📊 DYNAMIC TRADING SUMMARY")
        print_log("="*60)
        print_log(f"🔗 Configuration Source: {'API' if config != get_fallback_config() else 'Fallback'}")
        print_log(f"💰 Capital per Stock: ₹{capital_per_stock:,}")
        print_log(f"📈 Symbols Processed: {len(symbols)}")
        print_log(f"📊 Current Holdings: {len(current_holdings)} stocks")
        print_log(f"🔴 Sell Orders: {len(sell_signals)} (₹{total_sell_value:,.2f})")
        print_log(f"🟢 Buy Orders: {len(buy_signals)} (₹{total_buy_value:,.2f})")
        print_log(f"💹 Net Flow: ₹{total_buy_value - total_sell_value:,.2f}")
        print_log(f"🔄 Mode: {'LIVE TRADING' if is_live else 'DRY RUN'}")
        print_log("="*60)
        print_log("✅ Dynamic trading cycle completed!")

    except Exception as e:
        print_log(f"❌ Fatal error in trading bot: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    user_id = None
    if len(sys.argv) > 1:
        user_id = sys.argv[1]  # get user_id from argument
        print_log(f"User ID passed from API: {user_id}")

        # Modify main() signature to accept user_id if needed
        main(user_id)
    else:
        print_log("No user ID argument passed.")
    
    
