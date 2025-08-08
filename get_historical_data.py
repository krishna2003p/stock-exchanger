import pandas as pd
import ta
from datetime import datetime, timedelta

def get_breeze_data(breeze, stock_code, exchange_code, interval, from_date, to_date):
    data = breeze.get_historical_data(
        interval=interval,
        from_date=from_date,
        to_date=to_date,
        stock_code=stock_code,
        exchange_code=exchange_code,
        product_type="cash",
        expiry_date=None,
        right=None,
        strike_price=None
    )

    # print(f"final data:: {data}")
    print(f"final data st:: {data['Status']}")
    print(f"final data e:: {data['Error']}")

    if data['Status'] == 200 and data['Error'] is None:
        if data['Success']:
            last_record_date = data['Success'][-1]['datetime']
        df = pd.DataFrame(data['Success'])
        df['datetime'] = pd.to_datetime(df['datetime'])
        df.set_index('datetime', inplace=True)

        df['volume'] = pd.to_numeric(df['volume'], errors='coerce').fillna(0).astype(int)
        df = df.astype({
            'open': 'float',
            'high': 'float',
            'low': 'float',
            'close': 'float'
        })
    return df
