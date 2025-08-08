from concurrent.futures import ThreadPoolExecutor, as_completed
from time import sleep
import requests
import json
import hashlib
from datetime import datetime, timezone
import pandas as pd
import os,sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from breeze_connection import connect_breeze
# from multi_rsi import get_breeze_data
from datetime import datetime, timedelta

max_threads = 20     # You can tweak this; 10–30 is reasonable for most APIs
tasks = []

# stock_codes = ['PRAIN', 'TITIND', 'TRIENG', 'WESDEV', 'HDFBAN', 'HDFWA2', 'ELGEQU', 'WABIND', 'KALPOW', 'GLELIF', 'FEDBAN', 'TEJNET', 'BAJFI', 'LUPIN', 'JYOCNC', 'UCOBAN', 'NAVBHA', 'GIC', 'MARUTI', 'PUNBAN', 'INDHOT', 'CONBIO', 'BERPAI', 'VOLTAS', 'FORHEA', 'DLFLIM', 'CITUNI', 'PHOMIL', 'MAHSEA', 'DOMIND', 'RAIVIK', 'SONSOF', 'VEDFAS', 'ONGC', 'GODPRO', 'INDEN', 'BAJHOL', 'INDLTD', 'ELEENG', 'TATCHE', 'DIXTEC', 'INDRAI', 'ASTPOL', 'CRAAUT', 'RBLBAN', 'CYILIM', 'INDOVE', 'SKFIND', 'IRCINT', 'SCI', 'INDR', 'ADATRA', 'LATVIE', 'UNIP', 'SONBLW', 'NEWSOF', 'COMENG', 'STAHEA', 'CARUNI', 'HINDAL', 'INDOIL', 'JAMKAS', 'HONAUT', 'POLI']
# stock_codes = ['BALCHI', 'AXIBAN', 'TORPHA', 'RURELE', 'SAIL', 'REDIND', 'CADHEA', 'LININ', 'GRASIM', 'JSWINF', 'PIRENT', 'ECLSER', 'INDMAR', 'TUBINV', 'DEENIT', 'JSWSTE', 'HDFSTA', 'SUMCH', 'CENTEX', 'ABBIND', 'MAXFIN', 'INTGEM', 'RAICOR', 'CREGRA', 'INTDES', 'HINCOP', 'DRREDD', 'MACDEV', 'CAREVE', 'MOTSU', 'LIC', 'MAHGAS', 'CASIND', 'ENGIND', 'AARIND', 'JBCHEM', 'FIVSTA', 'SJVLIM', 'GODIGI', 'TATTEC', 'WHIIND', 'MOTSUM', 'ICIPRU', 'VGUARD', 'CIPLA', 'RUCSOY', 'PIRPHA', 'VIJDIA', 'GODPOW', 'NUVWEA',| 'POLMED', 'CLESCI', 'KRIINS', 'PIIND', 'SOBDEV', 'UTIAMC', 'GESHIP', 'HAVIND', 'AURPHA', 'ITC', 'INDCEM', 'STABAN', 'UNIBAN', 'VISMEG', 'INVKNO', 'JINSTA', 'TATSTE', 'VARTEX', 'LARTOU', 'PAGIND', 'GLOHEA', 'NMDSTE', 'EICMOT', 'OLAELE', 'BRIIND', 'ESCORT', 'GSPL', 'RENSUG', 'LAULAB', '3MIND', 'VARBEV', 'CENPLY', 'BLSINT', 'HBLPOW', 'DEEFER', 'GLAPHA', 'ALKAMI', 'CROGRE', 'FSNECO', 'INDBA', 'DRLAL', 'ADAGRE', 'CANBAN', 'ZOMLIM', 'UNISPI', 'GRANUL', 'COLPAL', 'BLUSTA', 'ADAGAS', 'ENDTEC', 'RRKAB', 'TANSOL', 'TECMAH', 'AEGLOG', 'BIKFOO', 'SUNTV', 'FIRSOU', 'BANIND', 'BHAHEX', 'BALIND', 'KANNER', 'AVESUP', 'ADAENT'||, 'NAVFLU', 'IIFWEA', 'EMALIM', 'AADHOS', 'BASF', 'JUBING', 'MOTOSW', 'ASHLEY', 'THERMA', 'BOMBUR', 'ADAPOW', 'POWGRI', 'YESBAN', 'GUJGA', 'ICIBAN', 'ADAPOR', 'KAJCER', 'FACT', 'KPITEC', 'BAJHOU', 'SAILIF', 'RITLIM', 'APLAPO', 'HUDCO', 'HIMFUT', 'LICHF', 'AUSMA', 'GUJFLU', 'ORAFIN', 'WELCOR', 'SHRTRA', 'DBREAL', 'INDGAS', 'IIFHOL', 'IIFL26', 'IIFL27', 'PIDIND', 'HDFAMC', 'SRF', 'SHYMET', 'TATPOW', 'JINSP', 'MPHLIM', 'KNRCON', 'RATINF', 'RELNIP', 'GODPHI', 'UNIBR', 'ORIREF', 'BANBAR', 'RCF', 'DCMSHR', 'HERHON', 'LTOVER', 'IDBI', 'MINERA', 'SUZENE', 'COALIN', 'TATINV', 'CAPPOI', 'OBEREA', 'IRBINF', 'AIAENG', 'ZENTE', 'PRAIN', 'TITIND', 'TRIENG', 'WESDEV', 'HDFBAN', 'HDFWA2', 'ELGEQU', 'WABIND', 'KALPOW', 'GLELIF', 'FEDBAN', 'TEJNET', 'BAJFI', 'LUPIN', 'JYOCNC', 'UCOBAN', 'NAVBHA', 'GIC', 'MARUTI', 'PUNBAN', 'INDHOT', 'CONBIO', 'BERPAI', 'VOLTAS', 'FORHEA', 'DLFLIM', 'CITUNI', 'PHOMIL', 'MAHSEA', 'DOMIND', 'RAIVIK', 'SONSOF', 'VEDFAS', 'ONGC', 'GODPRO', 'INDEN', 'BAJHOL', 'INDLTD', 'ELEENG', 'TATCHE', 'DIXTEC', 'INDRAI', 'ASTPOL', 'CRAAUT', 'RBLBAN', 'CYILIM', 'INDOVE', 'SKFIND', 'IRCINT', 'SCI', 'INDR', 'ADATRA', 'LATVIE', 'UNIP', 'SONBLW', 'NEWSOF', 'COMENG', 'STAHEA', 'CARUNI', 'HINDAL', 'INDOIL', 'JAMKAS', 'HONAUT', 'POLI', 'TORPOW', 'JBMAUT', 'BLUDAR', 'CROGR', 'MAHFIN', 'MAHN16', 'SIGI', 'GNFC', 'BANMAH', 'WELIND', 'ONE97', 'FINCAB', 'TATMOT', 'BAAUTO', 'NBCC', 'ITI', 'BAFINS', 'INDIBA', 'BRASOL', 'LTFINA', 'TRENT', 'ADICAP', 'CEINFO', 'NIITEC', 'GMRINF', 'TRILTD', 'NEWIN', 'JSWENE', 'DEVIN', 'DELLIM', 'CENBAN', 'TATCOM', 'KARVYS', 'EXIIND', 'EIHLIM', 'PERSYS', 'NETW18', 'PNCINF', 'SBFFIN', 'AMARAJ', 'JINSAW', 'CHAHOT', 'INOIND', 'CHON44', 'CHOINV', 'ERILIF', 'BATIND', 'ROUMOB', 'FAGBEA', 'ANGBRO', 'INFTEC', 'GAIL', 'KFITEC', 'BHAINF', 'LLOMET', 'HCLTEC', 'PGELEC', 'BANBAN', 'SYNINT', 'TECEEC', 'SUPIND', 'JUBFOO', 'MAGFI', 'NIVBUP', 'SAPFOO', 'APAIND', 'CAMACT', 'IDFBAN', 'PETLNG', 'CEAT', 'ABB', 'NAGCON', 'KEIIND', 'JMFINA', 'MRFTYR', 'SUNFAS', 'TRITUR', 'ACTCON', 'RELIND', 'BHAAIR', 'HIMCHE', 'INOWIN', 'SAGINI', 'BHEL', 'PNBHOU', 'JUSDIA', 'TATTE', 'BAYIND', 'MINCOR', 'JSWHOL', 'WAAENE', 'MANAFI', 'BHAFOR', 'HINPET', 'TVSMOT', 'SWILIM', 'SBICAR', 'AFCINF', 'TITWAG', 'SIEMEN', 'BRIENT', 'GODIND', 'JIOFIN', 'GOLTEL', 'KECIN', 'PBFINT', 'GUJMI', 'GRAVIN', 'APOHOS', 'KALJEW', 'CAPGLO', 'RAMFOR', 'CONCOR', 'SUNFIN', 'ALSTD', 'MAXHEA', 'TUBIN', 'MRPL', 'JKTYRE', 'SOLIN', 'IFCI', 'NATPHA', 'PHICAR', 'APOTYR', 'HINAER', 'BHAPET', 'BHAELE', 'KIRBRO', 'KAYTEC', 'CHEPET', 'AUTINV', 'CESC', 'ALOIND', 'MUTFIN', 'ADIWA1', 'ADIFAS', 'PTCIN', 'HONCON', 'AAVFIN', 'TRAREC', 'LTINFO', 'CDSL', 'WIPRO', 'SAREIN', 'CHAFER', 'OILIND', 'SWAENE', 'INDHO', 'MCX', 'COCSHI', 'PVRLIM', 'MASTEK', 'PREENR', 'BSE', 'DATPAT', 'KPRMIL', 'TCS', 'IDECEL', 'CERSAN', 'ABBPOW', 'MAHMAH', 'ZENTEC', 'INFEDG', 'LEMTRE', 'STEWIL', 'ZEEENT', 'MININD', 'COMAGE', 'BHADYN', 'METHEA', 'AMBEN', 'GARREA', 'MAZDOC', 'TATELX', 'BEML', 'INDREN']
# stock_codes = ['TORPOW', 'JBMAUT', 'BLUDAR', 'CROGR', 'MAHFIN', 'MAHN16', 'SIGI', 'GNFC', 'BANMAH', 'WELIND', 'ONE97', 'FINCAB', 'TATMOT', 'BAAUTO', 'NBCC', 'ITI', 'BAFINS', 'INDIBA', 'BRASOL', 'LTFINA', 'TRENT', 'ADICAP', 'CEINFO', 'NIITEC', 'GMRINF', 'TRILTD', 'NEWIN', 'JSWENE', 'DEVIN', 'DELLIM', 'CENBAN', 'TATCOM', 'KARVYS', 'EXIIND', 'EIHLIM', 'PERSYS', 'NETW18', 'PNCINF', 'SBFFIN', 'AMARAJ', 'JINSAW', 'CHAHOT', 'INOIND', 'CHON44', 'CHOINV', 'ERILIF', 'BATIND', 'ROUMOB', 'FAGBEA', 'ANGBRO', 'INFTEC', 'GAIL', 'KFITEC', 'BHAINF', 'LLOMET', 'HCLTEC', 'PGELEC', 'BANBAN', 'SYNINT', 'TECEEC', 'SUPIND', 'JUBFOO', 'MAGFI', 'NIVBUP', 'SAPFOO', 'APAIND', 'CAMACT', 'IDFBAN', 'PETLNG', 'CEAT', 'ABB', 'NAGCON', 'KEIIND', 'JMFINA', 'MRFTYR', 'SUNFAS', 'TRITUR', 'ACTCON', 'RELIND', 'BHAAIR', 'HIMCHE', 'INOWIN', 'SAGINI', 'BHEL', 'PNBHOU', 'JUSDIA', 'TATTE', 'BAYIND', 'MINCOR', 'JSWHOL', 'WAAENE', 'MANAFI', 'BHAFOR', 'HINPET', 'TVSMOT', 'SWILIM', 'SBICAR', 'AFCINF', 'TITWAG', 'SIEMEN', 'BRIENT', 'GODIND', 'JIOFIN', 'GOLTEL', 'KECIN', 'PBFINT', 'GUJMI', 'GRAVIN', 'APOHOS', 'KALJEW', 'CAPGLO', 'RAMFOR', 'CONCOR', 'SUNFIN', 'ALSTD', 'MAXHEA', 'TUBIN', 'MRPL', 'JKTYRE', 'SOLIN', 'IFCI', 'NATPHA', 'PHICAR', 'APOTYR', 'HINAER', 'BHAPET', 'BHAELE', 'KIRBRO', 'KAYTEC', 'CHEPET', 'AUTINV', 'CESC', 'ALOIND', 'MUTFIN', 'ADIWA1', 'ADIFAS', 'PTCIN', 'HONCON', 'AAVFIN', 'TRAREC', 'LTINFO', 'CDSL', 'WIPRO', 'SAREIN', 'CHAFER', 'OILIND', 'SWAENE', 'INDHO', 'MCX', 'COCSHI', 'PVRLIM', 'MASTEK', 'PREENR', 'BSE', 'DATPAT', 'KPRMIL', 'TCS', 'IDECEL', 'CERSAN', 'ABBPOW', 'MAHMAH', 'ZENTEC', 'INFEDG', 'LEMTRE', 'STEWIL', 'ZEEENT', 'MININD', 'COMAGE', 'BHADYN', 'METHEA', 'AMBEN', 'GARREA', 'MAZDOC', 'TATELX', 'BEML', 'INDREN']
stock_codes = [ 
    "ACC",
    "ADAWIL",
    "AFFIND",
    "ALEPHA",
    "AMBCE",
    "CANHOM",
    "DABIND",
    "DIVLAB",
    "FININD",
    "KIRENG",
    "NESIND",
    "NHPC",
    "NTPC",
    "PFIZER",
    "PREEST",
    "SCHELE",
    "ULTCEM"]

# Credentials vachi
appkey = "9H0zb254hW0m8949Qs44x8n6482h804$"
secret_key = "3X58i5Mr764a68Ey56136499070275lA"
session_key = "52502193"
time_stamp = datetime.now(timezone.utc).isoformat()[:19] + '.000Z'
breeze = connect_breeze(appkey, secret_key, session_key)

to_date = datetime.now()
from_date = to_date - timedelta(days=365*18)

to_date_str = to_date.strftime('%Y-%m-%d')
from_date_str = from_date.strftime('%Y-%m-%d')

def fetch_breeze_data(stock_code):
    try:
        print(f"Execting fetch_breeze_data function Stock:: {stock_code}")
        data = breeze.get_historical_data(
            interval="5minute",
            from_date=from_date_str,
            to_date=to_date_str,
            stock_code=stock_code,
            exchange_code="NSE",
            product_type="cash"
        )
        print(f"Fetched for Stock:: {stock_code}")
        if (data['Status'] == 200) and (data['Error'] is None) and data['Success']:
            df = pd.DataFrame(data['Success'])
            df['datetime'] = pd.to_datetime(df['datetime'])
            df.set_index('datetime', inplace=True)
            df['volume'] = pd.to_numeric(df['volume'], errors='coerce').fillna(0).astype(int)
            df = df.astype({'open': 'float','high': 'float','low': 'float','close': 'float'})
            return stock_code, df
        else:
            print(f"{stock_code}: API error or no data.")
            return stock_code, None
    except Exception as e:
        print(f"{stock_code}: Exception during API fetch: {e}")
        return stock_code, None

# 1. FETCH DATA IN THREADS, STORE RESULTS IN DICTIONARY
results = {}
with ThreadPoolExecutor(max_workers=max_threads) as executor:
    future_to_code = {executor.submit(fetch_breeze_data, code): code for code in stock_codes}
    for future in as_completed(future_to_code):
        code, df = future.result()
        if df is not None:
            results[code] = df
        else:
            print(f"{code}: No data, skipping save.")

# 2. SEQUENTIALLY SAVE FILES AFTER ALL NETWORKING IS DONE
public_folder = os.path.join(os.path.dirname(__file__), '..', 'public','5_minute_data')
for code, df in results.items():
    # stock_folder = os.path.join(public_folder, code)
    # os.makedirs(stock_folder, exist_ok=True)
    output_path = os.path.join(public_folder, f"{code}.csv")
    try:
        df.to_csv(output_path, index=True) # OR df.to_csv(), avoid Excel
        print(f"File saved: {output_path}")
    except Exception as e:
        print(f"{code}: Error saving {output_path}: {e}")