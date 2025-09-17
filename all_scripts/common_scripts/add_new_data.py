import os, sys
import pandas as pd
from datetime import datetime, timedelta
from breeze_connect import BreezeConnect
import ta
import logging
import time
import sys
import traceback
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from breeze_connection import multi_connect

# sys.path.append()

# Setup logging
logging.basicConfig(level=logging.INFO)

# Breeze session setup (use your own keys)
breeze = multi_connect("SWADESHHUF")
logging.info("✅ Breeze session established")

# Paths
data_dir = os.path.join(os.path.expanduser("~"),"Documents","Stock_Market","final_stock")
symbols =["AADHOS", "AARIND", "ABB", "ABBIND", "ABBPOW", "ACMSOL",
"ACTCON",
"ADATRA",
"ADAWIL",
"ADIAMC",
"AEGLOG",
"AFCINF",
"AJAPHA",
"AKUDRU",
"ALKAMI",
"ALKLAB",
"ALSTD",
"AMARAJ",
"AMBCE",
"AMIORG",
"ANARAT",
"APAIND",
"APLAPO",
"ASHLEY",
"ASTDM",
"ASTPOL",
"ATUL",
"BAJHOU",
"BALCHI",
"BANBAN",
"BASF",
"BHADYN",
"BHAELE",
"BHAFOR",
"BHAHEX",
"BIKFOO",
"BIRCOR",
"BLUDAR",
"BOMBUR",
"BRASOL",
"BRIENT",
"BSE",
"CADHEA",
"CAMACT",
"CAPPOI",
"CAREVE",
"CCLPRO",
"CDSL",
"CEINFO",
"CERSAN",
"CHEPET",
"CITUNI",
"CLESCI",
"COALIN",
"COCSHI",
"CONBIO",
"CRAAUT",
"CROGR",
"CROGRE",
"CYILIM",
"DATPAT",
"DCMSHR",
"DEEFER",
"DELLIM",
"DIVLAB",
"DOMIND",
"DRLAL",
"ECLSER",
"EIDPAR",
"EMALIM",
"EMCPHA",
"ENDTEC",
"ESCORT",
"EXIIND",
"FDC",
"FINCAB",
"FIRSOU",
"FSNECO",
"GAIL",
"GARREA",
"GIC",
"GLAPH",
"GLELIF",
"GLEPHA",
"GLOHEA",
"GODIGI",
"GODPRO",
"GOKEXP",
"GRAVIN",
"GUJGA",
"GUJPPL",
"HAPMIN",
"HBLPOW",
"HDFAMC",
"HILLTD",
"HIMCHE",
"HINAER",
"HINCON",
"HINCOP",
"HINDAL",
"HINPET",
"HONAUT",
"HONCON",
"HYUMOT",
"IIFHOL",
"IIFWEA",
"INDBA",
"INDLTD",
"INDOVE",
"INDR",
"INDRAI",
"INDREN",
"INFEDG",
"INOIND",
"INOWIN",
"INTGEM",
"INVKNO",
"IPCLAB",
"IRBINF",
"IRCINT",
"JAMKAS",
"JBCHEM",
"JBMAUT",
"JINSAW",
"JINSP",
"JINSTA",
"JIOFIN",
"JKCEME",
"JMFINA",
"JSWENE",
"JSWHOL",
"JSWINF",
"JYOCNC",
"KALJEW",
"KALPOW",
"KANNER",
"KARVYS",
"KAYTEC",
"KCPLTD",
"KECIN",
"KFITEC",
"KIRBRO",
"KIRENG",
"KPITE",
"KPITEC",
"KPRMIL",
"KRIINS",
"LATVIE",
"LAULAB",
"LEMTRE",
"LIC",
"LININ",
"LLOMET",
"LTOVER",
"LTTEC",
"MAPHA",
"MCX",
"MININD",
"MOLPAC",
"MOTOSW",
"MOTSU",
"MUTFIN",
"NARHRU",
"NATALU",
"NATPHA",
"NETTEC",
"NEULAB",
"NEWSOF",
"NHPC",
"NIVBUP",
"NOCIL",
"NTPGRE",
"NUVWEA",
"OBEREA",
"OLAELE",
"ORAFIN",
"ORIREF",
"PAGIND",
"PBFINT",
"PEAGL",
"PERSYS",
"PGELEC",
"PHICAR",
"PHOMIL",
"PIRPHA",
"POLI",
"PREENR",
"PREEST",
"PVRLIM",
"RAICHI",
"RAICOR",
"RAIVIK",
"RAMFOR",
"RATINF",
"RAYLIF",
"RELNIP",
"RENSUG",
"RITLIM",
"ROUMOB",
"RRKAB",
"RUCSOY",
"RURELE",
"SAIL",
"SAILIF",
"SAREIN",
"SARENE",
"SBFFIN",
"SCHELE",
"SHIME",
"SHRPIS",
"SHYMET",
"SIEMEN",
"SIGI",
"SKFIND",
"SOLIN",
"SONBLW",
"STAHEA",
"STYABS",
"SUDCHE",
"SUNFAS",
"SUNFIN",
"SUNPHA",
"SUPIND",
"SWAENE",
"SWILIM",
"TATCOM",
"TATELX",
"TATTE",
"TATTEC",
"TBOTEK",
"TECEEC",
"TECIND",
"TECMAH",
"TEJNET",
"THERMA",
"THICHE",
"TATMOT",
"TRILTD",
"TUBIN",
"TVSMOT",
"UCOBAN",
"UNIBAN",
"UNIP",
"UNISPI",
"UTIAMC",
"VARBEV",
"VARTEX",
"VEDFAS",
"VEDLIM",
"VIJDIA",
"VISMEG",
"VOLTAS",
"WAAENE",
"WABIND",
"WELIND",
"WHIIND",
"WOCKHA",
"XPRIND",
"ZENTE",
"ZOMLIM"]

# Define folder structure and ensure directories exist
save_dir = os.path.join(data_dir,"1_SMA")
os.makedirs(save_dir, exist_ok=True)

for symbol in symbols:
    try:
        file_path = os.path.join(save_dir, f"{symbol}.csv")

        # Find last date from existing file or default to 2008-01-01
        if os.path.exists(file_path):
            last_row = pd.read_csv(file_path, usecols=['datetime']).tail(1)
            last_date_str = last_row.iloc[0]['datetime']
            last_date = pd.to_datetime(last_date_str).normalize()
            from_date = last_date + timedelta(days=1)
        else:
            from_date = datetime(2008, 1, 1)

        to_date = datetime.today()

        if from_date > to_date:
            logging.info(f"No new data to fetch for {symbol}.")
            continue

        # Format dates for API
        from_date_str = from_date.strftime("%Y-%m-%dT09:15:00.000Z")
        to_date_str = to_date.strftime("%Y-%m-%dT15:30:00.000Z")

        logging.info(f"📥 Fetching new data for {symbol} from {from_date.date()} to {to_date.date()}")

        response = breeze.get_historical_data(
            interval="1day",
            stock_code=symbol,
            exchange_code="NSE",
            from_date=from_date_str,
            to_date=to_date_str
        )
        time.sleep(.25)  # throttle a bit to avoid rate limit

        new_data = response.get("Success", [])
        if not new_data:
            logging.info(f"No new data available for {symbol} in this range.")
            continue

        new_df = pd.DataFrame(new_data)
        new_df["datetime"] = pd.to_datetime(new_df["datetime"])
        new_df.set_index("datetime", inplace=True)
        new_df.sort_index(inplace=True)

        # Load existing data (if any)
        if os.path.exists(file_path):
            old_df = pd.read_csv(file_path, parse_dates=['datetime'], index_col='datetime')
            combined_df = pd.concat([old_df, new_df])
            combined_df = combined_df[~combined_df.index.duplicated(keep='last')]
            combined_df.sort_index(inplace=True)
        else:
            combined_df = new_df

        # Ensure numeric columns
        for col in ["open", "high", "low", "close", "volume"]:
            combined_df[col] = pd.to_numeric(combined_df[col], errors='coerce')

        combined_df.dropna(subset=["close"], inplace=True)

        # Daily indicators
        combined_df["RSI_D"] = ta.momentum.RSIIndicator(combined_df["close"], window=14).rsi()
        combined_df["EMA_50_D"] = ta.trend.EMAIndicator(combined_df["close"], window=50).ema_indicator()
        combined_df["EMA_100_D"] = ta.trend.EMAIndicator(combined_df["close"], window=100).ema_indicator()
        combined_df["EMA_200_D"] = ta.trend.EMAIndicator(combined_df["close"], window=200).ema_indicator()
        combined_df["SMA_100_D"] = ta.trend.SMAIndicator(combined_df["close"], window=100).sma_indicator()
        combined_df["SMA_200_D"] = ta.trend.SMAIndicator(combined_df["close"], window=200).sma_indicator()

        # Weekly indicators
        weekly = combined_df.resample("W").agg({
            "open": "first",
            "high": "max",
            "low": "min",
            "close": "last",
            "volume": "sum"
        }).dropna()

        weekly["RSI_W"] = ta.momentum.RSIIndicator(weekly["close"], window=14).rsi()
        weekly["EMA_50_W"] = ta.trend.EMAIndicator(weekly["close"], window=50).ema_indicator()
        weekly["EMA_100_W"] = ta.trend.EMAIndicator(weekly["close"], window=100).ema_indicator()
        weekly["EMA_200_W"] = ta.trend.EMAIndicator(weekly["close"], window=200).ema_indicator()
        weekly["SMA_100_W"] = ta.trend.SMAIndicator(weekly["close"], window=100).sma_indicator()
        weekly["SMA_200_W"] = ta.trend.SMAIndicator(weekly["close"], window=200).sma_indicator()
        weekly_indicators = weekly.filter(like="RSI").join(weekly.filter(like="EMA")).join(weekly.filter(like="SMA")).reindex(combined_df.index, method="ffill")

        # Monthly indicators
        monthly = combined_df.resample("ME").agg({
            "open": "first",
            "high": "max",
            "low": "min",
            "close": "last",
            "volume": "sum"
        }).dropna()

        monthly["RSI_M"] = ta.momentum.RSIIndicator(monthly["close"], window=14).rsi()
        monthly["EMA_50_M"] = ta.trend.EMAIndicator(monthly["close"], window=50).ema_indicator()
        monthly["EMA_100_M"] = ta.trend.EMAIndicator(monthly["close"], window=100).ema_indicator()
        monthly["EMA_200_M"] = ta.trend.EMAIndicator(monthly["close"], window=200).ema_indicator()
        monthly["SMA_100_M"] = ta.trend.SMAIndicator(monthly["close"], window=100).sma_indicator()
        monthly["SMA_200_M"] = ta.trend.SMAIndicator(monthly["close"], window=200).sma_indicator()
        monthly_indicators = monthly.filter(like="RSI").join(monthly.filter(like="EMA")).join(monthly.filter(like="SMA")).reindex(combined_df.index, method="ffill")

        # Combine all
        final_df = pd.concat([
            combined_df[["open", "high", "low", "close", "volume", "RSI_D", "EMA_50_D", "EMA_100_D", "EMA_200_D", "SMA_100_D", "SMA_200_D"]],
            weekly_indicators,
            monthly_indicators
        ], axis=1)

        # Save back to CSV
        final_df.to_csv(file_path)
        logging.info(f"✅ Updated and saved data for {symbol}")

    except Exception as e:
        logging.error(f"❌ Error processing {symbol}: {e}")