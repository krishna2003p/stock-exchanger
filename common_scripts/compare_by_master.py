"""
This File responsible for comparision data by master file and return valid stock codes
"""

import os
import pandas as pd


common_data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__),"../","common_data"))

# Function read the master file...
def read_master_file(master_file_path,exchange_code_list):
    try:
        print(f"Executing function read_master_file::")
        file_path = os.path.join(common_data_dir,master_file_path)
        df = pd.read_csv(file_path)
        # Filter rows where exchange_code is in your list
        filtered_df = df[df['ExchangeCode'].isin(exchange_code_list)]
        # Get a list of stock_code as Python list
        stock_codes = filtered_df['ShortName'].tolist()
        print(f"All code list:: {stock_codes}")
        return stock_codes
    except Exception as e:
        print(f"Error in read_master_file function:: Error:: {e}")


# # Function read comparision files
# def read_comparision_file(file_path):
#     try:
#         print(f"Executing function read_comparision_file::")
#     except Exception as e:
#         print(f"Error in read_comparision_file function::  Error:: {e}")


# # Compare the both file and return output
# def compare_both_file(master_output,file_output):
#     try:
#         print(f"Executing function compare_both_file::")

#     except Exception as e:
#         print(f"Error in compare_both_file:: Error:: {e}")

nifty_50_duplicate_with_nifty500 = ['NMDC', 'ALKEM', 'MARICO', 'CUMMINSIND', 'PRESTIGE', 'NHPC', 'SAIL', 'PIIND', 'AUROPHARMA', 'PAGEIND', 'COLPAL', 'ASHOKLEY', 'YESBANK', 'AUBANK', 'OFSS', 'HDFCAMC', 'SRF', 'MPHASIS', 'OBEROIRLTY', 'FEDERALBNK', 'LUPIN', 'VOLTAS', 'PHOENIXLTD', 'GODREJPROP', 'DIXON', 'IRCTC', 'ASTRAL', 'POLYCAB', 'TORNTPOWER', 'PAYTM', 'COFORGE', 'GMRAIRPORT', 'PERSISTENT', 'INDUSTOWER', 'SUPREMEIND', 'IDFCFIRSTB', 'PETRONET', 'MRF', 'BHEL', 'BHARATFORG', 'HINDPETRO', 'SBICARD', 'POLICYBZR', 'CONCOR', 'MAXHEALTH', 'TIINDIA', 'MUTHOOTFIN', 'OIL', 'BSE', 'IDEA']
master_file = "token_data.csv"
read_master_file(master_file,nifty_50_duplicate_with_nifty500)