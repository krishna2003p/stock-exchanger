from concurrent.futures import ThreadPoolExecutor, as_completed
from time import sleep
import requests
import json
import hashlib
from datetime import datetime, timezone
import pandas as pd
import os,sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from credentials import *
from breeze_connection import connect_breeze
from datetime import datetime, timedelta
import queue
import threading

# Queue
file_save_queue = queue.Queue()

max_threads = 20     # You can tweak this; 10–30 is reasonable for most APIs
tasks = []

time_stamp = datetime.now(timezone.utc).isoformat()[:19] + '.000Z'
breeze = connect_breeze(API_KEY, API_SECRET, SESSION_TOKEN)


# Date time set
# to_date = datetime.strptime('2021-08-03 09:08:00', '%Y-%m-%d %H:%M:%S')
today = datetime.now(timezone.utc)
to_date = today.replace(hour=9, minute=15, second=0, microsecond=0)
# 15 years before the to_date
from_date = to_date - timedelta(days=365*15)

# Format to ISO 8601 with milliseconds and Z suffix
to_date_str = to_date.strftime("%Y-%m-%dT%H:%M:%S.000Z")
from_date_str = from_date.strftime("%Y-%m-%dT%H:%M:%S.000Z")

# Directory where file saved
home = os.path.expanduser("~")
public_folder = os.path.join(home, 'Documents', 'Stock_Market','future')

# Fetch data from the api
def fetch_data_worker(stock_code):
    try:
        print(f"Executing fetch_data_worker Stock:: {stock_code} ")
        data = breeze.get_historical_data(
            interval="1minute",
            from_date=from_date_str,
            to_date=to_date_str,
            stock_code=stock_code,
            exchange_code="NSE",
            product_type="cash"
        )

        print(f"Fetched for Stock:: {stock_code} API Response:: {data}")
        # return
        if (data['Status'] == 200) and (data['Error'] is None) and data['Success']:
            df = pd.DataFrame(data['Success'])
            df['datetime'] = pd.to_datetime(df['datetime'])
            df.set_index('datetime', inplace=True)
            df['volume'] = pd.to_numeric(df['volume'], errors='coerce').fillna(0).astype(int)
            df = df.astype({'open': 'float','high': 'float','low': 'float','close': 'float'})
            file_save_queue.put((stock_code, df))
            # return stock_code, df
        else:
            print(f"{stock_code}: API error or no data.")
            return stock_code, None

    except Exception as e:
        print(f"Error Occcred in fetch_data_worker Error:: {e}")

# Get Data from queue
def file_saver_worker():
    print(f"Executing file_saver_worker  ")
    while True:
        # print("execu")
        item = file_save_queue.get()
        if item is None:  # Sentinel value to stop
            break
        stock_code, df = item
        try:
            file_path = os.path.join(public_folder, f"{stock_code}.csv")
            df.to_csv(file_path, index=True)
            print(f"Saved file {file_path}")
        except Exception as e:
            print(f"Error saving file {stock_code}: {e}")
        file_save_queue.task_done()

# Start the file save worker thread
print("Ready for run")
saver_thread = threading.Thread(target=file_saver_worker)
saver_thread.start()
print("Start thread for getting data from the queue")
# Use ThreadPoolExecutor for fetching and submitting tasks
with ThreadPoolExecutor(max_workers=max_threads) as executor:
    futures = [executor.submit(fetch_data_worker, code) for code in stock_codes]

# Wait for all fetches to finish
for future in as_completed(futures):
    pass  # or process any immediate result if needed

# Signal the saver thread to stop
file_save_queue.put(None)
saver_thread.join()
