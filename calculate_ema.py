import pandas as pd
import ta

def calculate_rsi_ema(df, rsi_window=14, ema_window=20):
    """Calculate RSI and EMA on the given dataframe."""
    df = df.copy()
    rsi = ta.momentum.RSIIndicator(close=df['close'], window=rsi_window)
    df[f'RSI_{rsi_window}'] = rsi.rsi()

    ema = ta.trend.EMAIndicator(close=df['close'], window=ema_window)
    df[f'EMA_{ema_window}'] = ema.ema_indicator()

    return df

def calculate_multi_tf_indicators(df_daily, rsi_window=14, ema_window=20):
    """
    Calculate daily, weekly, and monthly RSI & EMA from daily OHLCV dataframe.
    """
    # Daily indicators
    df_daily_ind = calculate_rsi_ema(df_daily, rsi_window, ema_window)

    # Weekly resample
    df_weekly = df_daily.resample('W').agg({
        'open': 'first',
        'high': 'max',
        'low': 'min',
        'close': 'last',
        'volume': 'sum'
    }).dropna()
    df_weekly_ind = calculate_rsi_ema(df_weekly, rsi_window, ema_window)

    # Monthly resample
    df_monthly = df_daily.resample('M').agg({
        'open': 'first',
        'high': 'max',
        'low': 'min',
        'close': 'last',
        'volume': 'sum'
    }).dropna()
    df_monthly_ind = calculate_rsi_ema(df_monthly, rsi_window, ema_window)

    # Extract latest values
    indicators = {
        'RSI_Day': round(df_daily_ind[f'RSI_{rsi_window}'].dropna().iloc[-1], 2),
        'EMA_Day': round(df_daily_ind[f'EMA_{ema_window}'].dropna().iloc[-1], 2),
        'RSI_Week': round(df_weekly_ind[f'RSI_{rsi_window}'].dropna().iloc[-1], 2),
        'EMA_Week': round(df_weekly_ind[f'EMA_{ema_window}'].dropna().iloc[-1], 2),
        'RSI_Month': round(df_monthly_ind[f'RSI_{rsi_window}'].dropna().iloc[-1], 2),
        'EMA_Month': round(df_monthly_ind[f'EMA_{ema_window}'].dropna().iloc[-1], 2),
    }

    return indicators
