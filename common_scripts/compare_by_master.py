"""
This File responsible for comparision data by master file and return valid stock codes
"""

import os
import pandas as pd

home = os.path.expanduser("~")
common_data_dir = os.path.join(home, "Documents", "Stock_Market", "common_csv")

# Function read the master file...
def read_master_file(master_file_path,exchange_code_list):
    try:
        print(f"Executing function read_master_file::")
        file_path = os.path.join(common_data_dir,master_file_path)
        df = pd.read_csv(file_path)
        filtered_df = df[df['ExchangeCode'].isin(exchange_code_list)]
        stock_codes = filtered_df['ShortName'].tolist()
        return stock_codes
    except Exception as e:
        print(f"Error in read_master_file function:: Error:: {e}")


# # Function read comparision files
def read_comparision_file(file_name):
    try:
        print(f"Executing function read_comparision_file:: FileName:: {file_name}")
        file_path = os.path.join(common_data_dir,file_name)
        df = pd.read_csv(file_path)
        df.columns = df.columns.str.strip()
        symbols = df['SYMBOL'].tolist()
        return symbols
    except Exception as e:
        print(f"Error in read_comparision_file function::  Error:: {e}")


# # Compare the both file and return output
def compare_both_file():
    try:
        print(f"Executing function compare_both_file::")
        master_file = "token_data.csv"
        symbols = read_comparision_file('bank_nifty.csv')
        stocks_data = read_master_file(master_file,symbols)
        return stocks_data
    except Exception as e:
        print(f"Error in compare_both_file:: Error:: {e}")

stock_list = compare_both_file()
print(f"final stock list:: {stock_list}")