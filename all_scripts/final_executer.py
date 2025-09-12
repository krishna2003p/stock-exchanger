from breeze_connection import connect_breeze
from multi_rsi import get_multi_rsi


if __name__ == "__main__":
    # Replace these with your real credentials
    API_KEY = "39V4*7^33)7982p154Y9248695LyOV43"
    API_SECRET = "1tk467w57791I4r3li85m16n0z6@3jR4"
    SESSION_TOKEN = "52470390"

    breeze = connect_breeze(API_KEY, API_SECRET, SESSION_TOKEN)
    
    rsi_result = get_multi_rsi(breeze, stock_code="TCS", exchange_code="NSE")
    print("Multi-timeframe RSI for TCS:")
    print(rsi_result)
