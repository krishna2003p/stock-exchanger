import pandas as pd
import os
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
import queue
import time
import traceback
import ta

# ---------------- CONFIG ----------------
home = os.path.expanduser("~")
data_folder = os.path.join(home, "Documents", "Stock_Market", "nifty_500", "1_minute_data")
max_threads = 8
cols_to_drop = ['product_type', 'expiry_date', 'right', 'strike_price', 'open_interest']

# Queue for processed files waiting to be saved
file_save_queue = queue.Queue()

# --- Period Label Helpers ---
def get_period_label(series, freq):
    return series.dt.to_period(freq).apply(lambda r: r.start_time.date())

# ------------- FILE SAVER ---------------
def file_saver_worker():
    print("[Saver] 🗃️ File saver thread started.")
    while True:
        item = file_save_queue.get()
        if item is None:  # Sentinel to stop
            break
        stock_path, df = item
        try:
            df.to_csv(stock_path, index=False)
            print(f"[Saver] ✅ Saved file: {os.path.basename(stock_path)}")
        except Exception as e:
            print(f"[Saver] ❌ Error saving {stock_path}: {e}")
            traceback.print_exc()
        finally:
            file_save_queue.task_done()
    print("[Saver] 🛑 File saver thread stopped.")

# -------------- PROCESS EACH FILE --------------
def process_stock_file(stock_file):
    stock_path = os.path.join(data_folder, stock_file)
    try:
        print(f"[{threading.current_thread().name}] Processing {stock_file}...")
        df = pd.read_csv(stock_path)

        # Remove unwanted columns
        df = df.drop(columns=[c for c in cols_to_drop if c in df.columns], errors='ignore')
        df['datetime'] = pd.to_datetime(df['datetime'])
        df = df[df['datetime'].notnull()]  # Remove rows with missing datetime

        # ---- DAILY ----
        daily_df = df.set_index('datetime').resample('D').agg({'close':'last'}).dropna().reset_index()
        daily_df['RSI_D'] = ta.momentum.RSIIndicator(daily_df['close'], window=14).rsi()
        for w in [50, 100, 200]:
            daily_df[f'EMA_D_{w}'] = ta.trend.EMAIndicator(daily_df['close'], window=w).ema_indicator()
        daily_df['date_only'] = daily_df['datetime'].dt.date

        # ---- WEEKLY ----
        weekly_df = df.set_index('datetime').resample('W').agg({'close':'last'}).dropna().reset_index()
        weekly_df['RSI_W'] = ta.momentum.RSIIndicator(weekly_df['close'], window=14).rsi()
        for w in [50, 100, 200]:
            weekly_df[f'EMA_W_{w}'] = ta.trend.EMAIndicator(weekly_df['close'], window=w).ema_indicator()
        weekly_df['week_only'] = get_period_label(weekly_df['datetime'], "W")

        # ---- MONTHLY ----
        monthly_df = df.set_index('datetime').resample('ME').agg({'close':'last'}).dropna().reset_index()
        monthly_df['RSI_M'] = ta.momentum.RSIIndicator(monthly_df['close'], window=14).rsi()
        for w in [50, 100, 200]:
            monthly_df[f'EMA_M_{w}'] = ta.trend.EMAIndicator(monthly_df['close'], window=w).ema_indicator()
        monthly_df['month_only'] = get_period_label(monthly_df['datetime'], "M")

        # ---- Merge labels into main DataFrame ----
        df['date_only'] = df['datetime'].dt.date
        df['week_only'] = get_period_label(df['datetime'], "W")
        df['month_only'] = get_period_label(df['datetime'], "M")

        old_cols = [c for c in df.columns if c.startswith('RSI_') or c.startswith('EMA_')]
        df.drop(columns=old_cols, inplace=True, errors='ignore')
        # ---- Merge calculated indicators ----
        df = df.merge(daily_df.drop(columns=['close','datetime']).reset_index(drop=True), on='date_only', how='left')
        df = df.merge(weekly_df.drop(columns=['close','datetime']).reset_index(drop=True), on='week_only', how='left')
        df = df.merge(monthly_df.drop(columns=['close','datetime']).reset_index(drop=True), on='month_only', how='left')

        # Drop temporary label columns
        df = df.drop(columns=['date_only','week_only','month_only'])

        # Enqueue for saving
        file_save_queue.put((stock_path, df))
        print(f"[{threading.current_thread().name}] ➕ Queued {stock_file} for saving.")

    except Exception as e:
        print(f"[{threading.current_thread().name}] ❌ Error processing {stock_file}: {e}")
        traceback.print_exc()

# --------- MAIN EXECUTION -------------
if __name__ == "__main__":
    start_time = time.time()
    files = [f for f in os.listdir(data_folder) if f.lower().endswith('.csv')]
    files = ['3MIND.csv']
    print(f"📂 Found {len(files)} CSV files to process.")

    saver_thread = threading.Thread(target=file_saver_worker, daemon=True)
    saver_thread.start()

    with ThreadPoolExecutor(max_workers=max_threads) as executor:
        futures = [executor.submit(process_stock_file, file) for file in files]
        for _ in as_completed(futures):
            pass

    file_save_queue.join()
    file_save_queue.put(None)  # Stop signal for saver thread
    saver_thread.join()
    print(f"🏁 All done in {time.time() - start_time:.2f} seconds.")
