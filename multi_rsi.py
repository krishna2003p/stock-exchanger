from get_historical_data import get_breeze_data
from calculate_rsi import calculate_rsi
import pandas as pd

def get_multi_rsi(breeze, stock_code, exchange_code):
    from datetime import datetime, timedelta

    to_date = datetime.now()
    from_date = to_date - timedelta(days=365)

    to_date_str = to_date.strftime('%Y-%m-%d')
    from_date_str = from_date.strftime('%Y-%m-%d')

    # Daily RSI
    df_daily = get_breeze_data(breeze, stock_code, exchange_code, "1day", from_date_str, to_date_str)

    # df_daily['datetime'] = pd.to_datetime(df_daily['datetime'])
    # df_daily.set_index('datetime', inplace=True)

    df_daily = calculate_rsi(df_daily,duration="day")

    # Weekly RSI - resample from daily
    df_weekly = df_daily.resample('W').agg({
        'open': 'first',
        'high': 'max',
        'low': 'min',
        'close': 'last',
        'volume': 'sum'
    }).dropna()
    df_weekly = calculate_rsi(df_weekly,duration="week")

    # Monthly RSI - resample from daily
    df_monthly = df_daily.resample('M').agg({
        'open': 'first',
        'high': 'max',
        'low': 'min',
        'close': 'last',
        'volume': 'sum'
    }).dropna()
    df_monthly = calculate_rsi(df_monthly,duration="month")

    # result = {
    #     'RSI_Day': df_daily[f'RSI_14'].dropna().iloc[-1],
    #     'RSI_Week': df_weekly[f'RSI_14'].dropna().iloc[-1],
    #     'RSI_Month': df_monthly[f'RSI_14'].dropna().iloc[-1]
    # }

    # pd.DataFrame([result]).to_excel("multi_rsi_output.xlsx", index=False)

    result = {}
    for label, df in zip(
        ['RSI_Day', 'RSI_Week', 'RSI_Month'],
        [df_daily, df_weekly, df_monthly]
    ):
        rsi_col = 'RSI_14'
        if rsi_col in df.columns and not df[rsi_col].dropna().empty:
            result[label] = df[rsi_col].dropna().iloc[-1]
        else:
            result[label] = None  # or np.nan

    pd.DataFrame([result]).to_excel("multi_rsi_output.xlsx", index=False)

    return result
