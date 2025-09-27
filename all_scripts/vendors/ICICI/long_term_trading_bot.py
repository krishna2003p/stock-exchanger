
#########################################################################################
#                                                                                       #
# 📊 Dynamic Daily Trading Bot - API Configured 📈                                       #
# Fetches all configuration from MySQL:                                                 #
# Runs daily - completely configurable via API response                                 #
#                                                                                       #
# Author: KRISHNA PRAJAPATI 😊                                                          #
# Date: 2025-09-16                                                                      #
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
import numpy as np

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
from breeze_connection import multi_connect, ICICI_CREDENTIALS, CONFIG_API_URL
from db_connections import get_connection, close_connection

sys.path.append(os.path.join(os.path.dirname(__file__),'..', '..', 'common_scripts'))
from enable_logging import print_log

# API Configuration
API_TIMEOUT = 30  # seconds
bot_id = None

def fetch_trading_config(user_id):
    """Fetch trading configuration from getBotConfig API first, then fallback to MySQL"""
    try:
        global bot_id
        # MySQL connection details - adjust as needed
        connection = get_connection()
        
        if connection.is_connected():
            cursor = connection.cursor(dictionary=True)
            
            # Get main bot config
            bot_id = cursor.execute("SELECT id FROM bots WHERE user_id = %s", (user_id,))
            bot_id = cursor.fetchone()
            if not bot_id:
                raise Exception("No bot found for the given user_id")
            bot_id = bot_id['id']
            cursor.execute("SELECT * FROM bot_config WHERE bot_id = %s", (bot_id,))
            bot_config = cursor.fetchone()
            
            if not bot_config:
                raise Exception("No bot configuration found in database")
            
            # Get symbols
            cursor.execute("SELECT name FROM symbols WHERE botConfigId = %s", (bot_config['id'],))
            symbols_result = cursor.fetchall()
            symbols = [row['name'] for row in symbols_result]
            
            # Get entry conditions
            cursor.execute("SELECT * FROM entry_condition WHERE botConfigId = %s", (bot_config['id'],))
            entry_conditions_result = cursor.fetchall()
            entry_conditions = [{
                "left": row['left'],
                "operator": row['operator'],
                "right": row['right'],
                "type": row['type']
            } for row in entry_conditions_result]
            
            # Get exit conditions
            cursor.execute("SELECT * FROM exit_condition WHERE botConfigId = %s", (bot_config['id'],))
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
    except Exception as e:
        print_log(f"❌ Error loading configuration from MySQL: {e}")
    finally:
        if 'connection' in locals() and connection.is_connected():
            cursor.close()
            connection.close()
            print_log("🔌 MySQL connection closed")
    
    # Ultimate fallback - return None to use get_fallback_config()
    return None

# Save result in mysql
def save_bot_result_to_db(result):
    """Save bot result summary to MySQL database"""
    try:
        global bot_id
        # MySQL connection details - adjust as needed
        connection = get_connection()
        
        if connection.is_connected():
            cursor = connection.cursor()
            
            result_data = cursor.execute("SELECT id FROM bot_result WHERE bot_id = %s", (bot_id,))
            result_data = cursor.fetchone()
            if result_data:
                print_log("⚠️ Bot result already exists in database, updating...")
                update_query = """
                    UPDATE bot_result
                    SET status=%s, execution_time=%s, capital_per_stock=%s, is_live=%s, symbols_processed=%s,
                        current_holdings=%s, current_orders=%s, buy_orders=%s, sell_orders=%s,
                        total_buy_value=%s, total_sell_value=%s, net_flow=%s
                    WHERE bot_id=%s
                """
                cursor.execute(update_query, (
                    result.get('status', 'unknown'),
                    result.get('execution_time', datetime.now().strftime('%Y-%m-%d %H:%M:%S')),
                    result.get('capital_per_stock', 0),
                    int(result.get('is_live', False)),
                    result.get('symbols_processed', 0),
                    result.get('current_holdings', 0),
                    result.get('current_orders', 0),
                    result.get('buy_orders', 0),
                    result.get('sell_orders', 0),
                    result.get('total_buy_value', 0),
                    result.get('total_sell_value', 0),
                    result.get('net_flow', 0),
                    bot_id
                ))
                connection.commit()
                print_log("✅ Bot result updated in MySQL database")
                return True

            # Insert bot result
            insert_query = """
                INSERT INTO bot_result (bot_id, status, execution_time, capital_per_stock, is_live, symbols_processed, current_holdings, current_orders, buy_orders, sell_orders, total_buy_value, total_sell_value, net_flow)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            data_tuple = (
                bot_id,
                result.get('status', 'unknown'),
                result.get('execution_time', datetime.now().strftime('%Y-%m-%d %H:%M:%S')),
                result.get('capital_per_stock', 0),
                int(result.get('is_live', False)),
                result.get('symbols_processed', 0),
                result.get('current_holdings', 0),
                result.get('current_orders', 0),
                result.get('buy_orders', 0),
                result.get('sell_orders', 0),
                result.get('total_buy_value', 0),
                result.get('total_sell_value', 0),
                result.get('net_flow', 0)
            )
            cursor.execute(insert_query, data_tuple)
            connection.commit()
            
            print_log("✅ Bot result saved to MySQL database")
            return True
    except Exception as e:
        print_log(f"❌ Error saving bot result to MySQL: {e}")
    finally:
        if 'connection' in locals() and connection.is_connected():
            cursor.close()
            connection.close()
            print_log("🔌 MySQL connection closed")

# =====================
# EMA Calculation Function
# =====================
def calculate_ema(series, period):
    ema = [np.nan] * len(series)
    k = 2 / (period + 1)

    if len(series) < period:
        return pd.Series(ema, index=series.index)

    sma = series.iloc[:period].mean()
    ema[period - 1] = sma

    for i in range(period, len(series)):
        ema[i] = (series.iloc[i] * k) + (ema[i - 1] * (1 - k))

    return pd.Series(ema, index=series.index)

# =====================
# RSI Calculation Function
# =====================
def calculate_rsi(series, period=14):
    delta = series.diff()
    gains = delta.where(delta > 0, 0)
    losses = -delta.where(delta < 0, 0)

    avg_gain = gains.rolling(window=period, min_periods=period).mean().tolist()
    avg_loss = losses.rolling(window=period, min_periods=period).mean().tolist()

    rsi = [np.nan] * len(series)

    for i in range(period, len(series)):
        if i == period:
            prev_avg_gain = avg_gain[i]
            prev_avg_loss = avg_loss[i]
        else:
            current_gain = gains.iloc[i]
            current_loss = losses.iloc[i]

            prev_avg_gain = (prev_avg_gain * (period - 1) + current_gain) / period
            prev_avg_loss = (prev_avg_loss * (period - 1) + current_loss) / period

            avg_gain[i] = prev_avg_gain
            avg_loss[i] = prev_avg_loss

        if prev_avg_loss == 0:
            rsi[i] = 100
        else:
            rs = prev_avg_gain / prev_avg_loss
            rsi[i] = 100 - (100 / (1 + rs))
    return pd.Series(rsi, index=series.index)


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
        close_series = df["close"]
        df["EMA_50_D"] = calculate_ema(close_series, 50)
        df["EMA_100_D"] = calculate_ema(close_series, 100)
        df["EMA_200_D"] = calculate_ema(close_series, 200)
        df["RSI_D"] = calculate_rsi(close_series, 14)

        # Weekly indicators
        weekly_raw = df.resample("W-MON", label="left", closed="left").agg({
            "open": "first", "high": "max", "low": "min",
            "close": "last", "volume": "sum"
        })

        weekly_raw.rename(columns={
            "open": "open_w", "high": "high_w", "low": "low_w",
            "close": "close_w", "volume": "volume_w"
        }, inplace=True)

        weekly_raw["EMA_50_W"] = calculate_ema(weekly_raw["close_w"], 50)
        weekly_raw["EMA_100_W"] = calculate_ema(weekly_raw["close_w"], 100)
        weekly_raw["EMA_200_W"] = calculate_ema(weekly_raw["close_w"], 200)
        weekly_raw["RSI_W"] = calculate_rsi(weekly_raw["close_w"], 14)

        weekly_raw.ffill(inplace=True)
        weekly = weekly_raw.reindex(df.index, method="ffill")

        # Monthly indicators
        monthly_raw = df.resample("MS", label="left", closed="left").agg({
            "open": "first", "high": "max", "low": "min",
            "close": "last", "volume": "sum"
        })

        monthly_raw.rename(columns={
            "open": "open_m", "high": "high_m", "low": "low_m",
            "close": "close_m", "volume": "volume_m"
        }, inplace=True)

        monthly_raw["EMA_50_M"] = calculate_ema(monthly_raw["close_m"], 50)
        monthly_raw["EMA_100_M"] = calculate_ema(monthly_raw["close_m"], 100)
        monthly_raw["EMA_200_M"] = calculate_ema(monthly_raw["close_m"], 200)
        monthly_raw["RSI_M"] = calculate_rsi(monthly_raw["close_m"], 14)

        monthly_raw.ffill(inplace=True)
        monthly = monthly_raw.reindex(df.index, method="ffill")

        # Combine all indicators
        final_df = pd.concat([
            df[["open", "high", "low", "close", "volume", "RSI_D", "EMA_50_D", "EMA_100_D", "EMA_200_D"]],
            weekly[[
                "RSI_W", "EMA_50_W", "EMA_100_W", "EMA_200_W"
            ]],
            monthly[[
                "RSI_M", "EMA_50_M", "EMA_100_M", "EMA_200_M"
            ]]
        ], axis=1)

        final_df = final_df.round(2)

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
    trading_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    print_log("🚀 Starting Dynamic Trading Bot...")
    print_log(f"📅 Trading Date: {trading_time}")

    
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
        # symbols = ["ZOMLIM"]
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
                if owned_quantity == 0 and owned_quantity_orders == 0:  
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
                    if owned_quantity_orders != 0:
                        print_log(f"{symbol} Already is in order book:: ")
                    else:
                        print_log(f"{symbol} Already is in holdings:: ")
                    if check_exit_conditions(latest_row, exit_conditions):
                        sell_signals.append({
                            'symbol': symbol,
                            'price': closing_price,
                            'quantity': owned_quantity,
                            'value': owned_quantity * closing_price
                        })

            except Exception as e:
                print_log(f"❌ Error processing {symbol}: {e}")
                print(f"Error Traceback: {traceback.format_exc()}")
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


        # Save result to DB
        result = {
            "status": "success",
            "execution_time": trading_time,
            "capital_per_stock": capital_per_stock,
            "is_live": is_live,
            "symbols_processed": len(symbols),
            "current_holdings": len(current_holdings),
            "current_orders": len(current_orders),
            "sell_orders": len(sell_signals),
            "buy_orders": len(buy_signals),
            "total_sell_value": total_sell_value,
            "total_buy_value": total_buy_value,
            "net_flow": total_buy_value - total_sell_value
        }
        save_bot_result_to_db(result)

        # Step 8: Summary
        print_log("\n" + "="*60)
        print_log("📊 DYNAMIC TRADING SUMMARY")
        print_log("="*60)
        print_log(f"🔗 Configuration Source: {'API' if config != get_fallback_config() else 'Fallback'}")
        print_log(f"💰 Capital per Stock: ₹{capital_per_stock:,}")
        print_log(f"📈 Symbols Processed: {len(symbols)}")
        print_log(f"📊 Current Holdings: {len(current_holdings)} stocks")
        print_log(f"📊 Current Orders: {len(current_orders)} stocks")
        print_log(f"🔴 Sell Orders: {len(sell_signals)} (₹{total_sell_value:,.2f})")
        print_log(f"🟢 Buy Orders: {len(buy_signals)} (₹{total_buy_value:,.2f})")
        print_log(f"💹 Net Flow: ₹{total_buy_value - total_sell_value:,.2f}")
        print_log(f"🔄 Mode: {'LIVE TRADING' if is_live else 'DRY RUN'}")
        print_log("="*60)
        print_log("✅ Dynamic trading cycle completed!")

        print(json.dumps(result))

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
        print(f"No user ID argument passed: {user_id}")
