from breeze_connect import BreezeConnect
import pandas as pd
import logging
from datetime import datetime, timedelta
import os
import time
import login as l  # Replace with your actual login details

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Output directory
output_dir = "1min_merged_by_symbol"
os.makedirs(output_dir, exist_ok=True)

# Breeze session
breeze = BreezeConnect(api_key=l.api_key)
breeze.generate_session(api_secret=l.api_secret, session_token=l.session_key)
logging.info("✅ Breeze session established")

# Load symbol list
symbol_df = pd.read_csv('custom_with_shortnames.csv')
symbol_df = symbol_df.dropna(subset=['ShortName'])
symbols = symbol_df['ShortName'].unique()

start_date = datetime(2011, 1, 1)
end_date = datetime.today() - timedelta(days=1)

def fetch_single_day(symbol, date):
    from_str = date.strftime("%Y-%m-%dT09:15:00.000Z")
    to_str = date.strftime("%Y-%m-%dT15:30:00.000Z")

    try:
        response = breeze.get_historical_data(
            interval="1minute",
            stock_code=symbol,
            exchange_code="NSE",
            from_date=from_str,
            to_date=to_str
        )
        data = response.get("Success", [])
        if data:
            df = pd.DataFrame(data)
            df["datetime"] = pd.to_datetime(df["datetime"])
            df.set_index("datetime", inplace=True)
            df.sort_index(inplace=True)
            for col in ["open", "high", "low", "close", "volume"]:
                df[col] = pd.to_numeric(df[col], errors='coerce')
            df.dropna(inplace=True)
            return df
    except Exception as e:
        logging.warning(f"❌ Error fetching {symbol} on {date.date()}: {e}")
    return None

for symbol in symbols:
    logging.info(f"🚀 Starting symbol: {symbol}")
    current_date = start_date
    daily_chunks = []

    while current_date <= end_date:
        df_day = fetch_single_day(symbol, current_date)
        if df_day is not None:
            daily_chunks.append(df_day)
            logging.info(f"✅ Data for {symbol} on {current_date.date()} | Rows: {len(df_day)}")
        else:
            logging.info(f"⏭️ No data for {symbol} on {current_date.date()}")
        current_date += timedelta(days=1)
        time.sleep(0.25)  # Respect API rate limits

    if daily_chunks:
        final_df = pd.concat(daily_chunks)
        output_path = os.path.join(output_dir, f"{symbol}_1min.csv")
        final_df.to_csv(output_path)
        logging.info(f"📁 Saved full 1min data for {symbol} at {output_path}")
    else:
        logging.warning(f"⚠️ No valid data for {symbol} across all dates.")