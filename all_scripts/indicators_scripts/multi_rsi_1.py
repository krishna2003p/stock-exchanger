from get_historical_data import get_breeze_data
from indicators_scripts.calculate_rsi import calculate_rsi
import pandas as pd
import os

def get_multi_rsi(breeze, stock_code, exchange_code):
    from datetime import datetime, timedelta

    to_date = datetime.strptime('2025-08-04 09:08:00', '%Y-%m-%d %H:%M:%S')
    from_date = to_date - timedelta(days=365*18)
    target_year = 2007
    to_date_str = to_date.strftime('%Y-%m-%d')
    from_date_str = from_date.strftime('%Y-%m-%d')

    # Fetch data
    df_daily = get_breeze_data(breeze, stock_code, exchange_code, "1minute", from_date_str, to_date_str)
    if not isinstance(df_daily.index, pd.DatetimeIndex):
        if 'datetime' in df_daily.columns:
            df_daily['datetime'] = pd.to_datetime(df_daily['datetime'])
            df_daily.set_index('datetime', inplace=True)
        else:
            df_daily.index = pd.to_datetime(df_daily.index)

    public_folder = os.path.join(os.path.dirname(__file__), 'public')
    stock_folder = os.path.join(public_folder, stock_code)
    os.makedirs(stock_folder, exist_ok=True)
    output_path = os.path.join(stock_folder, f"{stock_code}_output_{to_date_str}_{from_date_str}.xlsx")

    # Check if data contains target year, else save and recall
    while True:
        if df_daily.empty:
            print("No data fetched.")
            break
        last_record_date = df_daily.index[-1]
        if last_record_date.year <= target_year:
            break
        # Save current data
        df_daily.to_excel(output_path, index=True)
        print(f"Last record year {last_record_date.year} > {target_year}, fetching more data...")
        # Fetch more data till target year
        new_to_date = last_record_date - timedelta(days=1)
        new_to_date_str = new_to_date.strftime('%Y-%m-%d')
        df_new = get_breeze_data(breeze, stock_code, exchange_code, "1minute", from_date_str, new_to_date_str)
        if not isinstance(df_new.index, pd.DatetimeIndex):
            if 'datetime' in df_new.columns:
                df_new['datetime'] = pd.to_datetime(df_new['datetime'])
                df_new.set_index('datetime', inplace=True)
            else:
                df_new.index = pd.to_datetime(df_new.index)
        # Append new data and continue
        df_daily = pd.concat([df_new, df_daily]).sort_index()
        to_date_str = new_to_date_str
        output_path = os.path.join(stock_folder, f"{stock_code}_output_{to_date_str}_{from_date_str}.xlsx")

    # Save final data
    df_daily.to_excel(output_path, index=True)

    return

    # Calculate RSI if data is available
    if df_daily.empty:
        return None

    df_daily = calculate_rsi(df_daily, duration="day")

    # Weekly RSI
    df_weekly = df_daily.resample('W').agg({
        'open': 'first',
        'high': 'max',
        'low': 'min',
        'close': 'last',
        'volume': 'sum'
    }).dropna()
    df_weekly = calculate_rsi(df_weekly, duration="week")

    # Monthly RSI
    df_monthly = df_daily.resample('M').agg({
        'open': 'first',
        'high': 'max',
        'low': 'min',
        'close': 'last',
        'volume': 'sum'
    }).dropna()
    df_monthly = calculate_rsi(df_monthly, duration="month")

    result = {}
    for label, df in zip(
        ['RSI_Day', 'RSI_Week', 'RSI_Month'],
        [df_daily, df_weekly, df_monthly]
    ):
        rsi_col = 'RSI_14'
        if rsi_col in df.columns and not df[rsi_col].dropna().empty:
            result[label] = df[rsi_col].dropna().iloc[-1]
        else:
            result[label] = None

    pd.DataFrame([result]).to_excel("multi_rsi_output.xlsx", index=False)

    return result
