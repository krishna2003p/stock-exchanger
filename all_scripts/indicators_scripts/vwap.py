import pandas as pd
import os, sys
import traceback

BASE_PATH = os.path.join(os.path.expanduser("~"), "Documents", "Stock_Market")

def read_csv_file(file_path):
    try:
        df = pd.read_csv(file_path)
        return df
    except Exception as e:
        print(f"Error in read_csv_file:: Error:: {e}")
        traceback.print_exc()
        return None

def calculate_vwap(data):
    try:
        print("Start calculating VWAP")
        # Ensure numeric columns
        cols_to_numeric = ['high', 'low', 'close', 'volume']
        for col in cols_to_numeric:
            data[col] = pd.to_numeric(data[col], errors='coerce')

        # Typical Price
        data['typical_price'] = (data['high'] + data['low'] + data['close']) / 3
        # VWAP calculation (cumulative)
        data['tp_x_vol'] = data['typical_price'] * data['volume']
        data['cum_tp_x_vol'] = data['tp_x_vol'].cumsum()
        data['cum_volume'] = data['volume'].cumsum()
        data['vwap'] = data['cum_tp_x_vol'] / data['cum_volume']

        # Optionally, drop intermediate calculation columns  
        data = data.drop(columns=['typical_price', 'tp_x_vol', 'cum_tp_x_vol', 'cum_volume'])

        return data
    except Exception as e:
        print(f"Error in calculate_vwap:: Error:: {e}")
        traceback.print_exc()
        return None

def main():
    url = os.path.join(BASE_PATH, "future", "index_data", "1_day_data", "NIFFIN.csv")
    df = read_csv_file(url)
    if df is not None:
        df_with_vwap = calculate_vwap(df)
        print(df_with_vwap.head())
        # Save OVERWRITING the same file:
        df_with_vwap.to_csv(url, index=False)
        print(f"VWAP column added and saved to: {url}")

if __name__ == "__main__":
    main()


