import pandas as pd
import numpy as np
import logging
from breeze_connect import BreezeConnect
from datetime import datetime, time
import login as l
import time as t
import json
import time
import os

# === Setup logging ===
logging.basicConfig(level=logging.DEBUG, format="%(asctime)s - %(message)s")

# === Load historical data ===
historical_df = pd.read_csv("ADICAP.csv", parse_dates=["datetime"])
historical_df.set_index("datetime", inplace=True)

# === Indicator functions ===
def calc_rsi(series, period=14):
    delta = series.diff()
    gain = np.where(delta > 0, delta, 0)
    loss = np.where(delta < 0, -delta, 0)
    roll_up = pd.Series(gain, index=series.index).rolling(period).mean()
    roll_down = pd.Series(loss, index=series.index).rolling(period).mean()
    RS = roll_up / roll_down
    return 100 - (100 / (1 + RS))

def calculate_all_indicators(df):
    df = df.copy()

    # Daily
    df["RSI_D"] = calc_rsi(df["close"], 14)
    df["EMA_50_D"] = df["close"].ewm(span=50, adjust=False).mean()
    df["EMA_100_D"] = df["close"].ewm(span=100, adjust=False).mean()
    df["EMA_200_D"] = df["close"].ewm(span=200, adjust=False).mean()

    # Weekly
    weekly = df.resample("W").agg({
        "open": "first", "high": "max", "low": "min", "close": "last", "volume": "sum"
    })
    weekly["RSI_W"] = calc_rsi(weekly["close"], 14)
    weekly["EMA_50_W"] = weekly["close"].ewm(span=50, adjust=False).mean()
    weekly["EMA_100_W"] = weekly["close"].ewm(span=100, adjust=False).mean()
    weekly["EMA_200_W"] = weekly["close"].ewm(span=200, adjust=False).mean()

    # Monthly
    monthly = df.resample("ME").agg({
        "open": "first", "high": "max", "low": "min", "close": "last", "volume": "sum"
    })
    monthly["RSI_M"] = calc_rsi(monthly["close"], 14)
    monthly["EMA_50_M"] = monthly["close"].ewm(span=50, adjust=False).mean()
    monthly["EMA_100_M"] = monthly["close"].ewm(span=100, adjust=False).mean()
    monthly["EMA_200_M"] = monthly["close"].ewm(span=200, adjust=False).mean()

    # Merge weekly and monthly indicators
    df = df.merge(weekly[["RSI_W", "EMA_50_W", "EMA_100_W", "EMA_200_W"]],
                  left_index=True, right_index=True, how="left", suffixes=("", "_weekly"))
    df = df.merge(monthly[["RSI_M", "EMA_50_M", "EMA_100_M", "EMA_200_M"]],
                  left_index=True, right_index=True, how="left", suffixes=("", "_monthly"))

    for col in ["RSI_W", "EMA_50_W", "EMA_100_W", "EMA_200_W"]:
        if col + "_weekly" in df.columns:
            df[col] = df[col].combine_first(df[col + "_weekly"])
            df.drop(columns=[col + "_weekly"], inplace=True)

    for col in ["RSI_M", "EMA_50_M", "EMA_100_M", "EMA_200_M"]:
        if col + "_monthly" in df.columns:
            df[col] = df[col].combine_first(df[col + "_monthly"])
            df.drop(columns=[col + "_monthly"], inplace=True)

    return df

# === Initial calculation ===
historical_df = calculate_all_indicators(historical_df)

# === Breeze connection ===
breeze = BreezeConnect(api_key=l.api_key)
breeze.generate_session(api_secret=l.api_secret, session_token=l.session_key)

# === Load saved position ===
position_file = "position_state.json"
if os.path.exists(position_file):
    with open(position_file, "r") as f:
        position_data = json.load(f)
        position = position_data.get("position")
        logging.info(f"♻️ Loaded saved position: {position}")
else:
    position = None

def save_position():
    with open(position_file, "w") as f:
        json.dump({"position": position}, f)
    logging.info(f"💾 Saved position: {position}")

# === Candle and state ===
daily_candle = {
    "datetime": None, "open": None,
    "high": float("-inf"), "low": float("inf"),
    "close": None, "volume": 0
}
current_minute_candle = None
last_logged_minute = None

# === Strategy ===
def check_strategy(row):
    global position
    msg = None

    required_cols = ["RSI_D", "RSI_W", "RSI_M", "EMA_100_D", "EMA_200_D", "EMA_200_W", "open", "close"]
    missing_or_nan = [col for col in required_cols if col not in row or pd.isna(row[col])]
    if missing_or_nan:
        logging.debug(f"⛔ Skipping row: missing or NaN columns: {missing_or_nan}")
        return None

    if (row["RSI_D"] > 58 and row["RSI_W"] > 58 and row["RSI_M"] > 58 and
        row["open"] > row["EMA_100_D"] and
        row["EMA_100_D"] > row["EMA_200_D"] and
        row["open"] > row["EMA_200_W"] and
        (pd.isna(row["EMA_200_M"]) or row["open"] > row["EMA_200_M"])):
        if position != "LONG":
            msg = f"✅ ENTRY LONG | Price: {row['open']:.2f}"
            logging.info("🎯 Entry signal met!")
    elif (row["close"] < row["EMA_200_D"]) or (row["RSI_W"] < 40):
        if position == "LONG":
            msg = f"❌ EXIT LONG | Price: {row['close']:.2f}"
            logging.info("📉 Exit signal met!")

    return msg

# === Tick Handler ===
def on_ticks(tick: dict):
    global daily_candle, current_minute_candle, last_logged_minute, historical_df, position

    price = tick.get("close")
    volume = tick.get("volume") or 0
    ts_str = tick.get("datetime")
    if price is None or ts_str is None:
        return

    try:
        price = float(price)
        volume = float(volume)
        ts = pd.to_datetime(ts_str)
    except Exception:
        return

    date_only = ts.normalize()
    ts_min = ts.floor("1min")

    # New trading day
    if daily_candle["datetime"] is None or date_only > daily_candle["datetime"]:
        if daily_candle["datetime"] is not None:
            new_row = pd.DataFrame([daily_candle]).set_index("datetime")
            historical_df = pd.concat([historical_df, new_row])
            historical_df = calculate_all_indicators(historical_df)
            logging.info("📊 Updated historical data with previous daily candle.")

        daily_candle.update({
            "datetime": date_only,
            "open": None,
            "high": float("-inf"),
            "low": float("inf"),
            "close": None,
            "volume": 0
        })

        logging.info(f"🗓 New trading day started: {date_only.date()}")

        if len(historical_df) >= 1:
            current_row = historical_df.iloc[-1].copy()
            current_row["open"] = price
            signal = check_strategy(current_row)
            if signal and position != "LONG":
                position = "LONG"
                save_position()
                logging.info(f"📈 ENTRY at Market Open using live price: {signal}")
        else:
            logging.warning("⚠️ Not enough historical data to evaluate strategy at market open.")

    # Update daily candle
    if daily_candle["open"] is None:
        daily_candle["open"] = price
    daily_candle["high"] = max(daily_candle["high"], price)
    daily_candle["low"] = min(daily_candle["low"], price)
    daily_candle["close"] = price
    daily_candle["volume"] += volume

    # Update 1-minute candle
    if current_minute_candle is None or current_minute_candle["datetime"] != ts_min:
        # Log previous minute candle
        if current_minute_candle and last_logged_minute != current_minute_candle["datetime"]:
            c = current_minute_candle
            logging.info(f"⏱ 1-min candle {c['datetime']} O:{c['open']:.2f} H:{c['high']:.2f} L:{c['low']:.2f} C:{c['close']:.2f} Vol:{int(c['volume'])}")
            try:
                autosave_df = pd.DataFrame([c])
                autosave_df.to_csv("ADICAP_autosave.csv", mode='a', index=False, header=not os.path.exists("ADICAP_autosave.csv"))
            except Exception as e:
                logging.error(f"Autosave failed: {e}")
            last_logged_minute = c["datetime"]

        current_minute_candle = {
            "datetime": ts_min,
            "open": price, "high": price,
            "low": price, "close": price,
            "volume": volume
        }
    else:
        current_minute_candle["high"] = max(current_minute_candle["high"], price)
        current_minute_candle["low"] = min(current_minute_candle["low"], price)
        current_minute_candle["close"] = price
        current_minute_candle["volume"] += volume

    # Market close logic
    if ts.time() >= time(15, 40, 1):
        logging.info("✅ Market closed. Finalizing daily candle.")
        new_row = pd.DataFrame([daily_candle]).set_index("datetime")
        historical_df = pd.concat([historical_df, new_row])
        historical_df = calculate_all_indicators(historical_df)
        latest = historical_df.iloc[-1]

        logging.info(
            f"📅 {latest.name.date()} | O:{latest['open']:.2f} H:{latest['high']:.2f} "
            f"L:{latest['low']:.2f} C:{latest['close']:.2f} | RSI_D:{latest['RSI_D']:.2f} "
            f"RSI_W:{latest['RSI_W']:.2f} RSI_M:{latest['RSI_M']:.2f}"
        )

        signal = check_strategy(latest)
        if signal:
            logging.info(signal)
            if "EXIT" in signal:
                position = None
                save_position()

        historical_df.to_csv("ADICAP_updated.csv")
        breeze.ws_disconnect()

# === Assign handler and connect ===
breeze.on_ticks = on_ticks
breeze.ws_connect()

breeze.subscribe_feeds(
    exchange_code="NSE",
    stock_code="ADICAP",
    expiry_date="",
    strike_price="",
    right="",
    product_type="cash",
    get_market_depth=False,
    get_exchange_quotes=True,
    interval="1minute"
)

logging.info("🚀 Strategy running... Awaiting live 1-minute data...")

while True:
    t.sleep(0.25)