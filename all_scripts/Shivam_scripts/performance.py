import pandas as pd
import os

directory = "."  # Folder containing your CSV files
output_file = "symbol_performance_2011_2025(.60)__.csv"

profitable_symbols = []
loss_making_symbols = []
no_trades_symbols = []

# For profitable symbols details
profitable_profits_pct = []
profitable_duration_months = []

start_year = 2011
end_year = 2025

for file in os.listdir(directory):
    if file.endswith("_backtest_common6011(45W).csv"):
        symbol = file.replace("_backtest_common6011(45W).csv", "")
        try:
            df = pd.read_csv(file, parse_dates=["Entry Date", "Exit Date"])

            # Empty or invalid file
            if df.empty or df.shape[1] == 0:
                no_trades_symbols.append(symbol)
                continue

            # Filter trades within entry date range
            df_filtered = df[
                (df["Entry Date"].dt.year >= start_year) &
                (df["Entry Date"].dt.year <= end_year)
            ]

            if df_filtered.empty:
                no_trades_symbols.append(symbol)
                continue

            total_profit = df_filtered["Profit/Loss ₹"].sum()

            # ✅ Use actual deposit for total invested capital
            if "Deposit This Trade ₹" in df_filtered.columns:
                total_invested = df_filtered["Deposit This Trade ₹"].sum()
            elif "Investment" in df_filtered.columns:
                total_invested = df_filtered["Investment"].sum()
            else:
                total_invested = len(df_filtered) * 100000  # fallback assumption

            # Return percentage
            total_return_pct = (total_profit / total_invested) * 100 if total_invested > 0 else 0

            # ✅ Duration: sum of each trade's holding period
            if "Exit Date" in df_filtered.columns:
                trade_durations = (df_filtered["Exit Date"] - df_filtered["Entry Date"]).dt.days
                total_duration_days = trade_durations.sum()
                duration_months = round(total_duration_days / 30.44, 2)
            else:
                duration_months = 0

            # Categorize symbol
            if total_profit > 0:
                profitable_symbols.append(symbol)
                profitable_profits_pct.append(round(total_return_pct, 2))
                profitable_duration_months.append(duration_months)
            else:
                loss_making_symbols.append(symbol)

        except pd.errors.EmptyDataError:
            no_trades_symbols.append(symbol)
        except Exception as e:
            print(f"❌ Error reading {file}: {str(e)}")

# Padding lists for CSV alignment
max_len = max(len(profitable_symbols), len(loss_making_symbols), len(no_trades_symbols))
profitable_symbols += [""] * (max_len - len(profitable_symbols))
profitable_profits_pct += [""] * (max_len - len(profitable_profits_pct))
profitable_duration_months += [""] * (max_len - len(profitable_duration_months))
loss_making_symbols += [""] * (max_len - len(loss_making_symbols))
no_trades_symbols += [""] * (max_len - len(no_trades_symbols))

# Final DataFrame
results_df = pd.DataFrame({
    "Profitable Symbols": profitable_symbols,
    "Total Return (%)": profitable_profits_pct,
    "Duration (months)": profitable_duration_months,
    "Loss-Making Symbols": loss_making_symbols,
    "No Trades": no_trades_symbols
})

results_df.to_csv(output_file, index=False)

# Summary output
print(f"\n✅ Summary saved to: {output_file}")
print(f"📈 Profitable: {len([s for s in profitable_symbols if s])}")
print(f"📉 Loss-Making: {len([s for s in loss_making_symbols if s])}")
print(f"⚠️ No Trades: {len([s for s in no_trades_symbols if s])}")
#end