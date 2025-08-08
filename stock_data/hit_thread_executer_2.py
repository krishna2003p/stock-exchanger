from concurrent.futures import ThreadPoolExecutor, as_completed
from time import sleep
import requests
import json
import hashlib
from datetime import datetime, timezone
import pandas as pd
import os,sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from credentials import *
from breeze_connection import connect_breeze
from datetime import datetime, timedelta
import queue
import threading

# Queue
file_save_queue = queue.Queue()

max_threads = 20     # You can tweak this; 10–30 is reasonable for most APIs
tasks = []

# stock_codes = [ 'TORPOW', 'JBMAUT', 'BLUDAR', 'CROGR', 'MAHFIN', 'MAHN16', 'SIGI', 'GNFC', 'BANMAH', 'WELIND', 'ONE97', 'FINCAB', 'TATMOT', 'BAAUTO', 'NBCC', 'ITI', 'BAFINS', 'INDIBA', 'BRASOL', 'LTFINA', 'TRENT', 'ADICAP', 'CEINFO', 'NIITEC', 'GMRINF', 'TRILTD', 'NEWIN', 'JSWENE', 'DEVIN', 'DELLIM', 'CENBAN', 'TATCOM', 'KARVYS', 'EXIIND', 'EIHLIM', 'PERSYS', 'NETW18', 'PNCINF', 'SBFFIN', 'AMARAJ', 'JINSAW', 'CHAHOT', 'INOIND', 'CHON44', 'CHOINV', 'ERILIF', 'BATIND', 'ROUMOB', 'FAGBEA', 'ANGBRO', 'INFTEC', 'GAIL', 'KFITEC', 'BHAINF', 'LLOMET', 'HCLTEC', 'PGELEC', 'BANBAN', 'SYNINT', 'TECEEC', 'SUPIND', 'JUBFOO', 'MAGFI', 'NIVBUP', 'SAPFOO', 'APAIND', 'CAMACT', 'IDFBAN', 'PETLNG', 'CEAT', 'ABB', 'NAGCON', 'KEIIND', 'JMFINA', 'MRFTYR', 'SUNFAS', 'TRITUR', 'ACTCON', 'RELIND', 'BHAAIR', 'HIMCHE', 'INOWIN', 'SAGINI', 'BHEL', 'PNBHOU', 'JUSDIA', 'TATTE', 'BAYIND', 'MINCOR', 'JSWHOL', 'WAAENE', 'MANAFI', 'BHAFOR', 'HINPET', 'TVSMOT', 'SWILIM', 'SBICAR', 'AFCINF', 'TITWAG', 'SIEMEN', 'BRIENT', 'GODIND', 'JIOFIN', 'GOLTEL', 'KECIN', 'PBFINT', 'GUJMI', 'GRAVIN', 'APOHOS', 'KALJEW', 'CAPGLO', 'RAMFOR', 'CONCOR', 'SUNFIN', 'ALSTD', 'MAXHEA', 'TUBIN', 'MRPL', 'JKTYRE', 'SOLIN', 'IFCI', 'NATPHA', 'PHICAR', 'APOTYR', 'HINAER', 'BHAPET', 'BHAELE', 'KIRBRO', 'KAYTEC', 'CHEPET', 'AUTINV', 'CESC', 'ALOIND', 'MUTFIN', 'ADIWA1', 'ADIFAS', 'PTCIN', 'HONCON', 'AAVFIN', 'TRAREC', 'LTINFO', 'CDSL', 'WIPRO', 'SAREIN', 'CHAFER', 'OILIND', 'SWAENE', 'INDHO', 'MCX', 'COCSHI', 'PVRLIM', 'MASTEK', 'PREENR', 'BSE', 'DATPAT', 'KPRMIL', 'TCS', 'IDECEL', 'CERSAN', 'ABBPOW', 'MAHMAH', 'ZENTEC', 'INFEDG', 'LEMTRE', 'STEWIL', 'ZEEENT', 'MININD', 'COMAGE', 'BHADYN', 'METHEA', 'AMBEN', 'GARREA', 'MAZDOC', 'TATELX', 'BEML', 'INDREN']
# stock_codes = ['IPCLAB', 'KOTMAH', 'SYRTEC', 'BALCHI', 'AXIBAN', 'TORPHA', 'RURELE', 'SAIL', 'REDIND', 'CADHEA', 'LININ', 'GRASIM', 'JSWINF', 'PIRENT', 'ECLSER', 'INDMAR', 'TUBINV', 'DEENIT', 'JSWSTE', 'HDFSTA', 'SUMCH', 'CENTEX', 'ABBIND', 'MAXFIN', 'INTGEM', 'RAICOR', 'CREGRA', 'INTDES', 'HINCOP', 'DRREDD', 'MACDEV', 'CAREVE', 'MOTSU', 'LIC', 'MAHGAS', 'CASIND', 'ENGIND', 'AARIND', 'JBCHEM', 'FIVSTA', 'SJVLIM', 'GODIGI', 'TATTEC', 'WHIIND', 'MOTSUM', 'ICIPRU', 'VGUARD', 'CIPLA', 'RUCSOY', 'PIRPHA', 'VIJDIA', 'GODPOW', 'NUVWEA', 'POLMED', 'CLESCI', 'KRIINS', 'PIIND', 'SOBDEV', 'UTIAMC', 'GESHIP', 'HAVIND', 'AURPHA', 'ITC', 'INDCEM', 'STABAN', 'UNIBAN', 'VISMEG', 'INVKNO', 'JINSTA', 'TATSTE', 'VARTEX', 'LARTOU', 'PAGIND', 'GLOHEA', 'NMDSTE', 'EICMOT', 'OLAELE', 'BRIIND', 'ESCORT', 'GSPL', 'RENSUG', 'LAULAB', '3MIND', 'VARBEV', 'CENPLY', 'BLSINT', 'HBLPOW', 'DEEFER', 'GLAPHA', 'ALKAMI', 'CROGRE', 'FSNECO', 'INDBA', 'DRLAL', 'ADAGRE', 'CANBAN', 'ZOMLIM', 'UNISPI', 'GRANUL', 'COLPAL', 'BLUSTA', 'ADAGAS', 'ENDTEC', 'RRKAB', 'TANSOL', 'TECMAH', 'AEGLOG', 'BIKFOO', 'SUNTV', 'FIRSOU', 'BANIND', 'BHAHEX', 'BALIND', 'KANNER', 'AVESUP', 'ADAENT', 'NAVFLU', 'IIFWEA', 'EMALIM', 'AADHOS', 'BASF', 'JUBING', 'MOTOSW', 'ASHLEY', 'THERMA', 'BOMBUR', 'ADAPOW', 'POWGRI', 'YESBAN', 'GUJGA', 'ICIBAN', 'ADAPOR', 'KAJCER', 'FACT', 'KPITEC', 'BAJHOU', 'SAILIF', 'RITLIM', 'APLAPO', 'HUDCO', 'HIMFUT', 'LICHF', 'AUSMA', 'GUJFLU', 'ORAFIN', 'WELCOR', 'SHRTRA', 'DBREAL', 'INDGAS', 'IIFHOL', 'IIFL26', 'IIFL27', 'PIDIND', 'HDFAMC', 'SRF', 'SHYMET', 'TATPOW', 'JINSP', 'MPHLIM', 'KNRCON', 'RATINF', 'RELNIP', 'GODPHI', 'UNIBR', 'ORIREF', 'BANBAR', 'RCF', 'DCMSHR', 'HERHON', 'LTOVER', 'IDBI', 'MINERA', 'SUZENE', 'COALIN', 'TATINV', 'CAPPOI', 'OBEREA', 'IRBINF', 'AIAENG', 'ZENTE', 'PRAIN', 'TITIND', 'TRIENG', 'WESDEV', 'HDFBAN', 'HDFWA2', 'ELGEQU', 'WABIND', 'KALPOW', 'GLELIF', 'FEDBAN', 'TEJNET', 'BAJFI', 'LUPIN', 'JYOCNC', 'UCOBAN', 'NAVBHA', 'GIC', 'MARUTI', 'PUNBAN', 'INDHOT', 'CONBIO', 'BERPAI', 'VOLTAS', 'FORHEA', 'DLFLIM', 'CITUNI', 'PHOMIL', 'MAHSEA', 'DOMIND', 'RAIVIK', 'SONSOF', 'VEDFAS', 'ONGC', 'GODPRO', 'INDEN', 'BAJHOL', 'INDLTD', 'ELEENG', 'TATCHE', 'DIXTEC', 'INDRAI', 'ASTPOL', 'CRAAUT', 'RBLBAN', 'CYILIM', 'INDOVE', 'SKFIND', 'IRCINT', 'SCI', 'INDR', 'ADATRA', 'LATVIE', 'UNIP', 'SONBLW', 'NEWSOF', 'COMENG', 'STAHEA', 'CARUNI', 'HINDAL', 'INDOIL', 'JAMKAS', 'HONAUT', 'POLI', 'TORPOW', 'JBMAUT', 'BLUDAR', 'CROGR', 'MAHFIN', 'MAHN16', 'SIGI', 'GNFC', 'BANMAH', 'WELIND', 'ONE97', 'FINCAB', 'TATMOT', 'BAAUTO', 'NBCC', 'ITI', 'BAFINS', 'INDIBA', 'BRASOL', 'LTFINA', 'TRENT', 'ADICAP', 'CEINFO', 'NIITEC', 'GMRINF', 'TRILTD', 'NEWIN', 'JSWENE', 'DEVIN', 'DELLIM', 'CENBAN', 'TATCOM', 'KARVYS', 'EXIIND', 'EIHLIM', 'PERSYS', 'NETW18', 'PNCINF', 'SBFFIN', 'AMARAJ', 'JINSAW', 'CHAHOT', 'INOIND', 'CHON44', 'CHOINV', 'ERILIF', 'BATIND', 'ROUMOB', 'FAGBEA', 'ANGBRO', 'INFTEC', 'GAIL', 'KFITEC', 'BHAINF', 'LLOMET', 'HCLTEC', 'PGELEC', 'BANBAN', 'SYNINT', 'TECEEC', 'SUPIND', 'JUBFOO', 'MAGFI', 'NIVBUP', 'SAPFOO', 'APAIND', 'CAMACT', 'IDFBAN', 'PETLNG', 'CEAT', 'ABB', 'NAGCON', 'KEIIND', 'JMFINA', 'MRFTYR', 'SUNFAS', 'TRITUR', 'ACTCON', 'RELIND', 'BHAAIR', 'HIMCHE', 'INOWIN', 'SAGINI', 'BHEL', 'PNBHOU', 'JUSDIA', 'TATTE', 'BAYIND', 'MINCOR', 'JSWHOL', 'WAAENE', 'MANAFI', 'BHAFOR', 'HINPET', 'TVSMOT', 'SWILIM', 'SBICAR', 'AFCINF', 'TITWAG', 'SIEMEN', 'BRIENT', 'GODIND', 'JIOFIN', 'GOLTEL', 'KECIN', 'PBFINT', 'GUJMI', 'GRAVIN', 'APOHOS', 'KALJEW', 'CAPGLO', 'RAMFOR', 'CONCOR', 'SUNFIN', 'ALSTD', 'MAXHEA', 'TUBIN', 'MRPL', 'JKTYRE', 'SOLIN', 'IFCI', 'NATPHA', 'PHICAR', 'APOTYR', 'HINAER', 'BHAPET', 'BHAELE', 'KIRBRO', 'KAYTEC', 'CHEPET', 'AUTINV', 'CESC', 'ALOIND', 'MUTFIN', 'ADIWA1', 'ADIFAS', 'PTCIN', 'HONCON', 'AAVFIN', 'TRAREC', 'LTINFO', 'CDSL', 'WIPRO', 'SAREIN', 'CHAFER', 'OILIND', 'SWAENE', 'INDHO', 'MCX', 'COCSHI', 'PVRLIM', 'MASTEK', 'PREENR', 'BSE', 'DATPAT', 'KPRMIL', 'TCS', 'IDECEL', 'CERSAN', 'ABBPOW', 'MAHMAH', 'ZENTEC', 'INFEDG', 'LEMTRE', 'STEWIL', 'ZEEENT', 'MININD', 'COMAGE', 'BHADYN', 'METHEA', 'AMBEN', 'GARREA', 'MAZDOC', 'TATELX', 'BEML', 'INDREN']
# stock_codes = ['AURPHA', 'ITC', 'INDCEM', 'STABAN', 'UNIBAN', 'VISMEG', 'INVKNO', 'JINSTA', 'TATSTE', 'VARTEX', 'LARTOU', 'PAGIND', 'GLOHEA', 'NMDSTE', 'EICMOT', 'OLAELE', 'BRIIND', 'ESCORT', 'GSPL', 'RENSUG', 'LAULAB', '3MIND', 'VARBEV', 'CENPLY', 'BLSINT', 'HBLPOW', 'DEEFER', 'GLAPHA', 'ALKAMI', 'CROGRE', 'FSNECO', 'INDBA', 'DRLAL', 'ADAGRE', 'CANBAN', 'ZOMLIM', 'UNISPI', 'GRANUL', 'COLPAL', 'BLUSTA', 'ADAGAS', 'ENDTEC', 'RRKAB', 'TANSOL', 'TECMAH', 'AEGLOG', 'BIKFOO', 'SUNTV', 'FIRSOU', 'BANIND', 'BHAHEX', 'BALIND', 'KANNER', 'AVESUP', 'ADAENT', 'NAVFLU', 'IIFWEA', 'EMALIM', 'AADHOS', 'BASF', 'JUBING', 'MOTOSW', 'ASHLEY', 'THERMA', 'BOMBUR', 'ADAPOW', 'POWGRI', 'YESBAN', 'GUJGA', 'ICIBAN', 'ADAPOR', 'KAJCER', 'FACT', 'KPITEC', 'BAJHOU', 'SAILIF', 'RITLIM', 'APLAPO', 'HUDCO', 'HIMFUT', 'LICHF', 'AUSMA', 'GUJFLU', 'ORAFIN', 'WELCOR', 'SHRTRA', 'DBREAL', 'INDGAS', 'IIFHOL', 'IIFL26', 'IIFL27', 'PIDIND', 'HDFAMC', 'SRF', 'SHYMET', 'TATPOW', 'JINSP', 'MPHLIM', 'KNRCON', 'RATINF', 'RELNIP', 'GODPHI', 'UNIBR', 'ORIREF', 'BANBAR', 'RCF', 'DCMSHR', 'HERHON', 'LTOVER', 'IDBI', 'MINERA', 'SUZENE', 'COALIN', 'TATINV', 'CAPPOI', 'OBEREA', 'IRBINF', 'AIAENG', 'ZENTE', 'PRAIN', 'TITIND', 'TRIENG', 'WESDEV', 'HDFBAN', 'HDFWA2', 'ELGEQU', 'WABIND', 'KALPOW', 'GLELIF', 'FEDBAN', 'TEJNET', 'BAJFI', 'LUPIN', 'JYOCNC', 'UCOBAN', 'NAVBHA', 'GIC', 'MARUTI', 'PUNBAN', 'INDHOT', 'CONBIO', 'BERPAI', 'VOLTAS', 'FORHEA', 'DLFLIM', 'CITUNI', 'PHOMIL', 'MAHSEA', 'DOMIND', 'RAIVIK', 'SONSOF', 'VEDFAS', 'ONGC', 'GODPRO', 'INDEN', 'BAJHOL', 'INDLTD', 'ELEENG', 'TATCHE', 'DIXTEC', 'INDRAI', 'ASTPOL', 'CRAAUT', 'RBLBAN', 'CYILIM', 'INDOVE', 'SKFIND', 'IRCINT', 'SCI', 'INDR', 'ADATRA', 'LATVIE', 'UNIP', 'SONBLW', 'NEWSOF', 'COMENG', 'STAHEA', 'CARUNI', 'HINDAL', 'INDOIL', 'JAMKAS', 'HONAUT', 'POLI', 'TORPOW', 'JBMAUT', 'BLUDAR', 'CROGR', 'MAHFIN', 'MAHN16', 'SIGI', 'GNFC', 'BANMAH', 'WELIND', 'ONE97', 'FINCAB', 'TATMOT', 'BAAUTO', 'NBCC', 'ITI', 'BAFINS', 'INDIBA', 'BRASOL', 'LTFINA', 'TRENT', 'ADICAP', 'CEINFO', 'NIITEC', 'GMRINF', 'TRILTD', 'NEWIN', 'JSWENE', 'DEVIN', 'DELLIM', 'CENBAN', 'TATCOM', 'KARVYS', 'EXIIND', 'EIHLIM', 'PERSYS', 'NETW18', 'PNCINF', 'SBFFIN', 'AMARAJ', 'JINSAW', 'CHAHOT', 'INOIND', 'CHON44', 'CHOINV', 'ERILIF', 'BATIND', 'ROUMOB', 'FAGBEA', 'ANGBRO', 'INFTEC', 'GAIL', 'KFITEC', 'BHAINF', 'LLOMET', 'HCLTEC', 'PGELEC', 'BANBAN', 'SYNINT', 'TECEEC', 'SUPIND', 'JUBFOO', 'MAGFI', 'NIVBUP', 'SAPFOO', 'APAIND', 'CAMACT', 'IDFBAN', 'PETLNG', 'CEAT', 'ABB', 'NAGCON', 'KEIIND', 'JMFINA', 'MRFTYR', 'SUNFAS', 'TRITUR', 'ACTCON', 'RELIND', 'BHAAIR', 'HIMCHE', 'INOWIN', 'SAGINI', 'BHEL', 'PNBHOU', 'JUSDIA', 'TATTE', 'BAYIND', 'MINCOR', 'JSWHOL', 'WAAENE', 'MANAFI', 'BHAFOR', 'HINPET', 'TVSMOT', 'SWILIM', 'SBICAR', 'AFCINF', 'TITWAG', 'SIEMEN', 'BRIENT', 'GODIND', 'JIOFIN', 'GOLTEL', 'KECIN', 'PBFINT', 'GUJMI', 'GRAVIN', 'APOHOS', 'KALJEW', 'CAPGLO', 'RAMFOR', 'CONCOR', 'SUNFIN', 'ALSTD', 'MAXHEA', 'TUBIN', 'MRPL', 'JKTYRE', 'SOLIN', 'IFCI', 'NATPHA', 'PHICAR', 'APOTYR', 'HINAER', 'BHAPET', 'BHAELE', 'KIRBRO', 'KAYTEC', 'CHEPET', 'AUTINV', 'CESC', 'ALOIND', 'MUTFIN', 'ADIWA1', 'ADIFAS', 'PTCIN', 'HONCON', 'AAVFIN', 'TRAREC', 'LTINFO', 'CDSL', 'WIPRO', 'SAREIN', 'CHAFER', 'OILIND', 'SWAENE', 'INDHO', 'MCX', 'COCSHI', 'PVRLIM', 'MASTEK', 'PREENR', 'BSE', 'DATPAT', 'KPRMIL', 'TCS', 'IDECEL', 'CERSAN', 'ABBPOW', 'MAHMAH', 'ZENTEC', 'INFEDG', 'LEMTRE', 'STEWIL', 'ZEEENT', 'MININD', 'COMAGE', 'BHADYN', 'METHEA', 'AMBEN', 'GARREA', 'MAZDOC', 'TATELX', 'BEML', 'INDREN']
stock_codes = ['MAPHA', 'ANARAT', 'JAIPOW', 'HINLEV', 'SARENE', 'RAMCEM', 'AKUDRU', 'ACMSOL', 'NARHRU', 'EIDPAR', 'RAICHI', 'CRISIL', 'BOSLIM', 'NATMIN', 'GLAPH', 'ALKLAB', 'RELPOW', 'SBILIF', 'AJAPHA', 'INTAVI', 'HYUMOT', 'RADKHA', 'JYOLAB', 'GODCON', 'HOMFIR', 'RAYMON', 'HAPMIN', 'GODAGR', 'CORINT', 'JKCEME', 'ICILOM', 'MARLIM', 'NATALU', 'NEYLIG', 'ADIAMC', 'JUBLIF', 'SUNPHA', 'TATGLO', 'ASAIND', 'ATUL', 'SHRCEM', 'USHMA', 'HEG', 'LTTEC', 'FININD', 'ODICEM', 'AMBCE', 'NESIND', 'CANHOM', 'ADAWIL', 'ACC', 'AFFIND', 'PFIZER', 'SCHELE', 'KIRENG', 'ULTCEM', 'IPCLAB', 'SYRTEC', 'AXIBAN', 'SAIL', 'GRASIM', 'JSWINF', 'PIRENT', 'ECLSER', 'TUBINV', 'DEENIT', 'HDFSTA', 'SUMCH', 'CENTEX', 'ABBIND', 'INTGEM', 'RAICOR', 'CREGRA', 'INTDES', 'HINCOP', 'MOTSU', 'LIC', 'MAHGAS', 'CASIND', 'ENGIND', 'JBCHEM', 'FIVSTA', 'TATTEC', 'WHIIND', 'MOTSUM', 'VGUARD', 'CIPLA', 'RUCSOY', 'PIRPHA', 'VIJDIA', 'GODPOW', 'POLMED', 'SOBDEV', 'UTIAMC', 'GESHIP', 'HDFAMC', 'SRF', 'SHYMET', 'TATPOW', 'JINSP', 'MPHLIM', 'KNRCON', 'RATINF', 'RELNIP', 'GODPHI', 'UNIBR', 'ORIREF', 'BANBAR', 'RCF', 'DCMSHR', 'HERHON', 'LTOVER', 'IDBI', 'MINERA', 'SUZENE', 'COALIN', 'TATCHE', 'TATMOT', 'CHON44', 'KAYTEC', 'AUTINV']

# Credentials vachi
# API_KEY = "9H0zb254hW0m8949Qs44x8n6482h804$"
# API_SECRET = "3X58i5Mr764a68Ey56136499070275lA"
# SESSION_TOKEN = "52502193"    
time_stamp = datetime.now(timezone.utc).isoformat()[:19] + '.000Z'
breeze = connect_breeze(API_KEY, API_SECRET, SESSION_TOKEN)


# Date time set
to_date = datetime.now()
from_date = to_date - timedelta(days=365*18)
to_date_str = to_date.strftime('%Y-%m-%d')
from_date_str = from_date.strftime('%Y-%m-%d')

# Directory where file saved
public_folder = os.path.join(os.path.dirname(__file__), '..', 'public','1_minute_data')


# Fetch data from the api
def fetch_data_worker(stock_code):
    try:
        print(f"Executing fetch_data_worker Stock:: {stock_code} ")
        data = breeze.get_historical_data(
            interval="1minute",
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
            file_save_queue.put((stock_code, df))
            # return stock_code, df
        else:
            print(f"{stock_code}: API error or no data.")
            return stock_code, None

    except Exception as e:
        print(f"Error Occcred in fetch_data_worker Error:: {e}")

# Get Data from queue
def file_saver_worker():
    print(f"Executing file_saver_worker  ")
    while True:
        # print("execu")
        item = file_save_queue.get()
        if item is None:  # Sentinel value to stop
            break
        stock_code, df = item
        try:
            file_path = os.path.join(public_folder, f"{stock_code}.csv")
            df.to_csv(file_path, index=True)
            print(f"Saved file {file_path}")
        except Exception as e:
            print(f"Error saving file {stock_code}: {e}")
        file_save_queue.task_done()


# Start the file save worker thread
print("Ready for run")
saver_thread = threading.Thread(target=file_saver_worker)
saver_thread.start()
print("Start thread for getting data from the queue")
# Use ThreadPoolExecutor for fetching and submitting tasks
with ThreadPoolExecutor(max_workers=max_threads) as executor:
    futures = [executor.submit(fetch_data_worker, code) for code in stock_codes]

# Wait for all fetches to finish
for future in as_completed(futures):
    pass  # or process any immediate result if needed

# Signal the saver thread to stop
file_save_queue.put(None)
saver_thread.join()
