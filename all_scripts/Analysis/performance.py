import pandas as pd
import os

# === Input and Output Paths ===
home = os.path.expanduser("~")
input_dir = os.path.join(home,"Documents","Stock_Market","final_stock","case1")
output_dir = os.path.join(home,"Documents","Stock_Market","Final_Result")
output_file = os.path.join(output_dir, "Normal.csv")

# Create output directory if not exists
os.makedirs(output_dir, exist_ok=True)

# === Data Container ===
summary_data = []

start_year = 2011
end_year = 2025

# === Processing Logic ===
for file in os.listdir(input_dir):
    if file.endswith("_backtest.csv"):
        symbol = file.replace("_backtest.csv", "")
        file_path = os.path.join(input_dir, file)

        try:
            df = pd.read_csv(file_path, parse_dates=["Entry Date", "Exit Date"])

            if df.empty or df.shape[1] == 0:
                summary_data.append({
                    "Symbol": symbol,
                    "Total Return (%)": "",
                    "Duration (months)": "",
                    "Win Rate (%)": "",
                    "Total Trades": 0,
                    "Hit Trades": 0,
                    "Miss Trades": 0,
                    "Profitable Symbol": "",
                    "Loss-Making Symbol": "",
                })
                continue

            df_filtered = df[
                (df["Entry Date"].dt.year >= start_year) &
                (df["Entry Date"].dt.year <= end_year)
            ]

            if df_filtered.empty:
                summary_data.append({
                    "Symbol": symbol,
                    "Total Return (%)": "",
                    "Duration (months)": "",
                    "Win Rate (%)": "",
                    "Total Trades": 0,
                    "Hit Trades": 0,
                    "Miss Trades": 0,
                    "Profitable Symbol": "",
                    "Loss-Making Symbol": "",
                })
                continue

            total_profit = df_filtered["Profit/Loss ₹"].sum()

            if "Deposit This Trade ₹" in df_filtered.columns:
                total_invested = df_filtered["Deposit This Trade ₹"].sum()
            elif "Investment" in df_filtered.columns:
                total_invested = df_filtered["Investment"].sum()
            else:
                total_invested = len(df_filtered) * 100000  # Default per-trade investment

            total_return_pct = (total_profit / total_invested) * 100 if total_invested > 0 else 0

            trade_durations = (df_filtered["Exit Date"] - df_filtered["Entry Date"]).dt.days
            duration_months = round(trade_durations.sum() / 30.44, 2)

            hit_trades = df_filtered[df_filtered["Profit/Loss ₹"] > 0].shape[0]
            miss_trades = df_filtered[df_filtered["Profit/Loss ₹"] <= 0].shape[0]
            total_trades = hit_trades+miss_trades

            win_rate = (hit_trades / (hit_trades + miss_trades)) * 100 if (hit_trades + miss_trades) > 0 else 0

            summary_data.append({
                "Symbol": symbol,
                "Total Return (%)": round(total_return_pct, 2),
                "Duration (months)": duration_months,
                "Win Rate (%)": round(win_rate, 2),
                "Total Trades": total_trades,
                "Hit Trades": hit_trades,
                "Miss Trades": miss_trades,
                "Profitable Symbol": symbol if total_profit > 0 else "",
                "Loss-Making Symbol": symbol if total_profit <= 0 else "",
            })

        except pd.errors.EmptyDataError:
            summary_data.append({
                "Symbol": symbol,
                "Total Return (%)": "",
                "Duration (months)": "",
                "Win Rate (%)": "",
                "Total Trades": 0,
                "Hit Trades": 0,
                "Miss Trades": 0,
                "Profitable Symbol": "",
                "Loss-Making Symbol": "",
            })
        except Exception as e:
            print(f"❌ Error processing {file}: {e}")

# === Build DataFrame and Save ===
results_df = pd.DataFrame(summary_data)

# Convert 'Total Return (%)' to numeric safely
results_df["Total Return (%)"] = pd.to_numeric(results_df["Total Return (%)"], errors="coerce")

# Save to CSV
results_df.to_csv(output_file, index=False)

# === Summary ===
num_profitable = results_df[results_df["Total Return (%)"] > 0].shape[0]
num_loss_making = results_df[results_df["Total Return (%)"] <= 0].shape[0]
num_no_trades = results_df["Total Return (%)"].isna().sum()

# === Output ===
print(f"\n✅ Summary saved to: {output_file}")
print(f"📈 Profitable Symbols (Hit): {num_profitable}")
print(f"📉 Loss-Making Symbols (Miss): {num_loss_making}")