import requests
import json
import hashlib
from datetime import datetime, timezone
import pandas as pd
import os,sys


def get_all_stocks():
    url = "logs/public/custom_with_shortnames.csv"
    df = pd.read_csv(url)
    df.columns = df.columns.str.strip()
    st_code = df['ShortName'].tolist()
    # print(f"st_codes:: {st_code}")
    return st_code

customerDetail_url = "https://api.icicidirect.com/breezeapi/api/v1/customerdetails"
# vachi.................................................
appkey = "9H0zb254hW0m8949Qs44x8n6482h804$"
secret_key = "3X58i5Mr764a68Ey56136499070275lA"
session_key = "52490652"
time_stamp = datetime.now(timezone.utc).isoformat()[:19] + '.000Z'

customerDetail_payload = json.dumps({
  "SessionToken": session_key,
  "AppKey": appkey
})

customerDetail_headers = {
    'Content-Type': 'application/json',
}

customerDetail_response = requests.request("GET", customerDetail_url, headers=customerDetail_headers, data=customerDetail_payload)
data = json.loads(customerDetail_response.text)
session_token = data["Success"]["session_token"]

url = "https://api.icicidirect.com/breezeapi/api/v1/historicalcharts"


stock_codes = get_all_stocks()
# print(stock_codes)
stock_codes = ['SBILIF', 'AJAPHA', 'INTAVI', 'ASTPHA', 'HYUMOT', 'RADKHA', 'JYOLAB', 'GODCON', 'APTVAL', 'HOMFIR', 'VEDLIM', 'RAYMON', 'HAPMIN', 'GODAGR', 'CORINT', 'HINZIN', 'JKCEME', 'ICILOM', 'MARLIM', 'BIOCON', 'TIMIND', 'NATALU', 'NEYLIG', 'ADIAMC', 'KPITE', 'JUBLIF', 'ASTDM', 'SUNPHA', 'TBOTEK', 'TATGLO', 'CUMIND', 'GUJPPL', 'RAYLIF', 'ASIPAI', 'ASAIND', 'ATUL', 'SHRCEM', 'USHMA', 'HEG', 'LTTEC', 'DIVLAB', 'FININD', 'DABIND', 'ODICEM', 'AMBCE', 'NESIND', 'CANHOM', 'ADAWIL', 'ACC', 'PREEST', 'AFFIND', 'PFIZER', 'SCHELE', 'NHPC', 'ALEPHA', 'KIRENG', 'NTPC', 'ULTCEM', 'IPCLAB', 'KOTMAH', 'SYRTEC', 'BALCHI', 'AXIBAN', 'TORPHA', 'RURELE', 'SAIL', 'REDIND', 'CADHEA', 'LININ', 'GRASIM', 'JSWINF', 'PIRENT', 'ECLSER', 'INDMAR', 'TUBINV', 'DEENIT', 'JSWSTE', 'HDFSTA', 'SUMCH', 'CENTEX', 'ABBIND', 'MAXFIN', 'INTGEM', 'RAICOR', 'CREGRA', 'INTDES', 'HINCOP', 'DRREDD', 'MACDEV', 'CAREVE', 'MOTSU', 'LIC', 'MAHGAS', 'CASIND', 'ENGIND', 'AARIND', 'JBCHEM', 'FIVSTA', 'SJVLIM', 'GODIGI', 'TATTEC', 'WHIIND', 'MOTSUM', 'ICIPRU', 'VGUARD', 'CIPLA', 'RUCSOY', 'PIRPHA', 'VIJDIA', 'GODPOW', 'NUVWEA', 'POLMED', 'CLESCI', 'KRIINS', 'PIIND', 'SOBDEV', 'UTIAMC', 'GESHIP', 'HAVIND', 'AURPHA', 'ITC', 'INDCEM', 'STABAN', 'UNIBAN', 'VISMEG', 'INVKNO', 'JINSTA', 'TATSTE', 'VARTEX', 'LARTOU', 'PAGIND', 'GLOHEA', 'NMDSTE', 'EICMOT', 'OLAELE', 'BRIIND', 'ESCORT', 'GSPL', 'RENSUG', 'LAULAB', '3MIND', 'VARBEV', 'CENPLY', 'BLSINT', 'HBLPOW', 'DEEFER', 'GLAPHA', 'ALKAMI', 'CROGRE', 'FSNECO', 'INDBA', 'DRLAL', 'ADAGRE', 'CANBAN', 'ZOMLIM', 'UNISPI', 'GRANUL', 'COLPAL', 'BLUSTA', 'ADAGAS', 'ENDTEC', 'RRKAB', 'TANSOL', 'TECMAH', 'AEGLOG', 'BIKFOO', 'SUNTV', 'FIRSOU', 'BANIND', 'BHAHEX', 'BALIND', 'KANNER', 'AVESUP', 'ADAENT', 'NAVFLU', 'IIFWEA', 'EMALIM', 'AADHOS', 'BASF', 'JUBING', 'MOTOSW', 'ASHLEY', 'THERMA', 'BOMBUR', 'ADAPOW', 'POWGRI', 'YESBAN', 'GUJGA', 'ICIBAN', 'ADAPOR', 'KAJCER', 'FACT', 'KPITEC', 'BAJHOU', 'SAILIF', 'RITLIM', 'APLAPO', 'HUDCO', 'HIMFUT', 'LICHF', 'AUSMA', 'GUJFLU', 'ORAFIN', 'WELCOR', 'SHRTRA', 'DBREAL', 'INDGAS', 'IIFHOL', 'IIFL26', 'IIFL27', 'PIDIND', 'HDFAMC', 'SRF', 'SHYMET', 'TATPOW', 'JINSP', 'MPHLIM', 'KNRCON', 'RATINF', 'RELNIP', 'GODPHI', 'UNIBR', 'ORIREF', 'BANBAR', 'RCF', 'DCMSHR', 'HERHON', 'LTOVER', 'IDBI', 'MINERA', 'SUZENE', 'COALIN', 'TATINV', 'CAPPOI', 'OBEREA', 'IRBINF', 'AIAENG', 'ZENTE', 'PRAIN', 'TITIND', 'TRIENG', 'WESDEV', 'HDFBAN', 'HDFWA2', 'ELGEQU', 'WABIND', 'KALPOW', 'GLELIF', 'FEDBAN', 'TEJNET', 'BAJFI', 'LUPIN', 'JYOCNC', 'UCOBAN', 'NAVBHA', 'GIC', 'MARUTI', 'PUNBAN', 'INDHOT', 'CONBIO', 'BERPAI', 'VOLTAS', 'FORHEA', 'DLFLIM', 'CITUNI', 'PHOMIL', 'MAHSEA', 'DOMIND', 'RAIVIK', 'SONSOF', 'VEDFAS', 'ONGC', 'GODPRO', 'INDEN', 'BAJHOL', 'INDLTD', 'ELEENG', 'TATCHE', 'DIXTEC', 'INDRAI', 'ASTPOL', 'CRAAUT', 'RBLBAN', 'CYILIM', 'INDOVE', 'SKFIND', 'IRCINT', 'SCI', 'INDR', 'ADATRA', 'LATVIE', 'UNIP', 'SONBLW', 'NEWSOF', 'COMENG', 'STAHEA', 'CARUNI', 'HINDAL', 'INDOIL', 'JAMKAS', 'HONAUT', 'POLI', 'TORPOW', 'JBMAUT', 'BLUDAR', 'CROGR', 'MAHFIN', 'MAHN16', 'SIGI', 'GNFC', 'BANMAH', 'WELIND', 'ONE97', 'FINCAB', 'TATMOT', 'BAAUTO', 'NBCC', 'ITI', 'BAFINS', 'INDIBA', 'BRASOL', 'LTFINA', 'TRENT', 'ADICAP', 'CEINFO', 'NIITEC', 'GMRINF', 'TRILTD', 'NEWIN', 'JSWENE', 'DEVIN', 'DELLIM', 'CENBAN', 'TATCOM', 'KARVYS', 'EXIIND', 'EIHLIM', 'PERSYS', 'NETW18', 'PNCINF', 'SBFFIN', 'AMARAJ', 'JINSAW', 'CHAHOT', 'INOIND', 'CHON44', 'CHOINV', 'ERILIF', 'BATIND', 'ROUMOB', 'FAGBEA', 'ANGBRO', 'INFTEC', 'GAIL', 'KFITEC', 'BHAINF', 'LLOMET', 'HCLTEC', 'PGELEC', 'BANBAN', 'SYNINT', 'TECEEC', 'SUPIND', 'JUBFOO', 'MAGFI', 'NIVBUP', 'SAPFOO', 'APAIND', 'CAMACT', 'IDFBAN', 'PETLNG', 'CEAT', 'ABB', 'NAGCON', 'KEIIND', 'JMFINA', 'MRFTYR', 'SUNFAS', 'TRITUR', 'ACTCON', 'RELIND', 'BHAAIR', 'HIMCHE', 'INOWIN', 'SAGINI', 'BHEL', 'PNBHOU', 'JUSDIA', 'TATTE', 'BAYIND', 'MINCOR', 'JSWHOL', 'WAAENE', 'MANAFI', 'BHAFOR', 'HINPET', 'TVSMOT', 'SWILIM', 'SBICAR', 'AFCINF', 'TITWAG', 'SIEMEN', 'BRIENT', 'GODIND', 'JIOFIN', 'GOLTEL', 'KECIN', 'PBFINT', 'GUJMI', 'GRAVIN', 'APOHOS', 'KALJEW', 'CAPGLO', 'RAMFOR', 'CONCOR', 'SUNFIN', 'ALSTD', 'MAXHEA', 'TUBIN', 'MRPL', 'JKTYRE', 'SOLIN', 'IFCI', 'NATPHA', 'PHICAR', 'APOTYR', 'HINAER', 'BHAPET', 'BHAELE', 'KIRBRO', 'KAYTEC', 'CHEPET', 'AUTINV', 'CESC', 'ALOIND', 'MUTFIN', 'ADIWA1', 'ADIFAS', 'PTCIN', 'HONCON', 'AAVFIN', 'TRAREC', 'LTINFO', 'CDSL', 'WIPRO', 'SAREIN', 'CHAFER', 'OILIND', 'SWAENE', 'INDHO', 'MCX', 'COCSHI', 'PVRLIM', 'MASTEK', 'PREENR', 'BSE', 'DATPAT', 'KPRMIL', 'TCS', 'IDECEL', 'CERSAN', 'ABBPOW', 'MAHMAH', 'ZENTEC', 'INFEDG', 'LEMTRE', 'STEWIL', 'ZEEENT', 'MININD', 'COMAGE', 'BHADYN', 'METHEA', 'AMBEN', 'GARREA', 'MAZDOC', 'TATELX', 'BEML', 'INDREN']
# sys.exit()
for st_code in stock_codes:
    payload = {
    "interval": "5minute",
    "from_date": "2007-08-05T09:20:00.000Z",
    "to_date": "2025-08-05T09:20:00.000Z",
    "exchange_code": "NSE",
    "product_type": "Cash"
}
    payload['stock_code'] = st_code
    print(f"Running for:: {st_code}")
    payload = json.dumps(payload, separators=(',', ':'))
    # print(f"Running for:: {payload}")
    checksum = hashlib.sha256((time_stamp+payload+secret_key).encode("utf-8")).hexdigest()
    headers = {
        'Content-Type': 'application/json',
        'X-Checksum': 'token '+ checksum,
        'X-Timestamp': time_stamp,
        'X-AppKey': appkey,
        'X-SessionToken': session_token
    }
    response = requests.request("GET", url, headers=headers, data=payload)
    data = response.json()
    # print(f"Hey this is data:: {data}")
    # Adjust the key below if your data structure is different
    if "Success" in data and isinstance(data["Success"], list):
        df = pd.DataFrame(data["Success"])

        public_folder = os.path.join(os.path.dirname(__file__), '..', 'public')
        stock_folder = os.path.join(public_folder, st_code)
        os.makedirs(stock_folder, exist_ok=True)
        output_path = os.path.join(stock_folder, f"{st_code}_5minute.csv")
        df.to_csv(output_path, index=False)
        print("Data written to stock_data.csv")
    else:
        print("No data found or unexpected response format.")
# print(response.text)