from breeze_connect import BreezeConnect
import pandas as pd
import ta
import time
from tqdm import tqdm
import logging
from datetime import datetime, timedelta
import login as l  # your login.py with api_key, api_secret, session_key
import os

# Setup logging
logging.basicConfig(level=logging.INFO)

# Output directory
output_dir = "1 min candle"
os.makedirs(output_dir, exist_ok=True)

# Start Breeze session
breeze = BreezeConnect(api_key=l.api_key)
breeze.generate_session(api_secret=l.api_secret, session_token=l.session_key)
logging.info("✅ Breeze session established")

# Load symbols
symbol_df = pd.read_csv('custom_with_shortnames.csv')
symbol_df = symbol_df.dropna(subset=['ShortName'])
symbols = symbol_df['ShortName'].unique()

generated_files = []

for symbol in tqdm(symbols, desc='Processing Symbol'):
    logging.info(f"🔄 Processing symbol: {symbol}")
    try:
        exchange = "NSE"
        interval = "1minute"
        today = datetime.today()
        to_date = today - timedelta(days=1)
        from_date = to_date - timedelta(days=10 * 365)

        from_date_str = from_date.strftime("%Y-%m-%dT09:15:00.000Z")
        to_date_str = to_date.strftime("%Y-%m-%dT15:30:00.000Z")

        # Fetch historical data
        response = breeze.get_historical_data(
            interval=interval,
            stock_code=symbol,
            exchange_code=exchange,
            from_date=from_date_str,
            to_date=to_date_str
        )

        if not response.get("Success"):
            logging.warning(f"⚠️ No data for {symbol}. Skipping.")
            continue

        data = response["Success"]
        df = pd.DataFrame(data)

        if "datetime" not in df.columns:
            logging.warning(f"⚠️ No datetime in data for {symbol}. Skipping.")
            continue

        df["datetime"] = pd.to_datetime(df["datetime"])
        df.set_index("datetime", inplace=True)
        df.sort_index(inplace=True)

        # ✅ Filter for market hours: 9:15 to 15:30 only
        df = df.between_time("09:15", "15:30")

        for col in ["open", "high", "low", "close", "volume"]:
            df[col] = pd.to_numeric(df[col], errors='coerce')

        df.dropna(subset=["close"], inplace=True)

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
        monthly = df.resample("M").agg({
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

        # Combine all indicators
        final_df = pd.concat([
            df[["open", "high", "low", "close", "volume", "RSI_D", "EMA_50_D", "EMA_100_D", "EMA_200_D"]],
            weekly_indicators,
            monthly_indicators
        ], axis=1)

        output_file = os.path.join(output_dir, f"{symbol}_breeze_indicator_1min.csv")
        final_df.to_csv(output_file)
        generated_files.append(output_file)
        logging.info(f"✅ Indicators saved to: {output_file}")

    except Exception as e:
        logging.error(f"❌ Error processing {symbol}: {str(e)}")

# Save list of generated files
if generated_files:
    pd.DataFrame(generated_files, columns=["names"]).to_csv("generated_files_1.csv", index=False)
    logging.info("📁 List of generated indicator files saved to generated_files_1.csv")