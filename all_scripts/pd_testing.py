import os
import time
import logging
import pandas as pd
from datetime import datetime, timedelta
from breeze_connect import BreezeConnect
from concurrent.futures import ThreadPoolExecutor, as_completed
from queue import Queue, Empty
import threading
import sys
from breeze_connection import multi_connect
# ========== ⚙️ CONFIG ==========
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)s | [%(threadName)s] | %(message)s',
    datefmt='%H:%M:%S' 
)

OUTPUT_DIR = os.path.join(os.path.expanduser("~"),"Documents","Stock_Market","nifty_500","1_minute_rem")
CHECKPOINT_DIR = "checkpoint"
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(CHECKPOINT_DIR, exist_ok=True)

MAX_FETCH_RETRIES = 3
MAX_WRITE_RETRIES = 3
RETRY_WAIT = 2
THREAD_FETCHERS = 20
THREAD_SAVERS = 5
THREAD_CHECKPOINTERS = 5
THREAD_RETRY = 5
API_SLEEP = 1
DRY_RUN = False  # 🔍 Set to True to test skipping logic only

exchange = "NSE"
interval = "1minute"
product_type = "cash"
start_date = datetime(2011, 1, 1)
end_date = datetime(2021, 8, 3)

breeze = multi_connect('RAMKISHANHUF')
logging.info("✅ Breeze session established")

symbols = [ 'VEDFAS', 'MAGFI', 'LLOMET', 'TBOTEK', 'SAGINI', 'NETTEC', 'IIFHOL', 'SAPFOO', 'INTGEM', 'COMENG', 'SBFFIN', 'GLELIF', 'PREENR', 'TATTEC', 'ACMSOL', 'VISMEG', 'LATVIE', 'BRASOL', 'AFCINF', 'PHICAR', 'SWILIM', 'PTCIN', 'HONCON', 'JSWINF', 'CONBIO', 'BIKFOO', 'AADHOS', 'DEVIN', 'KFITEC', 'GLOHEA', 'DATPAT', 'NAVBHA', 'ADIAMC', 'IIFL26', 'AKUDRU', 'INVKNO', 'ONE97', 'NUVWEA', 'EMCPHA', 'ANARAT', 'SIGI', 'CAMACT', 'IIFL27', 'WAAENE', 'PIRPHA', 'KAYTEC', 'NTPGRE', 'NMDSTE', 'INDLTD', 'FIVSTA', 'HYUMOT', 'RAYLIF', 'FSNECO', 'DOMIND', 'MAHN16', 'STAHEA', 'GODIGI', 'BHAHEX', 'RAICHI', 'APTVAL', 'PBFINT', 'DELLIM', 'INDREN', 'BAJHOU', 'SAILIF', 'RRKAB', 'ADAWIL', 'CEINFO', 'WABIND', 'INOIND', 'SYRTEC', 'OLAELE', 'MAPHA', 'ADIWA1', 'ANGBRO', 'JYOCNC', 'JIOFIN', 'NIVBUP']
# symbols = ['MININD']
data_queue = Queue()
checkpoint_queue = Queue()
retry_queue = Queue()
stop_event = threading.Event()

# ========== 📊 Progress Tracking ==========
progress_lock = threading.Lock()
symbol_progress = {}
symbol_total_days = {}

def count_trading_days(start, end):
    return sum(1 for i in range((end - start).days + 1)
               if (start + timedelta(days=i)).weekday() < 5)

for symbol in symbols:
    symbol_total_days[symbol] = count_trading_days(start_date, end_date)
    symbol_progress[symbol] = 0

def update_progress(symbol):
    with progress_lock:
        symbol_progress[symbol] += 1
        total = symbol_total_days[symbol]
        current = symbol_progress[symbol]
        percent = (current / total) * 100
        logging.info(f"📊 Progress: {symbol} — {current}/{total} days ({percent:.2f}%)")

# ========== Checkpoint ==========
def get_checkpoint(symbol):
    path = os.path.join(CHECKPOINT_DIR, f"{symbol}_checkpoint.txt")
    if os.path.exists(path):
        with open(path, "r") as f:
            return datetime.strptime(f.read().strip(), "%Y-%m-%d")
    return start_date

def save_checkpoint(symbol, date):
    path = os.path.join(CHECKPOINT_DIR, f"{symbol}_checkpoint.txt")
    with open(path, "w") as f:
        f.write(date.strftime("%Y-%m-%d"))

# ========== Validation ==========
def is_valid_existing_file(filepath):
    try:
        if not os.path.exists(filepath):
            return False, "File does not exist"
        df = pd.read_csv(filepath)
        if df.empty:
            return False, "Empty file"
        if 'datetime' not in df.columns:
            return False, "Missing 'datetime' column"
        return True, "Valid file"
    except Exception as e:
        return False, f"Exception reading file: {e}"

# ========== Fetch ==========
def fetch_worker(symbol):
    output_file = os.path.join(OUTPUT_DIR, f"{symbol}.csv")

    valid, reason = is_valid_existing_file(output_file)
    if valid:
        logging.info(f"⏭️ Skipping {symbol} — {reason}")
        return
    elif os.path.exists(output_file):
        logging.warning(f"⚠️ Skipping {symbol} — Invalid file: {reason}")
        return

    if DRY_RUN:
        logging.info(f"🧪 DRY RUN: Would fetch {symbol}")
        return

    logging.info(f"🧵 Fetch worker started for symbol: {symbol}")
    date_cursor = get_checkpoint(symbol)

    while date_cursor <= end_date:
        if date_cursor.weekday() >= 5:
            date_cursor += timedelta(days=1)
            continue

        from_str = date_cursor.strftime("%Y-%m-%dT09:15:00.000Z")
        to_str = date_cursor.strftime("%Y-%m-%dT15:35:00.000Z")

        for attempt in range(MAX_FETCH_RETRIES):
            try:
                response = breeze.get_historical_data_v2(
                    interval=interval,
                    from_date=from_str,
                    to_date=to_str,
                    stock_code=symbol,
                    exchange_code=exchange,
                    product_type=product_type
                )

                if "message" in response and "limit exceeded" in response["message"].lower():
                    logging.error("🛑 API Limit Reached. Terminating process.")
                    stop_event.set()
                    return

                if "Success" in response and response["Success"]:
                    df = pd.DataFrame(response["Success"])
                    if not df.empty:
                        df["datetime"] = pd.to_datetime(df["datetime"])
                        df.sort_values("datetime", inplace=True)
                        data_queue.put((symbol, date_cursor, df))
                        logging.info(f"📦 Data fetched: {symbol} on {date_cursor.date()}")
                    checkpoint_queue.put((symbol, date_cursor))
                    update_progress(symbol)
                else:
                    logging.info(f"⚠️ Empty: {symbol} on {date_cursor.date()}")
                    checkpoint_queue.put((symbol, date_cursor))
                    update_progress(symbol)
                break

            except Exception as e:
                logging.warning(f"Retry {attempt+1}/{MAX_FETCH_RETRIES} ❌ {symbol} on {date_cursor.date()}: {e}")
                time.sleep(RETRY_WAIT)
        else:
            logging.error(f"🚨 Max retries reached for {symbol} on {date_cursor.date()}, adding to retry queue.")
            retry_queue.put(symbol)
            return

        date_cursor += timedelta(days=1)
        time.sleep(API_SLEEP)

# ========== Save ==========
def save_worker():
    logging.info(f"👷‍♂️ Save worker started on thread: {threading.current_thread().name}")
    while not stop_event.is_set() or not data_queue.empty():
        try:
            symbol, date_cursor, df = data_queue.get(timeout=2)
            output_file = os.path.join(OUTPUT_DIR, f"{symbol}.csv")
            write_header = not os.path.exists(output_file)

            for attempt in range(MAX_WRITE_RETRIES):
                try:
                    df.to_csv(output_file, mode='a', index=False, header=write_header)
                    logging.info(f"✅ File Saved: {symbol} on {date_cursor.date()}")
                    break
                except PermissionError:
                    time.sleep(RETRY_WAIT)
                except Exception as e:
                    logging.error(f"❌ Save failed: {symbol} on {date_cursor.date()} — {e}")
                    break
            else:
                logging.error(f"🛑 Skipped save after retries: {symbol} on {date_cursor.date()}")
        except Empty:
            continue

# ========== Checkpoint ==========
def checkpoint_worker():
    logging.info(f"📝 Checkpoint worker started on thread: {threading.current_thread().name}")
    while not stop_event.is_set() or not checkpoint_queue.empty():
        try:
            symbol, date = checkpoint_queue.get(timeout=2)
            save_checkpoint(symbol, date)
            logging.info(f"🧾 Checkpoint saved: {symbol} at {date.date()}")
        except Empty:
            continue

# ========== Retry ==========
def retry_worker():
    logging.info(f"🔁 Retry worker started on thread: {threading.current_thread().name}")
    seen = set()
    while not stop_event.is_set() or not retry_queue.empty():
        try:
            symbol = retry_queue.get(timeout=2)
            if symbol in seen:
                continue
            seen.add(symbol)
            logging.info(f"🔁 Retrying symbol from checkpoint: {symbol}")
            fetch_worker(symbol)
        except Empty:
            continue

# # ========== Main ==========
def main():
    print(f"🧵 Starting: {THREAD_FETCHERS} fetchers, {THREAD_SAVERS} savers, {THREAD_CHECKPOINTERS} checkpoint writers, {THREAD_RETRY} retry handlers")

    with ThreadPoolExecutor(max_workers=THREAD_FETCHERS) as executor:
        print("EXEcuting")
        fetch_futures = [executor.submit(fetch_worker, symbol) for symbol in symbols]

        for i in range(THREAD_SAVERS):
            threading.Thread(target=save_worker, name=f"SaveThread-{i+1}").start()

        for i in range(THREAD_CHECKPOINTERS):
            threading.Thread(target=checkpoint_worker, name=f"CheckpointThread-{i+1}").start()

        for i in range(THREAD_RETRY):
            threading.Thread(target=retry_worker, name=f"RetryThread-{i+1}").start()

        for future in as_completed(fetch_futures):
            if stop_event.is_set():
                break

        stop_event.set()
        logging.info("✅ All fetchers done. Waiting for other threads to finish...")

    logging.info("🎉 All tasks complete.")

if __name__ == "__main__":
    main()

print(f"Running :: {__name__}")