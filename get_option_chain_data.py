from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta, timezone
import calendar, threading, queue, os, sys
import pandas as pd
import time

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from credentials import *
from breeze_connection import connect_breeze


# ---------------- SETTINGS ----------------
YEARS_BACK = 3             # Number of years to go back
INTERVAL = "1minute"
PRODUCT_TYPE = "options"
EXCHANGE_CODE = "NFO"
RIGHTS = ["call", "put"]   # option rights
MAX_THREADS = 20
counter = 0

# Provide your dynamic list of stock codes (underlying assets)
stock_codes = ["NIFTY", "BANKNIFTY"]  # Example, adjust to your list

# Example strike price list (use your own or generate dynamically)
strike_prices = [
    "7000","8000","9000","10000","11000","12000","13000","14000","15000","16000","16500","17000",
    "18000","19000","19100","19150","19200","19250","19300","19350","19400","19450","19500","19550",
    "19600","19650","19700","19750","19800","19850","19900","19950","20000","20050","20100","20150",
    "20200","20250","20300","20350","20400","20450","20500","20550","20600","20650","20700","20750",
    "20800","20850","20900","20950","21000","21050","21100","21150","21200","21250","21300","21350",
    "21400","21450","21500","21550","21600","21650","21700","21750","21800","21850","21900","21950",
    "22000","22050","22100","22150","22200","22250","22300","22350","22400","22450","22500","22550",
    "22600","22650","22700","22750","22800","22850","22900","22950","23000","23050","23100","23150",
    "23200","23250","23300","23350","23400","23450","23500","23550","23600","23650","23700","23750",
    "23800","23850","23900","23950","24000","24050","24100","24150","24200","24250","24300","24350",
    "24400","24450","24500","24550","24600","24650","24700","24750","24800","24850","24900","24950",
    "25000","25050","25100","25150","25200","25250","25300","25350","25400","25450","25500","25550",
    "25600","25650","25700","25750","25800","25850","25900","25950","26000","26050","26100","26150",
    "26200","26250","26300","26350","26400","26450","26500","26550","26600","26650","26700","26750",
    "26800","26850","26900","26950","27000","27050","27100","27150","27200","27250","27300","27350",
    "27400","27450","27500","27550","27600","27650","27700","27750","27800","27850","27900","27950",
    "28000","28050","28100","28150","28200","28250","28300","28350","28400","28450","28500","28550",
    "28600","28650","28700","28750","28800","28850","28900","28950","29000","29050","29100","29150",
    "29200","29250","29300","29350","29400","29450","29500","29550","29600","29650","29700","29750",
    "29800","29850","29900","29950","30000","30050","30100","30150","30200","30250","30300","30350",
    "30400","30450","30500","30550","30600","30650","30700","30750","30800","30850","30900","31000",
    "32000","33000","34000","35000","36000","37000","38000","39000","40000","41000"
]
print

# ---------------- CONNECTION ----------------
breeze = connect_breeze(API_KEY, API_SECRET, SESSION_TOKEN)

# Save location
home = os.path.expanduser("~")
public_folder = os.path.join(home, 'Documents', 'Stock_Market', 'options', '1_minute_data')
os.makedirs(public_folder, exist_ok=True)

# ---------------- QUEUE ----------------
file_save_queue = queue.Queue()


# ---------------- HELPER FUNCTIONS ----------------
def get_last_thursday(year, month):
    """Find the last Thursday of a given month."""
    last_day = calendar.monthrange(year, month)[1]
    date = datetime(year, month, last_day, tzinfo=timezone.utc)
    while date.weekday() != 3:  # Thursday=3
        date -= timedelta(days=1)
    return date


def generate_weekly_expiries(years_back):
    """Generate all Thursdays (weekly expiries) for past N years."""
    today = datetime.now(timezone.utc).date()
    start_date = today - timedelta(days=365*years_back)

    expiries = []
    current = start_date

    # Move current to next Thursday if not Thursday
    while current.weekday() != 3:
        current += timedelta(days=1)

    while current <= today:
        expiries.append(datetime.combine(current, datetime.min.time()).replace(tzinfo=timezone.utc))
        current += timedelta(days=7)  # Next Thursday

    return expiries


def save_data_worker():
    while True:
        item = file_save_queue.get()
        if item is None:
            break
        filepath, df = item
        try:
            if os.path.exists(filepath):
                df.to_csv(filepath, mode='a', header=False)
            else:
                df.to_csv(filepath)
            print(f"Saved {len(df)} rows → {filepath}")
        except Exception as e:
            print(f"Error saving file {filepath}: {e}")
        file_save_queue.task_done()


# ---------------- FETCH WORKER ----------------
def fetch_option_data(stock_code, expiry, right, strike_price):
    global counter
    try:
        counter += 1
        # from_date = (expiry - timedelta(days=7)).replace(hour=9, minute=15).strftime('%Y-%m-%dT%H:%M:%S.000Z')
        # to_date = expiry.replace(hour=15, minute=30).strftime('%Y-%m-%dT%H:%M:%S.000Z')
        # expiry_date_str = expiry.strftime('%Y-%m-%dT%H:%M:%S.000Z')
        expiry_date_str = expiry

        print(f"Fetching {stock_code} | {right} | Strike {strike_price} | Counter {counter}")

        # data = breeze.get_historical_data(
        #     interval=INTERVAL,
        #     from_date=from_date,
        #     to_date=to_date,
        #     stock_code=stock_code,
        #     exchange_code=EXCHANGE_CODE,
        #     product_type=PRODUCT_TYPE,
        #     expiry_date=expiry_date_str,
        #     right=right,
        #     strike_price=str(strike_price)
        # )

        data = breeze.get_historical_data(interval="1minute",
                  from_date= "2022-01-03T09:20:00.000Z",
                  to_date= "2022-01-06T09:22:00.000Z",
                  stock_code=stock_code,
                  exchange_code="NFO",
                  product_type="options",
                  expiry_date=expiry,
                  right=right,
                  strike_price=strike_price
                  )
        
        print(f"Stock {stock_code}, API Response:: {data}")
        if counter == 100:
            print(f"API Limit Reached: Response:: {data}")
            time.sleep(60)

        return
        if data['Status'] == 200 and data['Error'] is None and data['Success']:
            df = pd.DataFrame(data['Success'])
            if not df.empty:
                df['datetime'] = pd.to_datetime(df['datetime'])
                df.set_index('datetime', inplace=True)
                df['volume'] = pd.to_numeric(df['volume'], errors='coerce').fillna(0).astype(int)
                df = df.astype({'open': 'float', 'high': 'float', 'low': 'float', 'close': 'float'})

                filename = f"{stock_code}_{strike_price}_{right}_{expiry.date()}.csv"
                filepath = os.path.join(public_folder, filename)
                file_save_queue.put((filepath, df))
            else:
                print(f"No data in dataframe for {stock_code} {strike_price} {right} {expiry_date_str}")
        else:
            print(f"No data from API for {stock_code} {strike_price} {right} {expiry_date_str}: {data}")
            # if (data['Status'] == 5) and (data['Error'] is not None):
            #         print(f"API Limit Reached: Response:: {data}")
            #         time.sleep(60)
        if counter == 100:
            print(f"API Limit Reached: Response:: {data}")
            time.sleep(60)

    except Exception as e:
        print(f"Error fetching data for {stock_code} {strike_price} {right} {expiry}: {e}")


# ---------------- MAIN SCRIPT ----------------
def main():
    # expiries = generate_weekly_expiries(YEARS_BACK)

    # saver_thread = threading.Thread(target=save_data_worker)
    # saver_thread.start()

    # with ThreadPoolExecutor(max_workers=MAX_THREADS) as executor:
    #     futures = []
    #     for stock_code in stock_codes:
    #         for expiry in expiries:
    #             for right in RIGHTS:
    #                 for strike in strike_prices:
    #                     futures.append(executor.submit(fetch_option_data, stock_code, expiry, right, strike))

    #     for future in as_completed(futures):
    #         # Just ensure exceptions raised in threads are surfaced
    #         future.result()

    # # Signal to stop saver thread
    # file_save_queue.put(None)
    # saver_thread.join()
    stock_code = "NIFTY"
    expiry = "2022-01-06T07:00:00.000Z"
    right = "call"
    # strike_prices = ["23200"]
    for strike in strike_prices:
        fetch_option_data(stock_code, expiry, right, strike)
    print("Option chain historical data fetching complete.")


if __name__ == "__main__":
    main()
