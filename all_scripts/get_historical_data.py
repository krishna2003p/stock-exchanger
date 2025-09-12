import pandas as pd
import ta

def get_breeze_data(breeze, stock_code, exchange_code, interval, from_date, to_date):
    print(f"Hey I am from_date:: {from_date}, to_date:: {to_date}")
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

    # if data.get("Success") != "":
    #     print(f"Data is not comming")
    #     return
    df = pd.DataFrame(data['Success'])
    df['datetime'] = pd.to_datetime(df['datetime'])
    df.set_index('datetime', inplace=True)

    df = df.astype({
        'open': 'float',
        'high': 'float',
        'low': 'float',
        'close': 'float',
        'volume': 'int'
    })

    return df
