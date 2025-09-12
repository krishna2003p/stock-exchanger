import pandas as pd
import os
from tqdm import tqdm

# --- Parameters ---
PER_TRADE_CAPITAL = 100000
STARTING_CASH = 0
MIN_ENTRY_DATE = pd.Timestamp("2011-01-01")

home = os.path.expanduser("~")
# DATA_FOLDER = os.path.join(home, 'Documents', 'Stock_Market', 'final_stock')
DATA_FOLDER = os.path.join(home, 'Documents', 'Stock_Market', 'nifty_500','1_day_data')
OUTPUT_PATH = os.path.join(home, "Documents", "Stock_Market", "Final_Result", "my_stocks.xlsx")

symbols = [f[:-4] for f in os.listdir(DATA_FOLDER) if f.endswith(".csv")]
symbols = ['INFTEC','LAULAB','SUZENE','DRREDD']
all_trades = []
year_end_positions = []
open_positions = {sym: False for sym in symbols}  # track if symbol is in position

for symbol in tqdm(symbols, desc="Backtesting Symbols"):
    file = os.path.join(DATA_FOLDER, f"{symbol}.csv")
    if not os.path.exists(file):
        continue

    df = pd.read_csv(file, parse_dates=["datetime"])
    df.sort_values("datetime", inplace=True)

    in_position = False
    entry_price = units = None
    entry_date = None
    prev_year = None

    for idx, row in df.iterrows():
        dt = row["datetime"]
        year = dt.year

        # RECORD YEAR-END HOLD if crossing year boundary
        if prev_year is not None and year != prev_year and in_position:
            year_df = df[(df.datetime.dt.year == prev_year) & (df.index <= idx)]
            if not year_df.empty:
                lp = year_df.iloc[-1]["close"]
                hold_pnl = (lp - entry_price) * units
                year_end_positions.append({
                    "Symbol": symbol,
                    "Year": prev_year,
                    "Entry Date": entry_date,
                    "Entry Price": entry_price,
                    "Year End Price": lp,
                    "Units": units,
                    "Hold PnL": hold_pnl,
                    "Investment": PER_TRADE_CAPITAL,
                    "Position_ID": f"{symbol}_{entry_date.strftime('%Y%m%d')}"
                })

        prev_year = year

        # Skip until MIN_ENTRY_DATE or incomplete data
        if dt < MIN_ENTRY_DATE or any(pd.isna(row.get(k)) for k in
           ["RSI_D","RSI_W","RSI_M","open","close","EMA_100_D","EMA_200_D","EMA_200_W"]):
            continue

        entry_signal = (
            row.RSI_D>58 and row.RSI_W>58 and row.RSI_M>58 and
            row.open>row.EMA_200_D and row.EMA_100_D>row.EMA_200_D and
            row.open>row.EMA_200_W and
            (pd.isna(row.get("EMA_200_M")) or row.open>row.EMA_200_M)
        )
        exit_signal = (row.close<row.EMA_200_D) or (row.RSI_W<40)

        # ENTRY: only if no open position for symbol
        if entry_signal and not open_positions[symbol]:
            available_cash = STARTING_CASH
            deposit = max(0, PER_TRADE_CAPITAL - available_cash)
            available_cash += deposit

            entry_price = row.open
            entry_date = dt
            units = int(PER_TRADE_CAPITAL/entry_price)
            open_positions[symbol] = True
            in_position = True

        # EXIT
        elif in_position and exit_signal:
            exit_price = row.close
            pnl = (exit_price-entry_price)*units
            return_pct = pnl/entry_price*100
            all_trades.append({
                "Symbol": symbol,
                "Entry Date": entry_date,
                "Exit Date": dt,
                "Entry Year": entry_date.year,
                "Exit Year": year,
                "Entry Price": round(entry_price,2),
                "Exit Price": round(exit_price,2),
                "Units": units,
                "Profit/Loss": round(pnl,2),
                "Return (%)": round(return_pct,2),
                "Investment": PER_TRADE_CAPITAL,
                "Position_ID": f"{symbol}_{entry_date.strftime('%Y%m%d')}"
            })
            open_positions[symbol] = False
            in_position = False

    # FINAL YEAR-END for still-open
    if in_position:
        last_year = df.iloc[-1]["datetime"].year
        last_price = df.iloc[-1]["close"]
        pnl = (last_price-entry_price)*units
        year_end_positions.append({
            "Symbol": symbol,
            "Year": last_year,
            "Entry Date": entry_date,
            "Entry Price": entry_price,
            "Year End Price": last_price,
            "Units": units,
            "Hold PnL": pnl,
            "Investment": PER_TRADE_CAPITAL,
            "Position_ID": f"{symbol}_{entry_date.strftime('%Y%m%d')}"
        })

# Build DataFrames
trades_df = pd.DataFrame(all_trades)
positions_df = pd.DataFrame(year_end_positions)

# Generate summary rows for each year that has either entries or exits
rows = []
entry_years = trades_df["Entry Year"].unique() if not trades_df.empty else []
exit_years = trades_df["Exit Year"].unique() if not trades_df.empty else []
all_years = sorted(set(entry_years) | set(exit_years))

for year in all_years:
    # Trades entered in this year
    entries = trades_df[trades_df["Entry Year"] == year] if not trades_df.empty else pd.DataFrame()
    
    # Trades exited in this year
    exits = trades_df[trades_df["Exit Year"] == year] if not trades_df.empty else pd.DataFrame()
    
    inv_entry = entries.Investment.sum()
    inv_exit = exits.Investment.sum()
    total_profit = exits[exits["Profit/Loss"] > 0]["Profit/Loss"].sum()
    total_loss = exits[exits["Profit/Loss"] < 0]["Profit/Loss"].sum()
    closed = len(exits)
    hits = (exits["Profit/Loss"] > 0).sum()
    loss_ct = (exits["Profit/Loss"] <= 0).sum()

    # Year-end positions (held positions)
    pos = positions_df[positions_df.Year == year] if not positions_df.empty else pd.DataFrame()
    hold_prof = pos[pos["Hold PnL"] > 0]["Hold PnL"].sum() if not pos.empty else 0
    hold_loss = pos[pos["Hold PnL"] < 0]["Hold PnL"].sum() if not pos.empty else 0
    held = len(pos)

    total_trades = closed + held
    rem_inv = inv_entry - inv_exit
    roi = (total_profit + abs(total_loss)) / inv_entry if inv_entry > 0 else 0

    # Trade names
    entry_names = ", ".join(sorted(entries.Symbol.unique())) if not entries.empty else ""
    exit_names = ", ".join(sorted(exits.Symbol.unique())) if not exits.empty else ""
    prof_names = ", ".join(sorted(exits[exits["Profit/Loss"] > 0].Symbol.unique())) if not exits.empty else ""
    loss_names = ", ".join(sorted(exits[exits["Profit/Loss"] <= 0].Symbol.unique())) if not exits.empty else ""
    
    # Combine entry and exit names for trade_names
    all_trade_names = set()
    if not entries.empty:
        all_trade_names.update(entries.Symbol.unique())
    if not exits.empty:
        all_trade_names.update(exits.Symbol.unique())
    trade_names = ", ".join(sorted(all_trade_names))

    rows.append({
        "Year": year,
        "total_investment_entry": int(inv_entry),
        "total_investment_exit": int(inv_exit),
        "total_profit": round(total_profit, 2),
        "total_loss": round(total_loss, 2),
        "total_hold_profit": round(hold_prof, 2),
        "total_hold_loss": round(hold_loss, 2),
        "total_trades": total_trades,
        "total_trades_closed": closed,
        "total_trades_held": held,
        "hit_trades": hits,
        "loss_trades": loss_ct,
        "remainder_investment": int(rem_inv),
        "return_of_investment": round(roi, 6),
        "trade_names": trade_names,
        "profitable_trade_names": prof_names,
        "lossable_trade_names": loss_names,
        "entry_names": entry_names,
        "exit_names": exit_names
    })

yearly_summary = pd.DataFrame(rows).sort_values("Year")

# Create detailed analysis for each year
def create_year_detailed_analysis(year, trades_df, positions_df):
    """Create detailed analysis for a specific year"""
    
    # Get all activity for this year
    entries = trades_df[trades_df["Entry Year"] == year].copy() if not trades_df.empty else pd.DataFrame()
    exits = trades_df[trades_df["Exit Year"] == year].copy() if not trades_df.empty else pd.DataFrame()
    positions = positions_df[positions_df["Year"] == year].copy() if not positions_df.empty else pd.DataFrame()
    
    detailed_rows = []
    
    # Add entries for this year
    for _, trade in entries.iterrows():
        detailed_rows.append({
            "Activity Type": "ENTRY",
            "Symbol": trade["Symbol"],
            "Date": trade["Entry Date"],
            "Price": trade["Entry Price"],
            "Units": trade["Units"],
            "Investment": trade["Investment"],
            "Entry Price": trade["Entry Price"],
            "Exit Price": trade.get("Exit Price", ""),
            "Profit/Loss": "",
            "Return (%)": "",
            "Status": "Position Opened",
            "Position_ID": trade["Position_ID"],
            "Days Held": "",
            "Exit Year": trade.get("Exit Year", "")
        })
    
    # Add exits for this year
    for _, trade in exits.iterrows():
        days_held = (pd.to_datetime(trade["Exit Date"]) - pd.to_datetime(trade["Entry Date"])).days
        detailed_rows.append({
            "Activity Type": "EXIT",
            "Symbol": trade["Symbol"],
            "Date": trade["Exit Date"],
            "Price": trade["Exit Price"],
            "Units": trade["Units"],
            "Investment": trade["Investment"],
            "Entry Price": trade["Entry Price"],
            "Exit Price": trade["Exit Price"],
            "Profit/Loss": trade["Profit/Loss"],
            "Return (%)": trade["Return (%)"],
            "Status": "Profitable" if trade["Profit/Loss"] > 0 else "Loss",
            "Position_ID": trade["Position_ID"],
            "Days Held": days_held,
            "Exit Year": trade["Exit Year"]
        })
    
    # Add year-end positions (held positions)
    for _, pos in positions.iterrows():
        days_held = (pd.Timestamp(f"{year}-12-31") - pd.to_datetime(pos["Entry Date"])).days
        detailed_rows.append({
            "Activity Type": "HOLD",
            "Symbol": pos["Symbol"],
            "Date": f"{year}-12-31",
            "Price": pos["Year End Price"],
            "Units": pos["Units"],
            "Investment": pos["Investment"],
            "Entry Price": pos["Entry Price"],
            "Exit Price": "",
            "Profit/Loss": pos["Hold PnL"],
            "Return (%)": round((pos["Hold PnL"] / pos["Investment"]) * 100, 2),
            "Status": "Unrealized Gain" if pos["Hold PnL"] > 0 else "Unrealized Loss",
            "Position_ID": pos["Position_ID"],
            "Days Held": days_held,
            "Exit Year": ""
        })
    
    # Create DataFrame and sort by date
    if detailed_rows:
        year_detail_df = pd.DataFrame(detailed_rows)
        year_detail_df["Date"] = pd.to_datetime(year_detail_df["Date"])
        year_detail_df = year_detail_df.sort_values(["Date", "Activity Type"])
        
        # Add year summary at the top
        summary_rows = []
        
        # Calculate year totals
        total_entries = len(entries)
        total_exits = len(exits)
        total_held = len(positions)
        total_investment_entry = entries["Investment"].sum() if not entries.empty else 0
        total_investment_exit = exits["Investment"].sum() if not exits.empty else 0
        total_profit = exits[exits["Profit/Loss"] > 0]["Profit/Loss"].sum() if not exits.empty else 0
        total_loss = exits[exits["Profit/Loss"] < 0]["Profit/Loss"].sum() if not exits.empty else 0
        total_hold_pnl = positions["Hold PnL"].sum() if not positions.empty else 0
        
        summary_rows.extend([
            {"Activity Type": "SUMMARY", "Symbol": f"=== YEAR {year} SUMMARY ===", "Date": "", 
             "Price": "", "Units": "", "Investment": "", "Entry Price": "", "Exit Price": "", 
             "Profit/Loss": "", "Return (%)": "", "Status": "", "Position_ID": "", "Days Held": "", "Exit Year": ""},
            
            {"Activity Type": "SUMMARY", "Symbol": "Total Positions Entered", "Date": "", 
             "Price": "", "Units": "", "Investment": total_investment_entry, "Entry Price": "", "Exit Price": "", 
             "Profit/Loss": "", "Return (%)": "", "Status": total_entries, "Position_ID": "", "Days Held": "", "Exit Year": ""},
             
            {"Activity Type": "SUMMARY", "Symbol": "Total Positions Exited", "Date": "", 
             "Price": "", "Units": "", "Investment": total_investment_exit, "Entry Price": "", "Exit Price": "", 
             "Profit/Loss": total_profit + total_loss, "Return (%)": "", "Status": total_exits, "Position_ID": "", "Days Held": "", "Exit Year": ""},
             
            {"Activity Type": "SUMMARY", "Symbol": "Total Positions Held", "Date": "", 
             "Price": "", "Units": "", "Investment": total_investment_entry - total_investment_exit, "Entry Price": "", "Exit Price": "", 
             "Profit/Loss": total_hold_pnl, "Return (%)": "", "Status": total_held, "Position_ID": "", "Days Held": "", "Exit Year": ""},
             
            {"Activity Type": "SUMMARY", "Symbol": "Realized Profit", "Date": "", 
             "Price": "", "Units": "", "Investment": "", "Entry Price": "", "Exit Price": "", 
             "Profit/Loss": total_profit, "Return (%)": "", "Status": "Gains", "Position_ID": "", "Days Held": "", "Exit Year": ""},
             
            {"Activity Type": "SUMMARY", "Symbol": "Realized Loss", "Date": "", 
             "Price": "", "Units": "", "Investment": "", "Entry Price": "", "Exit Price": "", 
             "Profit/Loss": total_loss, "Return (%)": "", "Status": "Losses", "Position_ID": "", "Days Held": "", "Exit Year": ""},
             
            {"Activity Type": "SUMMARY", "Symbol": "Unrealized P&L", "Date": "", 
             "Price": "", "Units": "", "Investment": "", "Entry Price": "", "Exit Price": "", 
             "Profit/Loss": total_hold_pnl, "Return (%)": "", "Status": "Holdings", "Position_ID": "", "Days Held": "", "Exit Year": ""},
             
            {"Activity Type": "SUMMARY", "Symbol": "=== DETAILED TRANSACTIONS ===", "Date": "", 
             "Price": "", "Units": "", "Investment": "", "Entry Price": "", "Exit Price": "", 
             "Profit/Loss": "", "Return (%)": "", "Status": "", "Position_ID": "", "Days Held": "", "Exit Year": ""},
        ])
        
        # Combine summary and details
        summary_df = pd.DataFrame(summary_rows)
        final_df = pd.concat([summary_df, year_detail_df], ignore_index=True)
        
        return final_df
    
    return pd.DataFrame()

# Save with detailed year sheets
print("Creating detailed Excel report...")
with pd.ExcelWriter(OUTPUT_PATH, engine="openpyxl") as writer:
    # Main summary sheet
    yearly_summary.to_excel(writer, sheet_name="Yearly_Summary", index=False)
    
    # All trades sheet
    if not trades_df.empty:
        trades_df.to_excel(writer, sheet_name="All_Trades", index=False)
    
    # Year-end positions sheet
    if not positions_df.empty:
        positions_df.to_excel(writer, sheet_name="Year_End_Positions", index=False)
    
    # Create detailed sheet for each year
    for year in all_years:
        year_detail = create_year_detailed_analysis(year, trades_df, positions_df)
        if not year_detail.empty:
            sheet_name = str(year)
            year_detail.to_excel(writer, sheet_name=sheet_name, index=False)
            print(f"   Created detailed analysis for year {year}")

print(f"✅ Detailed yearly summary saved to {OUTPUT_PATH}")
print(f"   Created {len(all_years)} year-specific sheets: {', '.join(map(str, all_years))}")