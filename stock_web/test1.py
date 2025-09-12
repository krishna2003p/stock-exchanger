import csv
import requests
from io import StringIO

# List of stock codes you're interested in
# ALL_STOCKS = [
#     "AADHOS", "AARIND", "ABB", "ABBIND", "ABBPOW", "ACMSOL", "ACTCON", "ADATRA", "ADAWIL", "ADIAMC", "AEGLOG",
#     "AFCINF", "AJAPHA", "AKUDRU", "ALKAMI", "ALKLAB", "ALSTD", "AMARAJ", "AMBCE", "AMIORG", "ANARAT", "APAIND",
#     "APLAPO", "ASHLEY", "ASTDM", "ASTPOL", "ATUL", "BAJHOU", "BALCHI", "BANBAN", "BASF", "BHADYN", "BHAELE",
#     "BHAFOR", "BHAHEX", "BIKFOO", "BIRCOR", "BLUDAR", "BOMBUR", "BRASOL", "BRIENT", "BSE", "CADHEA", "CAMACT",
#     "CAPPOI", "CAREVE", "CCLPRO", "CDSL", "CEINFO", "CERSAN", "CHEPET", "CITUNI", "CLESCI", "COALIN", "COCSHI",
#     "CONBIO", "CRAAUT", "CROGR", "CROGRE", "CYILIM", "DATPAT", "DCMSHR", "DEEFER", "DELLIM", "DIVLAB", "DOMIND",
#     "DRLAL", "ECLSER", "EIDPAR", "EMALIM", "EMCPHA", "ENDTEC", "ESCORT", "EXIIND", "FDC", "FINCAB", "FIRSOU",
#     "FSNECO", "GAIL", "GARREA", "GIC", "GLAPH", "GLELIF", "GLEPHA", "GLOHEA", "GODIGI", "GODPRO", "GOKEXP",
#     "GRAVIN", "GUJGA", "GUJPPL", "HAPMIN", "HBLPOW", "HDFAMC", "HILLTD", "HIMCHE", "HINAER", "HINCON", "HINCOP",
#     "HINDAL", "HINPET", "HONAUT", "HONCON", "HYUMOT", "IIFHOL", "IIFWEA", "INDBA", "INDLTD", "INDOVE", "INDR",
#     "INDRAI", "INDREN", "INFEDG", "INOIND", "INOWIN", "INTGEM", "INVKNO", "IPCLAB", "IRBINF", "IRCINT", "JAMKAS",
#     "JBCHEM", "JBMAUT", "JINSAW", "JINSP", "JINSTA", "JIOFIN", "JKCEME", "JMFINA", "JSWENE", "JSWHOL", "JSWINF",
#     "JYOCNC", "KALJEW", "KALPOW", "KANNER", "KARVYS", "KAYTEC", "KCPLTD", "KECIN", "KFITEC", "KIRBRO", "KIRENG",
#     "KPITE", "KPITEC", "KPRMIL", "KRIINS", "LATVIE", "LAULAB", "LEMTRE", "LIC", "LININ", "LLOMET", "LTOVER",
#     "LTTEC", "MAPHA", "MCX", "MININD", "MOLPAC", "MOTOSW", "MOTSU", "MUTFIN", "NARHRU", "NATALU", "NATPHA",
#     "NETTEC", "NEULAB", "NEWSOF", "NHPC", "NIVBUP", "NOCIL", "NTPGRE", "NUVWEA", "OBEREA", "OLAELE", "ORAFIN",
#     "ORIREF", "PAGIND", "PBFINT", "PEAGL", "PERSYS", "PGELEC", "PHICAR", "PHOMIL", "PIRPHA", "POLI", "PREENR",
#     "PREEST", "PVRLIM", "RAICHI", "RAICOR", "RAIVIK", "RAMFOR", "RATINF", "RAYLIF", "RELNIP", "RENSUG", "RITLIM",
#     "ROUMOB", "RRKAB", "RUCSOY", "RURELE", "SAIL", "SAILIF", "SAREIN", "SARENE", "SBFFIN", "SCHELE", "SHIME",
#     "SHRPIS", "SHYMET", "SIEMEN", "SIGI", "SKFIND", "SOLIN", "SONBLW", "STAHEA", "STYABS", "SUDCHE", "SUNFAS",
#     "SUNFIN", "SUNPHA", "SUPIND", "SWAENE", "SWILIM", "TATCOM", "TATELX", "TATTE", "TATTEC", "TBOTEK", "TECEEC",
#     "TECIND", "TECMAH", "TEJNET", "THERMA", "THICHE", "TATMOT", "TRILTD", "TUBIN", "TVSMOT", "UCOBAN", "UNIBAN",
#     "UNIP", "UNISPI", "UTIAMC", "VARBEV", "VARTEX", "VEDFAS", "VEDLIM", "VIJDIA", "VISMEG", "VOLTAS", "WAAENE",
#     "WABIND", "WELIND", "WHIIND", "WOCKHA", "XPRIND", "ZENTE", "ZOMLIM"
# ]
ALL_STOCKS = ['TCS']

# Download the CSV
url = "https://traderweb.icicidirect.com/Content/File/txtFile/ScripFile/StockScriptNew.csv"
response = requests.get(url)
response.raise_for_status()  # Ensure the download succeeded

# Parse CSV
data = csv.DictReader(StringIO(response.text))
stock_tokens = {}

def abc():
    for row in data:
        stock_code = row.get("SM", "").strip().upper()
        tk = row.get("TK", "").strip()
        ec = row.get("EC").strip().upper()
        if ec == "NSE" and stock_code in ALL_STOCKS and tk:
            return [f"4.1!{tk}"]

# Output result
print(f"Length of all stocks:: {len(ALL_STOCKS)}")
print(abc())
