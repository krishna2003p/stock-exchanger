from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta, timezone
import calendar, threading, queue, os, sys
import pandas as pd
import time

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from breeze_connection import multi_connect

# ---------------- SETTINGS ----------------
YEARS_BACK = 5
INTERVAL = "5minute"
PRODUCT_TYPE = "futures"
EXCHANGE_CODE = "NFO"
RIGHT = "others"
STRIKE_PRICE = "0"
MAX_THREADS = 25
# STOCK_CODES = ['POWFIN', 'RURELE', 'SBICAR', 'ICIPRU', 'CHON44', 'LICHF', 'ICILOM', 'MUTFIN', 'HDFAMC', 'CHOINV'] # example
STOCK_CODES = ['NIFMID','CNXBAN','NIFFIN','NIFNEX','NIFSEL','NIFTY']
# ---------------- CONNECTION ----------------
credential_users = ['VACHI', 'SWADESH', 'RAMKISHAN', 'RAMKISHANHUF','SWADESHHUF']
connections = [multi_connect(user) for user in credential_users]


# Save location
home = os.path.expanduser("~")
public_folder = os.path.join(home, 'Documents', 'Stock_Market', 'future', 'index_data','5_minute_data')
os.makedirs(public_folder, exist_ok=True)

# ---------------- QUEUE ----------------
file_save_queue = queue.Queue()

# ---------------- EXPIRY DATE GENERATOR ----------------
def get_last_thursday(year, month):
    """Get last Tuesday of the given month/year."""
    last_day = calendar.monthrange(year, month)[1]
    last_date = datetime(year, month, last_day, tzinfo=timezone.utc)
    # print(f"WeekDays:: {last_date.weekday()}")
    while last_date.weekday() != 3:  # Monday=0, Tuesday=1
        last_date -= timedelta(days=1)
    return last_date

def generate_monthly_ranges(years_back):
    """Generate month-by-month from_date, to_date, expiry_date for last N years."""
    today = datetime.now(timezone.utc)
    start_year = today.year
    start_month = today.month
    expiries = []
    for i in range(years_back * 12):
        year = start_year
        month = start_month - i
        while month <= 0:
            month += 12
            year -= 1
        expiry = get_last_thursday(year, month)
        if expiry <= today:
            expiries.append(expiry)

    expiries.sort()  # oldest to newest

    # Step 2: Build ranges
    ranges = []
    for idx in range(len(expiries)):
        this_expiry = expiries[idx]
        prev_expiry = expiries[idx - 1] if idx > 0 else None

        if prev_expiry:
            from_date = (prev_expiry + timedelta(days=1)).replace(hour=9, minute=15)
        else:
            # Use from start of data if no prev expiry
            from_date = this_expiry.replace(day=1, hour=9, minute=15)

        to_date = this_expiry.replace(hour=15, minute=30)

        # Only include valid periods
        if from_date < to_date:
            ranges.append({
                "from_date": from_date.strftime('%Y-%m-%dT%H:%M:%S.000Z'),
                "to_date": to_date.strftime('%Y-%m-%dT%H:%M:%S.000Z'),
                "expiry_date": this_expiry.strftime('%Y-%m-%dT%H:%M:%S.000Z')
            })

    return ranges

date_ranges = generate_monthly_ranges(YEARS_BACK)

# ---------------- FETCH TASK ----------------
def fetch_data_worker(stock_code, breeze_conn):
    try:
        for dr in date_ranges:
            print(f"Fetching {stock_code}  | {dr['from_date']} → {dr['to_date']} | Expiry: {dr['expiry_date']}")
            data = breeze_conn.get_historical_data(
                interval=INTERVAL,
                from_date=dr["from_date"],
                to_date=dr["to_date"],
                stock_code=stock_code,
                exchange_code=EXCHANGE_CODE,
                product_type=PRODUCT_TYPE,
                expiry_date=dr["expiry_date"],
                right=RIGHT,
                strike_price="0"
            )

            if data['Status'] == 200 and data['Error'] is None and data['Success']:
                df = pd.DataFrame(data['Success'])
                df['datetime'] = pd.to_datetime(df['datetime'])
                df.set_index('datetime', inplace=True)
                df['volume'] = pd.to_numeric(df['volume'], errors='coerce').fillna(0).astype(int)
                df = df.astype({'open': 'float', 'high': 'float', 'low': 'float', 'close': 'float'})
                file_save_queue.put((stock_code, df))
            else:
                print(f"No data for {stock_code}, API Response:: {data} in {dr['from_date']} → {dr['to_date']}")
                if (data['Status'] == 5) and (data['Error'] is not None):
                    print(f"API Limit Reached: Response:: {data}")
                    time.sleep(60)

    except Exception as e:
        print(f"Error fetching data for {stock_code}: {e}")

# ---------------- SAVE THREAD ----------------
def file_saver_worker():
    while True:
        item = file_save_queue.get()
        if item is None:
            break
        stock_code, df = item
        try:
            file_path = os.path.join(public_folder, f"{stock_code}.csv")
            # Append mode for continuous contracts
            if os.path.exists(file_path):
                df.to_csv(file_path, mode='a', header=False)
            else:
                df.to_csv(file_path)
            print(f"Saved {len(df)} rows for {stock_code} → {file_path}")
        except Exception as e:
            print(f"Error saving file for {stock_code}: {e}")
        file_save_queue.task_done()

# ---------------- RUN ----------------
print("Starting...")
saver_thread = threading.Thread(target=file_saver_worker)
saver_thread.start()


with ThreadPoolExecutor(max_workers=MAX_THREADS) as executor:
    futures = []
    for i, stock_code in enumerate(STOCK_CODES):
        # Pick connection based on stock index (round‑robin)
        conn = connections[i % len(connections)]
        futures.append(executor.submit(fetch_data_worker, stock_code, conn))

    # Wait for all
    for future in as_completed(futures):
        pass

file_save_queue.put(None)
saver_thread.join()
print("Done.")
