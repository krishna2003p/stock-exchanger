from breeze_connection import connect_breeze
from multi_rsi import get_multi_rsi
import pandas as pd

def get_all_stocks():
    url = "logs/public/custom_with_shortnames.csv"
    df = pd.read_csv(url)
    df.columns = df.columns.str.strip()
    st_code = df['ShortName'].tolist()
    # print(f"st_codes:: {st_code}")
    return st_code

if __name__ == "__main__":
    # Replace these with your real credentials
    API_KEY = "39V4*7^33)7982p154Y9248695LyOV43"
    API_SECRET = "1tk467w57791I4r3li85m16n0z6@3jR4"
    SESSION_TOKEN = "52502330"

    breeze = connect_breeze(API_KEY, API_SECRET, SESSION_TOKEN)
    
    st_codes = ['SOBDEV', 'UTIAMC', 'GESHIP']
    # st_codes = ['SUMCH', 'CENTEX', 'ABBIND', 'MAXFIN', 'INTGEM', 'RAICOR', 'CREGRA', 'INTDES', 'HINCOP', 'DRREDD', 'MACDEV', 'CAREVE', 'MOTSU', 'LIC', 'MAHGAS', 'CASIND', 'ENGIND', 'AARIND', 'JBCHEM', 'FIVSTA', 'SJVLIM', 'GODIGI', 'TATTEC', 'WHIIND', 'MOTSUM', 'ICIPRU', 'VGUARD', 'CIPLA', 'RUCSOY', 'PIRPHA', 'VIJDIA', 'GODPOW', 'NUVWEA', 'POLMED', 'CLESCI', 'KRIINS', 'PIIND', 'SOBDEV', 'UTIAMC', 'GESHIP', 'HAVIND', 'AURPHA', 'ITC', 'INDCEM', 'STABAN', 'UNIBAN', 'VISMEG', 'INVKNO', 'JINSTA', 'TATSTE', 'VARTEX', 'LARTOU', 'PAGIND', 'GLOHEA', 'NMDSTE', 'EICMOT', 'OLAELE', 'BRIIND', 'ESCORT', 'GSPL', 'RENSUG', 'LAULAB', '3MIND', 'VARBEV', 'CENPLY', 'BLSINT', 'HBLPOW', 'DEEFER', 'GLAPHA', 'ALKAMI', 'CROGRE', 'FSNECO', 'INDBA', 'DRLAL', 'ADAGRE', 'CANBAN', 'ZOMLIM', 'UNISPI', 'GRANUL', 'COLPAL', 'BLUSTA', 'ADAGAS', 'ENDTEC', 'RRKAB', 'TANSOL', 'TECMAH', 'AEGLOG', 'BIKFOO', 'SUNTV', 'FIRSOU', 'BANIND', 'BHAHEX', 'BALIND', 'KANNER', 'AVESUP', 'ADAENT', 'NAVFLU', 'IIFWEA', 'EMALIM', 'AADHOS', 'BASF', 'JUBING', 'MOTOSW', 'ASHLEY', 'THERMA', 'BOMBUR', 'ADAPOW', 'POWGRI', 'YESBAN', 'GUJGA', 'ICIBAN', 'ADAPOR', 'KAJCER', 'FACT', 'KPITEC', 'BAJHOU', 'SAILIF', 'RITLIM', 'APLAPO', 'HUDCO', 'HIMFUT', 'LICHF', 'AUSMA', 'GUJFLU', 'ORAFIN', 'WELCOR', 'SHRTRA', 'DBREAL', 'INDGAS', 'IIFHOL', 'IIFL26', 'IIFL27', 'PIDIND', 'HDFAMC', 'SRF', 'SHYMET', 'TATPOW', 'JINSP', 'MPHLIM', 'KNRCON', 'RATINF', 'RELNIP', 'GODPHI', 'UNIBR', 'ORIREF', 'BANBAR', 'RCF', 'DCMSHR', 'HERHON', 'LTOVER', 'IDBI', 'MINERA', 'SUZENE', 'COALIN', 'TATINV', 'CAPPOI', 'OBEREA', 'IRBINF', 'AIAENG', 'ZENTE', 'PRAIN', 'TITIND', 'TRIENG', 'WESDEV', 'HDFBAN', 'HDFWA2', 'ELGEQU', 'WABIND', 'KALPOW', 'GLELIF', 'FEDBAN', 'TEJNET', 'BAJFI', 'LUPIN', 'JYOCNC', 'UCOBAN', 'NAVBHA', 'GIC', 'MARUTI', 'PUNBAN', 'INDHOT', 'CONBIO', 'BERPAI', 'VOLTAS', 'FORHEA', 'DLFLIM', 'CITUNI', 'PHOMIL', 'MAHSEA', 'DOMIND', 'RAIVIK', 'SONSOF', 'VEDFAS', 'ONGC', 'GODPRO', 'INDEN', 'BAJHOL', 'INDLTD', 'ELEENG', 'TATCHE', 'DIXTEC', 'INDRAI', 'ASTPOL', 'CRAAUT', 'RBLBAN', 'CYILIM', 'INDOVE', 'SKFIND', 'IRCINT', 'SCI', 'INDR', 'ADATRA', 'LATVIE', 'UNIP', 'SONBLW', 'NEWSOF', 'COMENG', 'STAHEA', 'CARUNI', 'HINDAL', 'INDOIL', 'JAMKAS', 'HONAUT', 'POLI', 'TORPOW', 'JBMAUT', 'BLUDAR', 'CROGR', 'MAHFIN', 'MAHN16', 'SIGI', 'GNFC', 'BANMAH', 'WELIND', 'ONE97', 'FINCAB', 'TATMOT', 'BAAUTO', 'NBCC', 'ITI', 'BAFINS', 'INDIBA', 'BRASOL', 'LTFINA', 'TRENT', 'ADICAP', 'CEINFO', 'NIITEC', 'GMRINF', 'TRILTD', 'NEWIN', 'JSWENE', 'DEVIN', 'DELLIM', 'CENBAN', 'TATCOM', 'KARVYS', 'EXIIND', 'EIHLIM', 'PERSYS', 'NETW18', 'PNCINF', 'SBFFIN', 'AMARAJ', 'JINSAW', 'CHAHOT', 'INOIND', 'CHON44', 'CHOINV', 'ERILIF', 'BATIND', 'ROUMOB', 'FAGBEA', 'ANGBRO', 'INFTEC', 'GAIL', 'KFITEC', 'BHAINF', 'LLOMET', 'HCLTEC', 'PGELEC', 'BANBAN', 'SYNINT', 'TECEEC', 'SUPIND', 'JUBFOO', 'MAGFI', 'NIVBUP', 'SAPFOO', 'APAIND', 'CAMACT', 'IDFBAN', 'PETLNG', 'CEAT', 'ABB', 'NAGCON', 'KEIIND', 'JMFINA', 'MRFTYR', 'SUNFAS', 'TRITUR', 'ACTCON', 'RELIND', 'BHAAIR', 'HIMCHE', 'INOWIN', 'SAGINI', 'BHEL', 'PNBHOU', 'JUSDIA', 'TATTE', 'BAYIND', 'MINCOR', 'JSWHOL', 'WAAENE', 'MANAFI', 'BHAFOR', 'HINPET', 'TVSMOT', 'SWILIM', 'SBICAR', 'AFCINF', 'TITWAG', 'SIEMEN', 'BRIENT', 'GODIND', 'JIOFIN', 'GOLTEL', 'KECIN', 'PBFINT', 'GUJMI', 'GRAVIN', 'APOHOS', 'KALJEW', 'CAPGLO', 'RAMFOR', 'CONCOR', 'SUNFIN', 'ALSTD', 'MAXHEA', 'TUBIN', 'MRPL', 'JKTYRE', 'SOLIN', 'IFCI', 'NATPHA', 'PHICAR', 'APOTYR', 'HINAER', 'BHAPET', 'BHAELE', 'KIRBRO', 'KAYTEC', 'CHEPET', 'AUTINV', 'CESC', 'ALOIND', 'MUTFIN', 'ADIWA1', 'ADIFAS', 'PTCIN', 'HONCON', 'AAVFIN', 'TRAREC', 'LTINFO', 'CDSL', 'WIPRO', 'SAREIN', 'CHAFER', 'OILIND', 'SWAENE', 'INDHO', 'MCX', 'COCSHI', 'PVRLIM', 'MASTEK', 'PREENR', 'BSE', 'DATPAT', 'KPRMIL', 'TCS', 'IDECEL', 'CERSAN', 'ABBPOW', 'MAHMAH', 'ZENTEC', 'INFEDG', 'LEMTRE', 'STEWIL', 'ZEEENT', 'MININD', 'COMAGE', 'BHADYN', 'METHEA', 'AMBEN', 'GARREA', 'MAZDOC', 'TATELX', 'BEML', 'INDREN']
    for stock_code in st_codes:
        print(f"Running for:: {stock_code}")
        try:
            rsi_result = get_multi_rsi(breeze, stock_code=stock_code, exchange_code="NSE")
        except Exception as e:
            print(f"Some Error Occured for STOCK:: {stock_code}, Error: {e}")
    print("Multi-timeframe RSI for TCS:")
    # print(rsi_result)
