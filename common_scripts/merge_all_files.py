import os
import shutil
import pandas as pd
import glob

base_folder = "output"
output_folder = os.path.join(base_folder, "nifty_mid_50", "1_minute_data")
source_folder = os.path.join(base_folder, "nifty_500", "1_minute_data")
os.makedirs(output_folder, exist_ok=True)

# stock_codes = [
#     d for d in os.listdir(base_folder)
#     if os.path.isdir(os.path.join(base_folder, d)) and d != "5_minute_data" and d != "1_minute_data"
# ]

# for stock_code in stock_codes:
#     stock_folder = os.path.join(base_folder, stock_code)
#     # csv_file = os.path.join(stock_folder, f"{stock_code}_5minute.csv")
#     xlsx_file = os.path.join(stock_folder, f"{stock_code}_output_*.xlsx")
#     output_file = os.path.join(output_folder, f"{stock_code}.csv")

#     matched_files = glob.glob(xlsx_file)
#     if not matched_files:
#         print(f"No matching files for {stock_code}")
#         continue
    
#     for file_path in matched_files:
#         # if os.path.isfile(xlsx_file):
#         try:
#             # xlsx_file = 'public/ATUL/ATUL_output_2025-08-05_2007-08-10.xlsx'
#             df = pd.read_excel(file_path, engine='openpyxl')
#             df.to_csv(output_file, index=False)
#             print(f"Converted into CSV file filePath:: {file_path} , OutputPath:: {output_file}")
#         except Exception as e:
#             print(f"Error occured :: {e}")
    # if os.path.isfile(csv_file):
    #     # CSV exists, copy it directly
    #     try:
    #         shutil.copy2(csv_file, output_file)
    #         print(f"Copied CSV for {stock_code} to {output_file}")
    #     except Exception as e:
    #         print(f"Error copying CSV for {stock_code}: {e}")
    # elif os.path.isfile(xlsx_file):
    #     # CSV does not exist but XLSX exists, convert XLSX to CSV
    #     try:
    #         df = pd.read_excel(xlsx_file, engine='openpyxl')
    #         df.to_csv(output_file, index=False)
    #         print(f"Converted XLSX to CSV for {stock_code} and saved to {output_file}")
    #     except Exception as e:
    #         print(f"Error converting XLSX for {stock_code}: {e}")
    # else:
    #     print(f"No CSV or XLSX file found for {stock_code}, skipping...")

def copy_file_by_list(list_data):
    for stock_code in list_data:
        csv_file = os.path.join(source_folder,f"{stock_code}.csv")
        output_file = os.path.join(output_folder,f"{stock_code}.csv")
        if os.path.isfile(csv_file):
            # CSV exists, copy it directly
            try:
                shutil.copy2(csv_file, output_file)
                print(f"Copied CSV for {stock_code} to {output_file}")
                # print(f"Yes Stock:: {stock_code}")
            except Exception as e:
                print(f"Error copying CSV for {stock_code}: {e}")

        else:
            print(f"File is not found:: file path:: {csv_file}")


nifty_50_duplicate_with_nifty500 = ['FEDBAN', 'LUPIN', 'ORAFIN', 'IDFBAN', 'PETLNG', 'NIITEC', 'ALKLAB', 'YESBAN', 'GMRINF', 'INDRAI', 'TORPOW', 'HINPET', 'IDECEL', 'PAGIND', 'ASTPOL', 'PHOMIL', 'COLPAL', 'NATMIN', 'NHPC', 'OILIND', 'GODPRO', 'SBICAR', 'PERSYS', 'CUMIND', 'BSE', 'OBEREA', 'PREEST', 'ASHLEY', 'AUSMA', 'DIXTEC', 'MAXHEA', 'MRFTYR', 'MUTFIN', 'PIIND', 'AURPHA', 'BHAINF', 'SAIL', 'TUBIN', 'SRF', 'SUPIND', 'VOLTAS', 'MARLIM', 'BHAFOR', 'HDFAMC', 'BHEL', 'MPHLIM', 'CONCOR', 'PBFINT', 'ONE97', 'POLI']
copy_file_by_list(nifty_50_duplicate_with_nifty500)