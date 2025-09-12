from breeze_connect import BreezeConnect
import pandas as pd
import requests
import zipfile
import io
import os
import logging
from datetime import datetime
import login as l  # Contains: api_key, api_secret, session_key

import matplotlib.pyplot as plt
from sklearn.metrics import precision_score

# --- Setup Logging ---
logging.basicConfig(level=logging.DEBUG)

# --- Convert Expiry Date Format ---
def convert_expiry_to_iso(date_str):
    return datetime.strptime(date_str, "%d-%b-%Y").strftime("%Y-%m-%dT07:00:00.000Z")

# --- Initialize Breeze ---
def init_breeze():
    breeze = BreezeConnect(api_key=l.api_key)
    breeze.generate_session(api_secret=l.api_secret, session_token=l.session_key)
    logging.info("✅ Breeze session initialized.")
    return breeze

# --- Load and Extract Symbol Master (Don't Change) ---
def load_and_select_symbol_file(zip_url="https://directlink.icicidirect.com/NewSecurityMaster/SecurityMaster.zip",
                                 extract_to="sec_master") -> pd.DataFrame:
    try:
        print("\n🔽 Downloading symbol master file...")
        response = requests.get(zip_url, timeout=15)
        response.raise_for_status()

        print("📦 Extracting ZIP contents...")
        with zipfile.ZipFile(io.BytesIO(response.content)) as z:
            z.extractall(extract_to)
            extracted_files = z.namelist()
            print("✅ Extracted files:")
            for idx, name in enumerate(extracted_files):
                print(f"{idx + 1}. {name}")

        print("\nSelect only derivatives-related files (FOBSEScripMaster.txt / FONSEScripMaster.txt):")
        file_index = int(input("Enter the file number: ")) - 1
        selected_file = extracted_files[file_index]

        csv_path = os.path.join(extract_to, selected_file)
        print(f"\n📄 Loading file: {selected_file}")

        try:
            df = pd.read_csv(csv_path, sep="\t", engine="python")
        except:
            df = pd.read_csv(csv_path)

        df.columns = df.columns.str.replace('"', '').str.strip()
        df.to_csv("token_data.csv", index=False)
        print("\n🔍 Data Preview:")
        print(df.head())
        return df

    except Exception as e:
        print("❌ Error:", str(e))
        return None

# --- Search Derivatives and Return Symbol & Expiry ---
def search_derivatives(df):
    if df is None:
        print("⚠️ No data loaded.")
        return None, None

    df.columns = df.columns.str.strip()
    for col in ['ShortName', 'InstrumentName', 'OptionType']:
        if col in df.columns:
            df[col] = df[col].astype(str).str.strip().str.upper()

    symbol = input("📊 Enter derivative symbol (ShortName or ExchangeCode): ").strip().upper()
    instrument_type = input("📌 Enter instrument type (FUTIDX, OPTIDX, FUTSTK, OPTSTK): ").strip().upper()

    result = df[
        ((df['ShortName'] == symbol) | (df['ExchangeCode'] == symbol)) &
        (df['InstrumentName'] == instrument_type)
    ]

    if instrument_type.startswith("OPT"):
        opt_type = input("⬆️ Enter option type (CE/PE): ").strip().upper()
        result = result[result['OptionType'] == opt_type]

        available_strikes = sorted(result['StrikePrice'].dropna().unique())
        print("\n🎯 Available strike prices:")
        print(available_strikes)

        try:
            strike_min = float(input("🔽 Enter MIN strike: "))
            strike_max = float(input("🔼 Enter MAX strike: "))
            result = result[
                (result['StrikePrice'] >= strike_min) &
                (result['StrikePrice'] <= strike_max)
            ]
        except ValueError:
            print("❌ Invalid strike input.")
            return None, None

    if not result.empty:
        display_cols = ['Token', 'InstrumentName', 'StrikePrice', 'ExpiryDate', 'OptionType', 'CompanyName']
        display_cols = [col for col in display_cols if col in result.columns]
        print("\n✅ Matching contracts found:")
        print(result[display_cols])
        shortname = result['ShortName'].iloc[0]
        expiry = result['ExpiryDate'].iloc[0]
        return shortname, expiry

    else:
        print("❌ No matching contracts found.")
        return None, None

# --- Fetch Historical Data ---
def fetch_historical_data(breeze, symbol, expiry_iso):
    print(f"\n📈 Fetching OHLC for symbol: {symbol}")
    res = breeze.get_historical_data(
        interval="1day",
        from_date="2025-05-01T09:15:00.000Z",
        to_date="2025-06-11T15:30:00.000Z",
        stock_code=symbol,
        exchange_code="NSE",
        product_type="cash",
        expiry_date=expiry_iso,
        right="",
        strike_price=""
    )

    if res.get("Success"):
        df = pd.DataFrame(res["Success"])
        print(df.head())
        df.to_csv('futured.csv', index=False)
        print("✅ Saved to futured.csv")
    else:
        print("⚠️ No data returned. Error:", res.get("Error", "Unknown error"))

# --- Strategy Logic ---
def apply_strategy(df):
    df['Datetime'] = pd.to_datetime(df['datetime'])
    df.set_index('Datetime', inplace=True)
    df['Close'] = df['close'].astype(float)
    df['EMA5'] = df['Close'].ewm(span=5, adjust=False).mean()
    df['EMA20'] = df['Close'].ewm(span=20, adjust=False).mean()
    df['Signal'] = (df['EMA5'] > df['EMA20']).astype(int)
    df['Position'] = df['Signal'].diff()
    return df

# --- Backtesting Function ---
def backtest(df, initial_capital=100000, lot_size=1):
    trades = []
    in_position = False
    entry_price = 0
    capital = initial_capital

    for i in range(len(df)):
        row = df.iloc[i]

        # Entry
        if row['Position'] == 1 and not in_position:
            entry_price = row['Close']
            entry_time = row.name
            in_position = True

        # Exit
        elif row['Position'] == -1 and in_position:
            exit_price = row['Close']
            exit_time = row.name
            pnl = (exit_price - entry_price) * lot_size
            capital += pnl
            trades.append({
                "entry_time": entry_time,
                "exit_time": exit_time,
                "entry_price": entry_price,
                "exit_price": exit_price,
                "pnl": pnl
            })
            in_position = False

    # Summary
    trade_df = pd.DataFrame(trades)
    total_return = capital - initial_capital
    win_rate = (trade_df['pnl'] > 0).sum() / len(trade_df) if not trade_df.empty else 0

    print("\n💹 Strategy Backtest Summary")
    print(f"🔢 Total Trades: {len(trade_df)}")
    print(f"✅ Win Rate: {win_rate:.2%}")
    print(f"💰 Final Capital: ₹{capital:,.2f}")
    print(f"📈 Net Profit: ₹{total_return:,.2f}")
    return trade_df

# --- Plot Strategy ---
def plot_strategy(df):
    df = df.copy()
    df.reset_index(inplace=True)  # remove datetime index

    plt.figure(figsize=(14, 6))
    plt.plot(df['Close'], label='Close Price', alpha=0.5, color='yellow')
    plt.plot(df['EMA5'], label='EMA 5', linestyle='--', color='black')
    plt.plot(df['EMA20'], label='EMA 20', linestyle='--', color='blue')

    buy_signals = df[df['Position'] == 1]
    sell_signals = df[df['Position'] == -1]

    plt.scatter(buy_signals.index, buy_signals['Close'], marker='^', color='green', label='Buy Signal')
    plt.scatter(sell_signals.index, sell_signals['Close'], marker='v', color='red', label='Sell Signal')

    plt.title("📉 EMA Crossover Strategy")
    plt.xlabel("Time (Bars)")
    plt.ylabel("Price")
    plt.legend()
    plt.grid(True)
    plt.tight_layout()
    plt.show()

# --- Run Strategy Pipeline ---
def run_strategy_pipeline():
    try:
        df = pd.read_csv("futured.csv")
        df = apply_strategy(df)
        backtest(df)
        plot_strategy(df)
    except Exception as e:
        print("❌ Failed to run strategy:", str(e))

# --- Main Function ---
def main():
    breeze = init_breeze()
    print("\n💰 Funds Info:")
    print(breeze.get_funds())

    df = load_and_select_symbol_file()
    symbol, expiry = search_derivatives(df)

    if symbol and expiry:
        expiry_iso = convert_expiry_to_iso(expiry)
        fetch_historical_data(breeze, symbol, expiry_iso)
        run_strategy_pipeline()

if __name__ == "__main__":
    main()