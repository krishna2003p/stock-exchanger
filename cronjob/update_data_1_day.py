            #########################################################################################
            #                                                                                       #
            #           📊 Nifty 500 Historical 1-Minute Data Fetcher and Saver  📈                  #
            #           This script fetches 1-minute interval historical trading data               #
            #           for Nifty 500 stocks over the past 18 years from a Breeze API,              #
            #           using concurrent threads to speed up retrieval, and saves the               #
            #           data as CSV files locally.                                                  #
            #                                                                                       #
            #           Author: KRISHNA PRAJAPATI 😊                                                 #
            #           Date: 2025-08-07                                                            #
            #                                                                                       #
            ########################################################################################


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
import time
sys.path.append(os.path.join(os.path.dirname(__file__),'..','common_scripts'))
from enable_logging import print_log
# Queue to hold data for file saving 🗃️
file_save_queue = queue.Queue()


max_threads = 20     # You can tweak this; 10–30 is reasonable for most APIs ⚙️
tasks = []


# Current timestamp in ISO format 🕒
time_stamp = datetime.now(timezone.utc).isoformat()[:19] + '.000Z'
breeze = connect_breeze(API_KEY, API_SECRET, SESSION_TOKEN)


# Date time range for fetching data 📅
to_date = datetime.now()
from_date = to_date - timedelta(days=30)
# print(f"This is from_date:: {from_date}")
to_date_str = to_date.strftime('%Y-%m-%d')
from_date_str = from_date.strftime('%Y-%m-%d')


# Directory where files are saved 💾
home = os.path.expanduser("~")
public_folder = os.path.join(home, 'Documents', 'Stock_Market', 'nifty_500', '1_day_data')


# Fetch all stock codes by reading file... 📝
def get_all_stocks():
    url = os.path.join(home, "Documents", "Stock_Market", "common_csv", "nifty_500_stock_code.csv")
    df = pd.read_csv(url)
    df.columns = df.columns.str.strip()
    st_code = df['ShortName'].tolist()
    print_log(f"st_codes:: {st_code}")
    return st_code


stock_codes = ['GLEPHA']
# stock_codes = get_all_stocks()
# sys.exit()

# Fetch data from the API worker function 🌐
def fetch_data_worker(stock_code):
    try:
        print_log(f"Executing fetch_data_worker Stock:: {stock_code} 🚀")
        data = breeze.get_historical_data(
            interval="1day",
            from_date=from_date_str,
            to_date=to_date_str,
            stock_code=stock_code,
            exchange_code="NSE",
            product_type="cash"
        )


        print_log(f"Fetched for Stock:: {stock_code} ✅")
        if (data['Status'] == 200) and (data['Error'] is None) and data['Success']:
            df = pd.DataFrame(data['Success'])
            df['datetime'] = pd.to_datetime(df['datetime'])
            df.set_index('datetime', inplace=True)
            df['volume'] = pd.to_numeric(df['volume'], errors='coerce').fillna(0).astype(int)
            df = df.astype({'open': 'float','high': 'float','low': 'float','close': 'float'})
            file_save_queue.put((stock_code, df))  # Put data in queue for saving 📥
            # return stock_code, df
        else:
            print_log(f"{stock_code}: API error or no data. ❌")
            if (data['Status'] == 5) and (data['Error'] is not None):
                print_log(f"API Limit Reached: Response:: {data}")
                time.sleep(60)
                fetch_data_worker(stock_code)
            print_log(f"API Response:: {data}")
            return stock_code, None


    except Exception as e:
        print_log(f"Error Occurred in fetch_data_worker Error:: {e} ⚠️")


# Thread worker to save files from queue 🧵💾
def file_saver_worker():
    print_log(f"Executing file_saver_worker  🗃️")
    while True:
        item = file_save_queue.get()
        if item is None:  # Sentinel value to stop 🛑
            break
        stock_code, df = item
        try:
            file_path = os.path.join(public_folder, f"{stock_code}.csv")
            if os.path.isfile(file_path):
                df.to_csv(file_path, mode='a', header=False, index=True)
            else:
                df.to_csv(file_path, mode='w', header=True, index=True)
            print_log(f"Saved file {file_path} 📂")
        except Exception as e:
            print_log(f"Error saving file {stock_code}: {e} ❗")
        file_save_queue.task_done()


# Start the file save worker thread 🧵
print_log("Ready for run 👇")
saver_thread = threading.Thread(target=file_saver_worker)
saver_thread.start()
print_log("Start thread for getting data from the queue 🚦")
# Use ThreadPoolExecutor for fetching and submitting tasks 🏃‍♂️💨
with ThreadPoolExecutor(max_workers=max_threads) as executor:
    futures = [executor.submit(fetch_data_worker, code) for code in stock_codes]


# Wait for all fetches to finish ⏳
for future in as_completed(futures):
    pass  # or process any immediate result if needed


# Signal the saver thread to stop ✋
file_save_queue.put(None)
saver_thread.join()
print_log("All tasks completed! 🎉")
