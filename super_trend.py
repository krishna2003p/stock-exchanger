import pandas as pd
import numpy as np
import ta

def calculate_supertrend(df, atr_period=10, multiplier=3.0):
    """
    Calculate Supertrend indicator.
    Returns a DataFrame with 'Supertrend' and 'Supertrend_Direction' columns.
    """
    df = df.copy()

    # Calculate ATR using ta-lib wrapper
    atr = ta.volatility.AverageTrueRange(
        high=df['high'], low=df['low'], close=df['close'], window=atr_period
    ).average_true_range()

    hl2 = (df['high'] + df['low']) / 2
    upperband = hl2 + multiplier * atr
    lowerband = hl2 - multiplier * atr

    # Initialize Supertrend columns
    supertrend = [np.nan] * len(df)
    direction = [True] * len(df)  # True: uptrend, False: downtrend
 
    for i in range(atr_period, len(df)):
        if df['close'].iloc[i] > upperband.iloc[i - 1]:
            direction[i] = True
        elif df['close'].iloc[i] < lowerband.iloc[i - 1]:
            direction[i] = False
        else:
            direction[i] = direction[i - 1]
            if direction[i] and lowerband.iloc[i] < lowerband.iloc[i - 1]:
                lowerband.iloc[i] = lowerband.iloc[i - 1]
            if not direction[i] and upperband.iloc[i] > upperband.iloc[i - 1]:
                upperband.iloc[i] = upperband.iloc[i - 1]

        supertrend[i] = lowerband.iloc[i] if direction[i] else upperband.iloc[i]

    df['Supertrend'] = supertrend
    df['Supertrend_Direction'] = direction  # True = uptrend, False = downtrend

    return df


# Apply Multi time frame
def calculate_multi_tf_supertrend(df_daily, atr_period=10, multiplier=3.0):
    # Daily
    df_daily_st = calculate_supertrend(df_daily, atr_period, multiplier)

    # Weekly
    df_weekly = df_daily.resample('W').agg({
        'open': 'first',
        'high': 'max',
        'low': 'min',
        'close': 'last',
        'volume': 'sum'
    }).dropna()
    df_weekly_st = calculate_supertrend(df_weekly, atr_period, multiplier)

    # Monthly
    df_monthly = df_daily.resample('M').agg({
        'open': 'first',
        'high': 'max',
        'low': 'min',
        'close': 'last',
        'volume': 'sum'
    }).dropna()
    df_monthly_st = calculate_supertrend(df_monthly, atr_period, multiplier)

    result = {
        'Supertrend_Day': df_daily_st['Supertrend'].dropna().iloc[-1],
        'Trend_Day': 'Up' if df_daily_st['Supertrend_Direction'].dropna().iloc[-1] else 'Down',
        'Supertrend_Week': df_weekly_st['Supertrend'].dropna().iloc[-1],
        'Trend_Week': 'Up' if df_weekly_st['Supertrend_Direction'].dropna().iloc[-1] else 'Down',
        'Supertrend_Month': df_monthly_st['Supertrend'].dropna().iloc[-1],
        'Trend_Month': 'Up' if df_monthly_st['Supertrend_Direction'].dropna().iloc[-1] else 'Down',
    }

    return result
