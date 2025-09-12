import os
import pandas as pd
from glob import glob

# Path settings
data_folder = "C:/Users/KUNAL/Downloads/Market"
symbols_file = os.path.join(data_folder, "symbol_performance_2017_2025(.60)__.csv")

# Load profitable symbols, uppercase for matching
profitable_df = pd.read_csv(symbols_file)
profitable_symbols = profitable_df.iloc[:, 0].astype(str).str.upper().tolist()

# Find *_backtest.csv files for profitable symbols only
files = glob(os.path.join(data_folder, "*_backtest_common6017(45W).csv"))
files_to_process = [
    f for f in files if os.path.basename(f).split("_")[0].upper() in profitable_symbols
]

print(f"✅ Found {len(files_to_process)} profitable backtest files to process")

all_data = []

for file in files_to_process:
    print(f"📄 Reading: {file}")
    try:
        df = pd.read_csv(file, encoding='utf-8')

        if df.empty:
            print(f"⚠️ Skipped empty file: {file}")
            continue

        # Clean column names
        df.columns = df.columns.str.replace('\xa0', ' ', regex=True).str.strip()

        # Find profit/loss column
        profit_col = next((col for col in df.columns if 'Profit/Loss' in col), None)
        if profit_col is None or 'Return (%)' not in df.columns:
            print(f"❌ Required columns missing in: {file}")
            continue

        # Parse dates
        df['Entry Date'] = pd.to_datetime(df['Entry Date'], errors='coerce')
        df['Exit Date'] = pd.to_datetime(df['Exit Date'], errors='coerce')
        df.dropna(subset=['Entry Date', 'Exit Date'], inplace=True)

        # Clean profit and return columns
        df[profit_col] = df[profit_col].replace('[₹,]', '', regex=True).astype(float)
        df['Return (%)'] = df['Return (%)'].astype(float)

        # Add symbol from filename
        symbol = os.path.basename(file).split("_")[0].upper()
        df['Symbol'] = symbol

        all_data.append(df)

    except Exception as e:
        print(f"❌ Failed to process {file}: {e}")

if not all_data:
    print("❌ No valid backtest files for profitable symbols.")
    exit()

# Combine all data
df_all = pd.concat(all_data, ignore_index=True)

# Filter only profitable symbols just in case
df_all = df_all[df_all['Symbol'].isin(profitable_symbols)].copy()

# Create 'Month' column based on Exit Date (period in YYYY-MM format)
df_all['Month'] = df_all['Exit Date'].dt.to_period('M')

# Get full range of months between earliest Entry and latest Exit
min_month = df_all['Entry Date'].min().to_period('M')
max_month = df_all['Exit Date'].max().to_period('M')
full_months = pd.period_range(min_month, max_month, freq='M')

# Track held symbols for each month
held_symbols = set()
rows = []

for month in full_months:
    month_start = month.start_time
    month_end = month.end_time

    # Trades entered and exited in this month (rows)
    trades_entered = df_all[
        (df_all['Entry Date'] >= month_start) & (df_all['Entry Date'] <= month_end)
    ]
    trades_exited = df_all[
        (df_all['Exit Date'] >= month_start) & (df_all['Exit Date'] <= month_end)
    ]

    # Unique symbols bought/sold in this month
    bought_syms = trades_entered['Symbol'].unique()
    sold_syms = trades_exited['Symbol'].unique()

    # Update held symbols
    held_symbols.update(bought_syms)
    held_symbols.difference_update(sold_syms)
    held_syms = held_symbols.copy()

    # Sum profits/losses
    profit_rupee = trades_exited[profit_col].apply(lambda x: x if x > 0 else 0).sum()
    loss_rupee = trades_exited[profit_col].apply(lambda x: abs(x) if x < 0 else 0).sum()

    profit_percent = trades_exited['Return (%)'].apply(lambda x: x if x > 0 else 0).sum()
    loss_percent = trades_exited['Return (%)'].apply(lambda x: abs(x) if x < 0 else 0).sum()

    row = {
        'Year-Month': month.strftime('%Y-%m'),
        'Trades Entered': len(trades_entered),
        'Unique Symbols Entered': len(bought_syms),
        'Trades Exited': len(trades_exited),
        'Unique Symbols Exited': len(sold_syms),
        'Symbols Held': len(held_syms),
        'Profit': round(profit_rupee, 2),
        'Loss': round(loss_rupee, 2),
        'Profit (%)': round(profit_percent, 2),
        'Loss (%)': round(loss_percent, 2),
    }
    rows.append(row)

# Final dataframe
output_df = pd.DataFrame(rows)

# Save file as cumulative_monthly_analysis.csv
output_file = os.path.join(data_folder, "cumalative_monthly_analysis_2017(.60)_45W.csv")
output_df.to_csv(output_file, index=False)

print(f"✅ cumalative_monthly_analysis.csv created at: {output_file}")
#end