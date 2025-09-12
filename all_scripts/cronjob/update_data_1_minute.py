    #########################################################################################
    #                                                                                       #
    #           📊 Nifty 500 Historical 5-Minute Data Fetcher and Saver  📈                  #
    #           This script fetches 5-Minute interval historical trading data               #
    #           for Nifty 500 stocks over the past 18 years from a Breeze API,              #
    #           using concurrent threads to speed up retrieval, and saves the               #
    #           data as CSV files locally.                                                  #
    #                                                                                       #
    #           Author: KRISHNA PRAJAPATI 😊                                                #
    #           Date: 2025-08-07                                                            #
    #                                                                                       #
    ########################################################################################
import os
import pandas as pd
from datetime import datetime, timedelta
from breeze_connect import BreezeConnect
import ta
import logging
import time
import sys
import traceback

# If needed:
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from breeze_connection import multi_connect

sys.path.append(os.path.join(os.path.dirname(__file__),'..','common_scripts'))
from enable_logging import print_log

# Breeze session setup (use your own keys)
breeze = multi_connect('SWADESH')
print_log(f"✅ Breeze session established")

# Paths
home = os.path.expanduser("~")
data_dir = os.path.join(home,"Documents","Stock_Market")
symbol_file_path = os.path.join(data_dir,"common_csv","nifty_500_stock_code.csv")
symbols_df = pd.read_csv(symbol_file_path)
symbols = symbols_df['ShortName'].dropna().unique()

# Define folder structure and ensure directories exist
save_dir = os.path.join(data_dir, "nifty_500", "1_minute_data")
os.makedirs(save_dir, exist_ok=True)

for symbol in symbols:
    try:
        file_path = os.path.join(save_dir, f"{symbol}.csv")

        # Find last date from existing file or default to 2008-01-01
        if os.path.exists(file_path):
            last_row = pd.read_csv(file_path, usecols=['datetime']).tail(1)
            last_date_str = last_row.iloc[0]['datetime']
            print(f"last_date_str for {symbol}: {last_date_str}")
            last_date = pd.to_datetime(last_date_str).normalize()
            from_date = last_date + timedelta(days=1)
        else:
            from_date = datetime(2008, 1, 1)

        to_date = datetime.today()
        if from_date > to_date:
            print_log(f"No new data to fetch for {symbol}.")
            continue

        # Format dates for API
        from_date_str = from_date.strftime("%Y-%m-%dT09:15:00.000Z")
        to_date_str = to_date.strftime("%Y-%m-%dT15:30:00.000Z")

        print_log(f"📥 Fetching new data for {symbol} from {from_date.date()} to {to_date.date()}")

        response = breeze.get_historical_data(
            interval="1minute",
            stock_code=symbol,
            exchange_code="NSE",
            from_date=from_date_str,
            to_date=to_date_str
        )
        time.sleep(2)  # throttle a bit to avoid rate limit
        new_data = response.get("Success", [])
        if not new_data:
            print_log(f"No new data available for {symbol} in this range.")
            continue

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

        # Resample OHLCV for daily
        daily = combined_df.resample('D').agg({
            "open": "first",
            "high": "max",
            "low": "min",
            "close": "last",
            "volume": "sum"
        }).dropna()
        # DAILY indicators (add "_D" suffix)
        daily["RSI_D"] = ta.momentum.RSIIndicator(daily["close"], window=14).rsi()
        daily["EMA_50_D"] = ta.trend.EMAIndicator(daily["close"], window=50).ema_indicator()
        daily["EMA_100_D"] = ta.trend.EMAIndicator(daily["close"], window=100).ema_indicator()
        daily["EMA_200_D"] = ta.trend.EMAIndicator(daily["close"], window=200).ema_indicator()

        # Weekly OHLCV
        weekly = daily.resample("W").agg({
            "open": "first", "high": "max", "low": "min",
            "close": "last", "volume": "sum"
        }).dropna()
        weekly["RSI_W"] = ta.momentum.RSIIndicator(weekly["close"], window=14).rsi()
        weekly["EMA_50_W"] = ta.trend.EMAIndicator(weekly["close"], window=50).ema_indicator()
        weekly["EMA_100_W"] = ta.trend.EMAIndicator(weekly["close"], window=100).ema_indicator()
        weekly["EMA_200_W"] = ta.trend.EMAIndicator(weekly["close"], window=200).ema_indicator()

        # Monthly OHLCV
        monthly = daily.resample("ME").agg({
            "open": "first", "high": "max", "low": "min",
            "close": "last", "volume": "sum"
        }).dropna()
        monthly["RSI_M"] = ta.momentum.RSIIndicator(monthly["close"], window=14).rsi()
        monthly["EMA_50_M"] = ta.trend.EMAIndicator(monthly["close"], window=50).ema_indicator()
        monthly["EMA_100_M"] = ta.trend.EMAIndicator(monthly["close"], window=100).ema_indicator()
        monthly["EMA_200_M"] = ta.trend.EMAIndicator(monthly["close"], window=200).ema_indicator()

        # Add indicators to combined_df using ffill to nearest timestamp
        for ind in ["RSI_D", "EMA_50_D", "EMA_100_D", "EMA_200_D"]:
            combined_df[ind] = daily[ind].reindex(combined_df.index, method="ffill")
        for ind in ["RSI_W", "EMA_50_W", "EMA_100_W", "EMA_200_W"]:
            combined_df[ind] = weekly[ind].reindex(combined_df.index, method="ffill")
        for ind in ["RSI_M", "EMA_50_M", "EMA_100_M", "EMA_200_M"]:
            combined_df[ind] = monthly[ind].reindex(combined_df.index, method="ffill")

        # Add metadata columns
        combined_df["stock_code"] = symbol
        combined_df["exchange_code"] = "NSE"

        # Save only columns of interest, avoid repeated or conflicting names
        cols = [
            "stock_code", "exchange_code",
            "open", "high", "low", "close", "volume",
            "RSI_D", "EMA_50_D", "EMA_100_D", "EMA_200_D",
            "RSI_W", "EMA_50_W", "EMA_100_W", "EMA_200_W",
            "RSI_M", "EMA_50_M", "EMA_100_M", "EMA_200_M"
        ]
        final_df = combined_df[cols].copy()
        final_df.index.name = "datetime"
        final_df.to_csv(file_path)
        print_log(f"✅ Updated and saved data for {symbol}")

    except Exception as e:
        print_log(f"❌ Error processing {symbol}: Error:: {e}, Detail Error:: {traceback.print_exc()}")
