import pandas as pd
import requests, os, sys

common_data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__),"..","common_data"))
# url = "MW-NIFTY-NEXT-50-06-Aug-2025.csv"
# url = "MW-NIFTY-MIDCAP-50-07-Aug-2025.csv"
url = "1NIFTY500.csv"
file_path = os.path.join(common_data_dir,url)
# url = "1NIFTY500.csv"
df = pd.read_csv(file_path)
df.columns = df.columns.str.strip()
print(f"readed:: {df.columns}")
st_code = df['SYMBOL'].tolist()
print("stock code")
print(st_code)