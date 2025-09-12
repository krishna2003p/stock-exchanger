import ta

def calculate_rsi(df, window=14, duration=None):
    rsi = ta.momentum.RSIIndicator(close=df['close'], window=window)
    abc = rsi.rsi()
    print(f"Hey RSI:: {abc}")
    df[f'RSI_{window}'] = abc
    print(f"Hey this is calculated for duration:: {duration} RSI:: {df}")
    return df
