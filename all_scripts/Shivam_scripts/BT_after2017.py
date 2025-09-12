import pandas as pd
from tqdm import tqdm
import time

# --- Parameters ---
PER_TRADE_CAPITAL = 100000
STARTING_CASH = 0
MIN_ENTRY_DATE = pd.Timestamp("2017-01-01")

# --- Load File List ---
file_list = pd.read_csv("generated_files.csv")["names"].tolist()

# --- Symbol-by-Symbol Backtest ---
for i, file in enumerate(file_list):
    symbol = file.replace("_breeze_indicator.csv", "")
    print(f"[{i+1}/{len(file_list)}] 🚀 Backtesting {symbol}...")

    try:
        df = pd.read_csv(file, parse_dates=["datetime"])
        df.sort_values("datetime", inplace=True)

        # Init portfolio for this symbol
        available_cash = STARTING_CASH
        total_deposits = 0
        cumulative_pnl = 0
        in_position = False
        entry_price = 0
        units = 0
        entry_date = None
        trades = []

        for _, row in df.iterrows():
            if any(pd.isna(row.get(k)) for k in ["RSI_D", "RSI_W", "RSI_M", "open", "close", "EMA_200_D", "EMA_200_W"]):
                continue

            dt = row["datetime"]
            
            if dt < MIN_ENTRY_DATE:
                continue  # ⛔️ Skip all entries before 2017

            if not in_position:
                can_enter = (
                    row["RSI_D"] > 58 and row["RSI_W"] > 58 and row["RSI_M"] > 58 and
                    row["open"] > row["EMA_200_D"] and
                    row["open"] > row["EMA_200_W"] and
                    (pd.isna(row["EMA_200_M"]) or row["open"] > row["EMA_200_M"]) #and 
                    #abs(row["open"]- row["EMA_200_D"])/row["EMA_200_D"]<=0.05
                )
                if can_enter:
                    # Check if we need to deposit
                    deposit_this_trade = 0
                    if available_cash < PER_TRADE_CAPITAL:
                        deposit_this_trade = PER_TRADE_CAPITAL - available_cash
                        total_deposits += deposit_this_trade
                        available_cash += deposit_this_trade

                    entry_price = row["open"]
                    entry_date = dt
                    units = int(PER_TRADE_CAPITAL / entry_price)
                    available_cash -= units * entry_price
                    in_position = True
            else:
                should_exit = (row["close"] < row["EMA_200_D"]) or (row["RSI_W"] < 40)
                if should_exit:
                    exit_price = row["close"]
                    pnl = (exit_price - entry_price) * units
                    return_pct = (exit_price - entry_price) / entry_price * 100
                    available_cash += exit_price * units
                    cumulative_pnl += pnl
                    net_investment = total_deposits - cumulative_pnl

                    trades.append({
                        "Entry Date": entry_date,
                        "Exit Date": dt,
                        "Entry Price": round(entry_price, 2),
                        "Exit Price": round(exit_price, 2),
                        "Units": units,
                        "Profit/Loss ₹": round(pnl, 2),
                        "Return (%)": round(return_pct, 2),
                        "Capital After Trade ₹": round(PER_TRADE_CAPITAL + pnl, 2),
                        "Investment": PER_TRADE_CAPITAL,
                        "Deposit This Trade ₹": deposit_this_trade,
                        "Total Deposits ₹": total_deposits,
                        "Net Investment ₹": round(net_investment, 2)
                    })

                    in_position = False
                    entry_price = 0
                    entry_date = None
                    units = 0

        # Final forced exit if still holding a position
        if in_position:
            final_price = df.iloc[-1]["close"]
            final_date = df.iloc[-1]["datetime"]
            pnl = (final_price - entry_price) * units
            return_pct = (final_price - entry_price) / entry_price * 100
            available_cash += final_price * units
            cumulative_pnl += pnl
            net_investment = total_deposits - cumulative_pnl

            trades.append({
                "Entry Date": entry_date,
                "Exit Date": final_date,
                "Entry Price": round(entry_price, 2),
                "Exit Price": round(final_price, 2),
                "Units": units,
                "Profit/Loss ₹": round(pnl, 2),
                "Return (%)": round(return_pct, 2),
                "Capital After Trade ₹": round(PER_TRADE_CAPITAL + pnl, 2),
                "Investment": PER_TRADE_CAPITAL,
                "Deposit This Trade ₹": deposit_this_trade,
                "Total Deposits ₹": total_deposits,
                "Net Investment ₹": round(net_investment, 2)
            })

        # Save CSV per symbol
        result_df = pd.DataFrame(trades)
        if not result_df.empty:
            result_df["Entry Date"] = result_df["Entry Date"].dt.strftime("%m/%d/%Y")
            result_df["Exit Date"] = result_df["Exit Date"].dt.strftime("%m/%d/%Y")
        result_df.to_csv(f"{symbol}_backtest_perc58_2017.csv", index=False)

        # Print Summary
        net_profit = available_cash - total_deposits
        roi = (net_profit / total_deposits * 100) if total_deposits else 0
        print(f"✅ {symbol} | Net Profit: ₹{net_profit:.2f} | ROI: {roi:.2f}% | Trades: {len(trades)}")

    except Exception as e:
        print(f"❌ Error processing {symbol}: {e}")
        #end