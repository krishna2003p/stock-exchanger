import pandas as pd
import os
from tqdm import tqdm

# --- Parameters ---
PER_TRADE_CAPITAL = 100000
MIN_ENTRY_DATE = pd.Timestamp("2011-01-01")

home = os.path.expanduser("~")
DATA_FOLDER = os.path.join(home, 'Documents', 'Stock_Market', 'final_stock')
OUTPUT_PATH = os.path.join(home, "Documents", "Stock_Market", "Final_Result", "stock_summary_by_symbol_case2.xlsx")

symbols = [f[:-4] for f in os.listdir(DATA_FOLDER) if f.endswith(".csv")]

all_trades = []
year_end_positions = []
open_positions = {sym: False for sym in symbols}

# Backtest and collect trades + year-end holds
for symbol in tqdm(symbols, desc="Processing Symbols"):
    path = os.path.join(DATA_FOLDER, f"{symbol}.csv")
    if not os.path.exists(path):
        continue

    df = pd.read_csv(path, parse_dates=["datetime"])
    df.sort_values("datetime", inplace=True)

    in_position = False
    entry_price = units = None
    entry_date = None
    prev_year = None

    for idx, row in df.iterrows():
        dt = row["datetime"]
        year = dt.year

        # Year-end hold PnL capture on year boundary
        if prev_year is not None and year != prev_year and in_position:
            sub = df[(df.datetime.dt.year == prev_year) & (df.index <= idx)]
            if not sub.empty:
                last_price = sub.iloc[-1]["close"]
                hold_pnl = (last_price - entry_price) * units
                year_end_positions.append({
                    "Symbol": symbol,
                    "Year": prev_year,
                    "Entry Date": entry_date,
                    "Entry Price": entry_price,
                    "Year End Price": last_price,
                    "Units": units,
                    "Hold PnL": hold_pnl,
                    "Investment": PER_TRADE_CAPITAL,
                    "Position_ID": f"{symbol}_{entry_date.strftime('%Y%m%d')}"
                })

        prev_year = year

        # Skip until minimum date or missing data
        if dt < MIN_ENTRY_DATE or any(pd.isna(row.get(k)) for k in
           ["RSI_D","RSI_W","RSI_M","open","close","EMA_100_D","EMA_200_D","EMA_200_W"]):
            continue
        
        # Case 1: Entry/Exit logic
        # entry_signal = (
        #     row.RSI_D>58 and row.RSI_W>58 and row.RSI_M>58 and
        #     row.open>row.EMA_200_D and row.EMA_100_D>row.EMA_200_D and
        #     row.open>row.EMA_200_W and
        #     (pd.isna(row.get("EMA_200_M")) or row.open>row.EMA_200_M)
        # )

        # Case 2: Entry/Exit logic
        entry_signal = (
            row.RSI_D>58 and row.RSI_W>58 and row.RSI_M>58 and
            row.open>row.EMA_200_D and row.EMA_100_D>row.EMA_200_D and
            row.open>row.EMA_200_W and
            row["EMA_100_W"] > row["EMA_200_W"] and
            (pd.isna(row.get("EMA_200_M")) or row.open>row.EMA_200_M)
            and (pd.isna(row["EMA_200_M"]) or row["EMA_100_M"] > row["EMA_200_M"])
        )
        exit_signal = (row.close<row.EMA_200_D) or (row.RSI_W<40)

        # ENTRY: only if not already in position
        if entry_signal and not open_positions[symbol]:
            entry_price = row.open
            entry_date = dt
            units = int(PER_TRADE_CAPITAL / entry_price)
            open_positions[symbol] = True
            in_position = True

        # EXIT: record whenever it happens
        elif in_position and exit_signal:
            exit_price = row.close
            pnl = (exit_price - entry_price) * units
            return_pct = pnl / entry_price * 100
            all_trades.append({
                "Symbol": symbol,
                "Entry Date": entry_date,
                "Exit Date": dt,
                "Entry Year": entry_date.year,
                "Exit Year": year,
                "Entry Price": round(entry_price, 2),
                "Exit Price": round(exit_price, 2),
                "Units": units,
                "Profit/Loss": round(pnl, 2),
                "Return (%)": round(return_pct, 2),
                "Investment": PER_TRADE_CAPITAL,
                "Position_ID": f"{symbol}_{entry_date.strftime('%Y%m%d')}"
            })
            open_positions[symbol] = False
            in_position = False

    # Final year-end hold
    if in_position:
        last_year = df.iloc[-1]["datetime"].year
        last_price = df.iloc[-1]["close"]
        hold_pnl = (last_price - entry_price) * units
        year_end_positions.append({
            "Symbol": symbol,
            "Year": last_year,
            "Entry Date": entry_date,
            "Entry Price": entry_price,
            "Year End Price": last_price,
            "Units": units,
            "Hold PnL": hold_pnl,
            "Investment": PER_TRADE_CAPITAL,
            "Position_ID": f"{symbol}_{entry_date.strftime('%Y%m%d')}"
        })

# Build DataFrames
trades_df = pd.DataFrame(all_trades)
positions_df = pd.DataFrame(year_end_positions)

# Generate summary rows for each (symbol, year) in either entry or exit years
rows = []
for sym in symbols:
    entry_years = trades_df[trades_df.Symbol==sym]["Entry Year"].unique() if not trades_df.empty else []
    exit_years = trades_df[trades_df.Symbol==sym]["Exit Year"].unique() if not trades_df.empty else []
    all_years = sorted(set(entry_years) | set(exit_years))

    for yr in all_years:
        ent = trades_df[(trades_df.Symbol==sym)&(trades_df["Entry Year"]==yr)]
        ext = trades_df[(trades_df.Symbol==sym)&(trades_df["Exit Year"]==yr)]

        inv_ent = ent.Investment.sum()
        inv_ext = ext.Investment.sum()
        prof = ext[ext["Profit/Loss"]>0]["Profit/Loss"].sum()
        loss = ext[ext["Profit/Loss"]<0]["Profit/Loss"].sum()
        closed = len(ext)
        hits = (ext["Profit/Loss"]>0).sum()
        losses = (ext["Profit/Loss"]<=0).sum()

        pos = positions_df[(positions_df.Symbol==sym)&(positions_df.Year==yr)]
        hold_prof = pos[pos["Hold PnL"]>0]["Hold PnL"].sum() if not pos.empty else 0
        hold_loss = pos[pos["Hold PnL"]<0]["Hold PnL"].sum() if not pos.empty else 0
        held = len(pos)

        total_trades = closed + held
        remainder = inv_ent - inv_ext
        roi = (prof + abs(loss)) / inv_ent if inv_ent>0 else 0

        trade_names = ", ".join(sorted(ent.Symbol.unique()))
        prof_names = ", ".join(sorted(ext[ext["Profit/Loss"]>0].Symbol.unique()))
        loss_names = ", ".join(sorted(ext[ext["Profit/Loss"]<=0].Symbol.unique()))
        exit_years_str = ", ".join(str(y) for y in sorted(ext["Exit Year"].unique()))

        rows.append({
            "Symbol": sym,
            "Year": yr,
            "total_investment_entry": int(inv_ent),
            "total_investment_exit": int(inv_ext),
            "total_profit": round(prof, 2),
            "total_loss": round(loss, 2),
            "total_hold_profit": round(hold_prof, 2),
            "total_hold_loss": round(hold_loss, 2),
            "total_trades": total_trades,
            "total_trades_closed": closed,
            "total_trades_held": held,
            "hit_trades": hits,
            "loss_trades": losses,
            "remainder_investment": int(remainder),
            "return_of_investment": round(roi, 6),
            "trade_names": trade_names,
            "profitable_trade_names": prof_names,
            "lossable_trade_names": loss_names,
            "exit_years": exit_years_str
        })

stock_summary = pd.DataFrame(rows).sort_values(["Symbol","Year"])

# Save to Excel
with pd.ExcelWriter(OUTPUT_PATH, engine="openpyxl") as writer:
    stock_summary.to_excel(writer, sheet_name="Stock_Summary", index=False)
    if not trades_df.empty:
        trades_df.to_excel(writer, sheet_name="All_Trades", index=False)
    if not positions_df.empty:
        positions_df.to_excel(writer, sheet_name="Year_End_Positions", index=False)

print(f"✅ Stock-wise summary saved to {OUTPUT_PATH}")
