import pandas as pd
import numpy as np
import logging
from breeze_connect import BreezeConnect
from datetime import datetime
import login as l
import time as t
import json
import os

# Setup logging
logging.basicConfig(level=logging.DEBUG, format="%(asctime)s %(levelname)s:%(message)s")

# CONFIG
CAPITAL = 3000
IS_LIVE = True  # Set False to simulate without placing real orders

# STATE
position = None
units = 0
position_file = "position_state.json"

logging.debug("Loading historical data from CSV...")
# Load historical data with indicators pre-calculated
historical_df = pd.read_csv("ADICAP.csv", parse_dates=["datetime"])
historical_df.set_index("datetime", inplace=True)
logging.debug(f"Historical data loaded with shape: {historical_df.shape}")

# Initialize Breeze API
logging.debug("Initializing BreezeConnect...")
breeze = BreezeConnect(api_key=l.api_key)
breeze.generate_session(api_secret=l.api_secret, session_token=l.session_key)
logging.debug("Breeze session generated.")

def sync_broker_position():
    global position, units
    try:
        logging.debug("Syncing broker position at start...")
        resp = breeze.get_portfolio_positions()
        logging.debug(f"Get Portfolio Positions response : {resp}")
        if resp.get("Success") is None:
            logging.info("Broker-synced: no position")
            position = None
            units = 0
            return
        pos = next((p for p in resp["Success"] if p["stock_code"] == "ADICAP"), None)
        if pos and int(pos.get("quantity", 0)) != 0:
            position = "LONG" if int(pos.get("quantity")) > 0 else None
            units = abs(int(pos.get("quantity", 0)))
            logging.info(f"Broker-synced position: {position}, Units: {units}")
        else:
            position = None
            units = 0
            logging.info("Broker-synced: no position")
    except Exception as e:
        logging.warning(f"Position sync failed: {e}")

if IS_LIVE:
    sync_broker_position()

# Load persisted position state if exists
if os.path.exists(position_file):
    with open(position_file, "r") as f:
        data = json.load(f)
        position = data.get("position")
        units = data.get("units", 0)
        logging.info(f"Loaded state: {position}, Units: {units}")

def save_position():
    with open(position_file, "w") as f:
        json.dump({"position": position, "units": units}, f)
    logging.info(f"Saved state: {position}, Units: {units}")

# Strategy logic
def check_strategy(row):
    global position, units

    required = ["RSI_D", "RSI_W", "RSI_M", "EMA_100_D", "EMA_200_D", "EMA_200_W", "open", "close"]
    missing = [c for c in required if c not in row or pd.isna(row.get(c))]
    if missing:
        logging.debug(f"Missing data in row for strategy check; skipping: {missing}")
        return

    # Entry condition
    if (row["RSI_D"] > 58 and
        row["RSI_W"] > 58 and
        row["RSI_M"] > 58 and
        row["open"] > row["EMA_100_D"] and
        row["EMA_100_D"] > row["EMA_200_D"] and
        row["open"] > row["EMA_200_W"] and
        (pd.isna(row["EMA_200_M"]) or row["open"] > row["EMA_200_M"])):

        if position != "LONG":
            units = int(CAPITAL / row["open"])
            logging.info(f"Entry conditions met. Preparing to BUY {units} units at limit price {row['close']:.2f}")
            if IS_LIVE:
                try:
                    resp = breeze.place_order(
                        stock_code="ADICAP",
                        exchange_code="NSE",
                        product="cash",
                        action="buy",
                        order_type="limit",
                        stoploss="",
                        quantity=str(units),
                        price=str(row["close"]),
                        validity="day"
                    )
                    logging.info(f"Order BUY sent: {resp}")
                except Exception as e:
                    logging.error(f"Order BUY failed: {e}")
                    return
            position = "LONG"
            save_position()
            logging.info(f"✅ ENTRY LONG | Price: {row['open']:.2f} Units: {units}")

    # Exit condition
    elif (row["close"] < row["EMA_200_D"]) or (row["RSI_W"] < 40):
        if position == "LONG":
            logging.info(f"Exit conditions met. Preparing to SELL {units} units at limit price {row['close']:.2f}")
            if IS_LIVE:
                try:
                    resp = breeze.place_order(
                        stock_code="ADICAP",
                        exchange_code="NSE",
                        product="cash",
                        action="sell",
                        order_type="limit",
                        stoploss="",
                        quantity=str(units),
                        price=str(row["close"]),
                        validity="day"
                    )
                    logging.info(f"Order SELL sent: {resp}")
                except Exception as e:
                    logging.error(f"Order SELL failed: {e}")
                    return
            logging.info(f"🛑 EXIT LONG | Price: {row['close']:.2f} Units sold: {units}")
            position = None
            units = 0
            save_position()

# Tick handler for live 1-min candles
def on_ticks(tick):
    global historical_df

    try:
        price = float(tick["close"])
        ts = pd.to_datetime(tick["datetime"])
        logging.debug(f"Received tick for time: {ts}, price: {price}")
    except Exception as e:
        logging.warning(f"Invalid tick data: {tick} -> {e}")
        return

    # Use last row from historical_df with indicators, update price with live price
    latest = historical_df.iloc[-1].copy()
    latest["open"] = price
    latest["close"] = price

    check_strategy(latest)

# Initialize WebSocket and subscription
logging.debug("Initializing WebSocket connection and subscription...")
breeze.on_ticks = on_ticks
breeze.ws_connect()
breeze.subscribe_feeds(
    exchange_code="NSE", stock_code="ADICAP", expiry_date="", strike_price="",
    right="", product_type="cash", get_market_depth=False, get_exchange_quotes=True,
    interval="1minute"
)

logging.info("🚀 Live trading active (paper mode: {})".format("OFF" if IS_LIVE else "ON"))

# Run indefinitely
while True:
    t.sleep(1)
