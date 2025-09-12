from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta, timezone
import calendar, threading, queue, os, sys
import pandas as pd
import time

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from breeze_connection import multi_connect

# ---------------- SETTINGS ----------------
YEARS_BACK = 3
INTERVAL = "1minute"
PRODUCT_TYPE = "options"
EXCHANGE_CODE = "NFO"
RIGHTS = ["call", "put"]
MAX_THREADS = 25

# Stocks ↔ Connections (1-to-1)
# STOCK_CODES = ["NIFTY", "CNXBAN", "NIFFIN", "NIFSEL", "NIFNEX"]
STOCK_CODES = [ "NIFSEL", "NIFNEX"]
credential_users = ['VACHI', 'SWADESH', 'RAMKISHAN', 'RAMKISHANHUF', 'SWADESHHUF']
# credential_users = ['SWADESH']
connections = [multi_connect(user) for user in credential_users]

connections = [multi_connect(user) for user in credential_users]
num_conns = len(connections)

# Thread-safe index and lock for the current connection in use
conn_index_lock = threading.Lock()
current_conn_index = 0

def get_next_connection():
    global current_conn_index
    with conn_index_lock:
        idx = current_conn_index
        current_conn_index = (current_conn_index + 1) % num_conns
    return idx,connections[idx]

# Save Location
home = os.path.expanduser("~")
public_folder = os.path.join(home, 'Documents', 'Stock_Market', 'options', '1_minute_data')
os.makedirs(public_folder, exist_ok=True)

# ---------------- QUEUE ----------------
file_save_queue = queue.Queue()

# ---------------- UTILS ----------------
def generate_weekly_expiries(years_back):
    """All Thursdays for past N years until today."""
    today = datetime.now(timezone.utc).date()
    start_date = today - timedelta(days=365 * years_back)
    # target_date = datetime(2025, 3, 27, tzinfo=timezone.utc).date()
    # today = target_date + timedelta(days=1)
    expiries = []
    current = start_date
    while current.weekday() != 3:  # move to nearest Thursday
        current += timedelta(days=1)

    while current <= today:
        expiries.append(datetime.combine(current, datetime.min.time()).replace(tzinfo=timezone.utc))
        current += timedelta(days=7)
    return expiries

def get_monthly_data(file_path):
    """Load daily OHLC data (with 'datetime' col parsed)."""
    df = pd.read_csv(file_path, parse_dates=['datetime'])
    df['datetime'] = pd.to_datetime(df['datetime'], utc=True)
    df = df.set_index('datetime')
    return df

def generate_strikes(underlying_close, step=50, width=1000):
    base = int((underlying_close // step) * step)  # nearest 50
    return list(range(base - width, base + width + step, step))

# ---------------- FETCH WORKER ----------------
def fetch_option_data(stock_code, expiry, right, strike, breeze_conn, max_retries = 5):
    attempts = 0
    exhausted_full_cycle = False
    used_connections = set()
    conn_index = 0
    while attempts < max_retries:
        idx, conn = get_next_connection()
        try:
            from_date = (expiry - timedelta(days=7)).strftime('%Y-%m-%dT09:15:00.000Z')
            to_date = expiry.strftime('%Y-%m-%dT15:30:00.000Z')

            data = conn.get_historical_data(
                interval=INTERVAL,
                from_date=from_date,
                to_date=to_date,
                stock_code=stock_code,
                exchange_code=EXCHANGE_CODE,
                product_type=PRODUCT_TYPE,
                expiry_date=expiry.strftime('%Y-%m-%dT00:00:00.000Z'),
                right=right,
                strike_price=str(strike)
            )

            if data['Status'] == 200 and data['Success']:
                df = pd.DataFrame(data['Success'])
                if not df.empty:
                    df['stock_code'] = stock_code
                    df['right'] = right
                    df['strike'] = strike
                    df['expiry'] = expiry.date()
                    file_save_queue.put((stock_code, df))
                return
            elif data['Status'] == 5:
                print(f"API limit reached on connection {data}")
                attempts += 1
                used_connections.add(idx)
                if len(used_connections) == num_conns:
                    # All connections exhausted
                    print("All connections reached API limit, sleeping for 40 seconds...")
                    time.sleep(40)
                    used_connections.clear()
                continue  # try next connection immediately
            else:
                print(f"No data or error for {stock_code} {right} {strike} {expiry}: {data}")
                return  # give up on this call
        except Exception as e:
            print(f"Error fetching {stock_code}-{right}-{strike}-{expiry}: {e}")

# ---------------- SAVE WORKER ----------------
def file_saver_worker():
    while True:
        item = file_save_queue.get()
        if item is None:
            break
        stock_code, df = item
        try:
            file_path = os.path.join(public_folder, f"{stock_code}.csv")
            if os.path.exists(file_path):
                df.to_csv(file_path, mode='a', header=False, index=False)
            else:
                df.to_csv(file_path, index=False)
            print(f"Appended {len(df)} rows → {file_path}")
        except Exception as e:
            print(f"Error saving {stock_code}: {e}")
        file_save_queue.task_done()

# ---------------- MAIN ----------------
def main():
    expiries = generate_weekly_expiries(YEARS_BACK)  # weekly expiry dates
    # print(f"Expiries:: {expiries}")
    # sys.exit()
    saver_thread = threading.Thread(target=file_saver_worker)
    saver_thread.start()

    with ThreadPoolExecutor(max_workers=MAX_THREADS) as executor:
        futures = []
        for i, stock_code in enumerate(STOCK_CODES):
            conn = connections[i % len(connections)]

            # load daily file
            daily_file = f"/Users/apple/Documents/Stock_Market/options/index_data/1_day_data/{stock_code}.csv"
            if not os.path.exists(daily_file):
                print(f"Missing data file {daily_file}")
                continue
            daily_df = get_monthly_data(daily_file)

            for expiry in expiries:
                # pick last available close before expiry
                try:
                    prev_close = daily_df[daily_df.index <= expiry]['close'].iloc[-1]
                except IndexError:
                    continue  # skip if no data before expiry

                strikes = generate_strikes(prev_close)
                for right in RIGHTS:
                    for strike in strikes:
                        futures.append(executor.submit(fetch_option_data, stock_code, expiry, right, strike, conn))

        # wait for all tasks
        for f in as_completed(futures):
            f.result()

    file_save_queue.put(None)
    saver_thread.join()
    print("Done.")

if __name__ == "__main__":
    main()
