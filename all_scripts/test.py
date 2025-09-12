import os
import pandas as pd
from datetime import timedelta
from breeze_connection import multi_connect

# Paths
BASE_DIR = os.path.expanduser("~/Documents/Stock_Market/nifty_500")
DIR_1MIN = os.path.join(BASE_DIR, "1_minute_data")      # "latest" file, e.g. AMBEN.csv
DIR_REM = os.path.join(BASE_DIR, "1_minute_rem")        # breeze old files
OUTPUT_DIR = DIR_1MIN  # Save merged file here


# Breeze connection assumed to be initialized as breeze
breeze = multi_connect('SWADESHHUF')

def reformat_breeze_file(df):
    try:
        target_cols = [
            'datetime', 'stock_code', 'exchange_code', 'product_type', 'expiry_date',
            'right', 'strike_price', 'open', 'high', 'low', 'close', 'volume',
            'open_interest', 'count'
        ]

        if df is None or df.empty:
            print("Input DataFrame is None or empty in reformat_breeze_file, returning empty DataFrame")
            return pd.DataFrame(columns=target_cols)

        # Rename columns as before
        df = df.rename(columns={
            'close': 'close',
            'datetime': 'datetime',
            'exchange_code': 'exchange_code',
            'high': 'high',
            'low': 'low',
            'open': 'open',
            'stock_code': 'stock_code',
            'volume': 'volume'
        })

        for col in target_cols:
            if col not in df.columns:
                if col in ['open_interest', 'count', 'strike_price']:
                    df[col] = 0
                else:
                    df[col] = ''

        df = df[target_cols]
        df['datetime'] = pd.to_datetime(df['datetime'], dayfirst=True, errors='coerce')

        num_cols = ['open', 'high', 'low', 'close', 'volume', 'open_interest', 'count', 'strike_price']
        for col in num_cols:
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)

        return df

    except Exception as e:
        print(f"Error in reformat_breeze_file: {e}")
        # Always return empty DataFrame with proper columns on error
        return pd.DataFrame(columns=[
            'datetime', 'stock_code', 'exchange_code', 'product_type', 'expiry_date',
            'right', 'strike_price', 'open', 'high', 'low', 'close', 'volume',
            'open_interest', 'count'
        ])

def fetch_missing_data_from_breeze(stock_code, start_date, end_date, interval="1minute"):
    # Same as your current Breeze fetch wrapper
    # ... [Use your existing fetch_missing_data_from_breeze function]
    from_date_str = start_date.strftime("%Y-%m-%dT09:15:00.000Z")
    to_date_str = end_date.strftime("%Y-%m-%dT15:30:00.000Z")
    try:
        response = breeze.get_historical_data(
            interval=interval,
            from_date=from_date_str,
            to_date=to_date_str,
            stock_code=stock_code,
            exchange_code="NSE",
            product_type="cash"
        )
        data = response.get('Success', [])
        if not data:
            print(f"⚠️ No data returned from Breeze for {stock_code} [{from_date_str} to {to_date_str}]")
            return pd.DataFrame()
        df = pd.DataFrame(data)
        df['datetime'] = pd.to_datetime(df['datetime'], errors='coerce')
        return df
    except Exception as e:
        print(f"Error fetching from Breeze API for {stock_code}: {e}")
        return pd.DataFrame()
    

def is_continuous(last_dt, next_dt):
    """Check if next_dt is exactly 15 minutes after last_dt or next trading time"""
    # 15-minute trading interval check
    expected_next = last_dt + timedelta(minutes=15)

    # Because market timings and breaks can affect exact time, 
    # allow a 1-2 minute tolerance or customize according to your market hours
    if expected_next >= next_dt - timedelta(minutes=2) and expected_next <= next_dt + timedelta(minutes=2):
        return True
    return False

def safe_read_csv(filepath):
    if os.path.exists(filepath):
        try:
            df = pd.read_csv(filepath, parse_dates=['datetime'])
            return df
        except Exception as e:
            print(f"Error reading {filepath}: {e}")
            return pd.DataFrame()  # Return empty DataFrame on error
    else:
        print(f"{filepath} not found.")
        return pd.DataFrame()  # Return empty DataFrame if file missing



def merge_files_and_fill_gaps(stock):
    # Filepaths
    file_old1 = os.path.join(DIR_REM, f"{stock}_breeze_1min_2011_2020.csv")
    file_old2 = os.path.join(DIR_REM, f"{stock}_breeze_1min_2020_2021.csv")
    file_latest = os.path.join(DIR_1MIN, f"{stock}.csv")

    # Load files
    dfs = []
    df1 = safe_read_csv(file_old1)
    if not df1.empty:
        dfs.append(df1)
        print(f"Loaded {file_old1}")
    else:
        df1 = pd.DataFrame()
        print(f"{file_old1} not found")

    df2 = safe_read_csv(file_old2)
    if not df2.empty:
        df2 = reformat_breeze_file(df2)
        dfs.append(df2)
        print(f"Loaded {file_old2}")
    else:
        df2 = pd.DataFrame()
        print(f"{file_old2} not found")

    df_latest = safe_read_csv(file_latest)
    if not df_latest.empty:
        dfs.append(df_latest)
        print(f"Loaded {file_latest}")
    else:
        df_latest = pd.DataFrame()
        print(f"{file_latest} not found")

    # Check data gaps between df1 and df2
    if not df1.empty and not df2.empty:
        last_date_df1 = df1['datetime'].max()
        first_date_df2 = df2['datetime'].min()
        if not is_continuous(last_date_df1, first_date_df2):
            missing_start = last_date_df1 + timedelta(minutes=15)
            missing_end = first_date_df2 - timedelta(minutes=15)
            print(f"Gap detected between 2011-2020 and 2020-2021 data. Fetching missing data from {missing_start} to {missing_end}")
            missing_data = fetch_missing_data_from_breeze(stock, missing_start, missing_end)
            missing_data = reformat_breeze_file(missing_data)
            dfs.append(missing_data)

    # Check data gaps between df2 and latest
    if not df2.empty and not df_latest.empty:
        last_date_df2 = df2['datetime'].max()
        first_date_latest = df_latest['datetime'].min()
        if not is_continuous(last_date_df2, first_date_latest):
            missing_start = last_date_df2 + timedelta(minutes=15)
            missing_end = first_date_latest - timedelta(minutes=15)
            print(f"Gap detected between 2020-2021 and latest data. Fetching missing data from {missing_start} to {missing_end}")
            missing_data = fetch_missing_data_from_breeze(stock, missing_start, missing_end)
            missing_data = reformat_breeze_file(missing_data)
            dfs.append(missing_data)

    # Merge all dataframes
    if dfs:
        combined_df = pd.concat(dfs, ignore_index=True)
        combined_df['datetime'] = pd.to_datetime(combined_df['datetime'], errors='coerce')
        combined_df.dropna(subset=['datetime'], inplace=True)
        combined_df.sort_values('datetime', inplace=True)
        combined_df.drop_duplicates(subset=['datetime'], keep='last', inplace=True)

        # Save back to a merged file
        output_path = os.path.join(OUTPUT_DIR, f"{stock}.csv")
        combined_df.to_csv(output_path, index=False)
        print(f"✔️ Merged and saved file for {stock}: {output_path}")
    else:
        print(f"No data to merge for {stock}")

# Call the function
for stock in os.listdir(DIR_1MIN):
    stock = stock.removesuffix('.csv')
    merge_files_and_fill_gaps(stock)
