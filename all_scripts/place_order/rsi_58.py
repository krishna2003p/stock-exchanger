import pandas as pd
import os
import time
from tqdm import tqdm

# --- Parameters ---
PER_TRADE_CAPITAL = 100000
STARTING_CASH = 0
MIN_ENTRY_DATE = pd.Timestamp("2011-01-01")
home = os.path.expanduser("~")
DATA_FOLDER = os.path.join(home,'Documents','Stock_Market','final_stock')
OUTPUT_FOLDER = os.path.join(home, "Documents", "Stock_Market", "final_stock","case6")
COOL_DOWN_TIME = 2  # DAYS
STOP_LOSS_EXIT_DATE = pd.Timestamp("2000-01-01")
# Create output folder if it doesn't exist
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

symbols = ['IRBINF', 'INDREN', 'WELIND', 'SOLIN', 'DOMIND', 'TBOTEK', 'AEGLOG', 'IRCINT', 'SUPIND', 'TRILTD', 'JKCEME', 'GLELIF', 'SARENE', 'DATPAT', 'PERSYS', 'INDBA', 'ADAWIL', 'CADHEA', 'UNIBAN', 'RUCSOY', 'VOLTAS', 'KANNER', 'BHADYN', 'HIMCHE', 'UNISPI', 'KRIINS', 'GLAPH', 'GOKEXP', 'GODPRO', 'INOWIN', 'ECLSER', 'KARVYS', 'STAHEA', 'VISMEG', 'PREEST', 'HONCON', 'KECIN', 'CRAAUT', 'BHAFOR', 'CEINFO', 'WOCKHA', 'NETTEC', 'PREENR', 'THICHE', 'HINPET', 'TECMAH', 'CCLPRO', 'GRAVIN', 'UTIAMC', 'NOCIL', 'JBCHEM', 'KIRENG', 'RURELE', 'TATELX', 'RAICHI', 'POLI', 'LATVIE', 'MAPHA', 'LLOMET', 'SUNPHA', 'NIVBUP', 'ALKAMI', 'KPRMIL', 'ABB', 'BALCHI', 'JINSTA', 'LTOVER', 'CITUNI', 'DRLAL', 'HINCON', 'APAIND', 'INTGEM', 'KALJEW', 'COALIN', 'NTPGRE', 'SBFFIN', 'EXIIND', 'SIEMEN', 'JAMKAS', 'CLESCI', 'INVKNO', 'SAREIN', 'IIFWEA', 'GIC', 'ABBIND', 'NATPHA', 'BLUDAR', 'ROUMOB', 'TATTEC', 'PIRPHA', 'PVRLIM', 'JIOFIN', 'ENDTEC', 'BRIENT', 'LIC', 'GLEPHA', 'SUNFIN', 'DIVLAB', 'BANBAN', 'CERSAN', 'SAILIF', 'ESCORT', 'AMARAJ', 'NHPC', 'VEDLIM', 'PGELEC', 'GAIL', 'MININD', 'PAGIND', 'TATCOM', 'UNIP', 'MOTOSW', 'INDOVE', 'INDR', 'TECEEC', 'PBFINT', 'INDRAI', 'KAYTEC', 'BRASOL', 'SHIME', 'HINDAL', 'CROGR', 'COCSHI', 'STYABS', 'JYOCNC', 'RAIVIK', 'BHAHEX', 'INOIND', 'HINCOP', 'SCHELE', 'JSWENE', 'SHYMET', 'AFCINF', 'ALKLAB', 'MCX', 'ORAFIN', 'ZOMLIM', 'NEWSOF', 'PEAGL', 'HBLPOW', 'ACTCON', 'AARIND', 'HYUMOT', 'EMCPHA', 'ACMSOL', 'GUJGA', 'NATALU', 'DEEFER', 'LEMTRE', 'XPRIND', 'GLOHEA', 'CONBIO', 'BIRCOR', 'KPITEC', 'VARTEX', 'APLAPO', 'PHOMIL', 'UCOBAN', 'LININ', 'EIDPAR', 'THERMA', 'HDFAMC', 'IIFHOL', 'AMBCE', 'IPCLAB', 'CAREVE', 'CDSL', 'DELLIM', 'TUBIN', 'OLAELE', 'TECIND', 'NARHRU', 'FINCAB', 'RAMFOR', 'VEDFAS', 'CAPPOI', 'FDC', 'ASTDM', 'ALSTD', 'KCPLTD', 'SHRPIS', 'MUTFIN', 'RITLIM', 'RENSUG', 'CHEPET', 'SIGI', 'WAAENE', 'SWAENE', 'ADIAMC', 'MOLPAC', 'HINAER', 'NEULAB', 'CROGRE', 'AMIORG', 'RAYLIF', 'ADATRA', 'HONAUT', 'SUDCHE', 'KPITE', 'JINSP', 'HAPMIN', 'TMLDVR', 'AADHOS', 'BIKFOO', 'BASF', 'SKFIND', 'INFEDG', 'BHAELE', 'BOMBUR', 'RAICOR', 'SAIL', 'SUNFAS', 'FSNECO', 'RATINF', 'AKUDRU', 'ASHLEY', 'HILLTD', 'BSE', 'JSWINF', 'ABBPOW', 'WABIND', 'WHIIND', 'EMALIM', 'PHICAR', 'GODIGI', 'BAJHOU', 'ZENTE', 'DCMSHR', 'JBMAUT', 'LTTEC', 'MOTSU', 'LAULAB', 'CAMACT', 'KFITEC', 'RELNIP', 'AJAPHA', 'JSWHOL', 'SWILIM', 'OBEREA', 'ORIREF', 'JMFINA', 'GARREA', 'CYILIM', 'TATTE', 'RRKAB', 'ATUL', 'ANARAT', 'KALPOW', 'KIRBRO', 'TVSMOT', 'VIJDIA', 'NUVWEA', 'GUJPPL', 'JINSAW', 'SONBLW', 'ASTPOL', 'INDLTD', 'FIRSOU', 'TEJNET', 'VARBEV']


# --- Backtest each symbol using tqdm ---
for symbol in tqdm(symbols, desc="🔁 Backtesting Symbols", unit="symbol"):
    file = os.path.join(DATA_FOLDER, f"{symbol}.csv")

    if not os.path.exists(file):
        print(f"⚠️ File not found: {file} — skipping.")
        continue

    try:
        df = pd.read_csv(file, parse_dates=["datetime"])
        df.sort_values("datetime", inplace=True)

        # Initialize portfolio
        available_cash = STARTING_CASH
        total_deposits = 0
        cumulative_pnl = 0
        in_position = False
        entry_price = 0
        units = 0
        entry_date = None
        trades = []
        deposit_this_trade = 0
        first_pre_2011_entry_logged = False

        for _, row in df.iterrows():
            if any(pd.isna(row.get(k)) for k in ["RSI_D", "RSI_W", "RSI_M", "open", "close", "EMA_200_D", "EMA_200_W"]):
                continue

            dt = row["datetime"]

            if dt < MIN_ENTRY_DATE:
                # case 1
                can_enter = (
                    row["RSI_D"] > 58 and row["RSI_W"] > 58 and row["RSI_M"] > 58 and
                    row["open"] > row["EMA_100_D"] and
                    row["EMA_100_D"] > row["EMA_200_D"] and
                    row["open"] > row["EMA_200_W"] and
                    (pd.isna(row["EMA_200_M"]) or row["open"] > row["EMA_200_M"])
                )

                # case 2
                # can_enter = (
                #     row["RSI_D"] > 58 and row["RSI_W"] > 58 and row["RSI_M"] > 58 and
                #     row["open"] > row["EMA_100_D"] and
                #     row["EMA_100_D"] > row["EMA_200_D"] and
                #     row["EMA_100_W"] > row["EMA_200_W"] and
                #     row["open"] > row["EMA_200_W"] and
                #     (pd.isna(row["EMA_200_M"]) or row["open"] > row["EMA_200_M"])
                #     and (pd.isna(row["EMA_200_M"]) or row["EMA_100_M"] > row["EMA_200_M"])
                # )

                # case 3
                # can_enter = (
                #     row["RSI_D"] > 58 and row["RSI_W"] > 58 and row["RSI_M"] > 58 and
                #     row["open"] > row["EMA_200_D"] and
                #     row["EMA_100_D"] > row["EMA_200_D"] and
                #     row["open"] > row["EMA_200_W"] and
                #     row["open"] < 1.10 * row["EMA_200_D"] and
                #     (pd.isna(row["EMA_200_M"]) or row["open"] > row["EMA_200_M"])
                # )

                # case 4
                # can_enter = (
                #     row["RSI_D"] > 58 and row["RSI_W"] > 58 and row["RSI_M"] > 58 and
                #     row["open"] > row["EMA_200_D"] and
                #     row["EMA_100_D"] > row["EMA_200_D"] and
                #     row["open"] > row["EMA_200_W"] and
                #     row["open"] < 1.15 * row["EMA_200_D"] and
                #     (pd.isna(row["EMA_200_M"]) or row["open"] > row["EMA_200_M"])
                # )
                if can_enter and not first_pre_2011_entry_logged:
                    print(f"⚠️ {symbol}: Valid entry signal detected before 2011 on {dt.date()}, but skipped.")
                    first_pre_2011_entry_logged = True
                continue

            if not in_position:

                if dt-STOP_LOSS_EXIT_DATE <= pd.Timedelta(days=COOL_DOWN_TIME):
                    continue

                # case 1
                can_enter = (
                    row["RSI_D"] > 58 and row["RSI_W"] > 58 and row["RSI_M"] > 58 and
                    row["open"] > row["EMA_200_D"] and
                    row["EMA_100_D"] > row["EMA_200_D"] and
                    row["open"] > row["EMA_200_W"] and
                    (pd.isna(row["EMA_200_M"]) or row["open"] > row["EMA_200_M"])
                )

                # case 2 
                # can_enter = (
                #     row["RSI_D"] > 58 and row["RSI_W"] > 58 and row["RSI_M"] > 58 and
                #     row["open"] > row["EMA_100_D"] and
                #     row["EMA_100_D"] > row["EMA_200_D"] and
                #     row["EMA_100_W"] > row["EMA_200_W"] and
                #     row["open"] > row["EMA_200_W"] and
                #     (pd.isna(row["EMA_200_M"]) or row["open"] > row["EMA_200_M"])
                #     and (pd.isna(row["EMA_200_M"]) or row["EMA_100_M"] > row["EMA_200_M"])
                # )

                # case 3
                # can_enter = (
                #     row["RSI_D"] > 58 and row["RSI_W"] > 58 and row["RSI_M"] > 58 and
                #     row["open"] > row["EMA_200_D"] and
                #     row["EMA_100_D"] > row["EMA_200_D"] and
                #     row["open"] > row["EMA_200_W"] and
                #     row["open"] < 1.10 * row["EMA_200_D"] and
                #     (pd.isna(row["EMA_200_M"]) or row["open"] > row["EMA_200_M"])
                # )

                # case 4
                # can_enter = (
                #     row["RSI_D"] > 58 and row["RSI_W"] > 58 and row["RSI_M"] > 58 and
                #     row["open"] > row["EMA_200_D"] and
                #     row["EMA_100_D"] > row["EMA_200_D"] and
                #     row["open"] > row["EMA_200_W"] and
                #     row["open"] < 1.15 * row["EMA_200_D"] and
                #     (pd.isna(row["EMA_200_M"]) or row["open"] > row["EMA_200_M"])
                # )

                if can_enter:
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
                # case 1
                should_exit = (row["close"] < row["EMA_200_D"]) or (row["RSI_W"] < 40)

                # case 5
                # should_exit = (row["close"] < row["EMA_200_D"]) or (row["RSI_W"] < 40) or (row["close"] < entry_price * 0.9)
                # if row["close"] < entry_price * 0.9:
                #     STOP_LOSS_EXIT_DATE = dt

                # case 6
                # should_exit = (row["close"] < row["EMA_200_D"]) or (row["RSI_W"] < 40) or (row["close"] < entry_price * 0.85)
                # if row["close"] < entry_price * 0.85:
                #     STOP_LOSS_EXIT_DATE = dt

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

        # Save result
        time.sleep(0)
        result_df = pd.DataFrame(trades)
        if not result_df.empty:
            result_df["Entry Date"] = result_df["Entry Date"].dt.strftime("%m/%d/%Y")
            result_df["Exit Date"] = result_df["Exit Date"].dt.strftime("%m/%d/%Y")

        output_path = os.path.join(OUTPUT_FOLDER, f"{symbol}_backtest(58).csv")
        result_df.to_csv(output_path, index=False)

        # Summary
        net_profit = available_cash - total_deposits
        roi = (net_profit / total_deposits * 100) if total_deposits else 0
        print(f"✅ {symbol} | Net Profit: ₹{net_profit:.2f} | ROI: {roi:.2f}% | Trades: {len(trades)}")

    except Exception as e:
        print(f"❌ Error processing {symbol}: {e}")