import pandas as pd
import os, sys
import glob

folder_path = os.path.join(os.path.expanduser("~"),"Documents","Stock_Market","nifty_500","1_minute_data")
# print(folder_path)
# sys.exit()

# def read_csv_file(file_path):
#     url = os.path.join(folder_path,file_path)
#     df = pd.read_csv(url)
#     return df.iloc[0]['datetime'], df.iloc[-1]['datetime']

rem_file = []
com_file = []
for file in os.listdir(folder_path):
    # first,last = read_csv_file(file)
    # print(f"File:: {file} ===> First Row:: {first}, Second Row:: {last}")
    file = file.removesuffix(".csv")
    
    # csv_files = glob.glob(f'/Users/apple/Documents/Stock_Market/nifty_500/1_minute_rem/{file}*.csv')
    # if len(csv_files) == 0:
    #     rem_file.append(file)
    # else:
    #     com_file.append(file)
    # print(csv_files)

# print(f"Not Found File:: {rem_file}")
# print(f"Matched File:: {com_file}")

# stocks = ['MININD', 'VEDFAS', 'MAGFI', 'LLOMET', 'TBOTEK', 'SAGINI', 'NETTEC', 'IIFHOL', 'SAPFOO', 'INTGEM', 'COMENG', 'SBFFIN', 'GLELIF', 'PREENR', 'TATTEC', 'ACMSOL', 'VISMEG', 'LATVIE', 'BRASOL', 'AFCINF', 'PHICAR', 'SWILIM', 'PTCIN', 'HONCON', 'JSWINF', 'CONBIO', 'BIKFOO', 'AADHOS', 'DEVIN', 'KFITEC', 'GLOHEA', 'DATPAT', 'NAVBHA', 'ADIAMC', 'IIFL26', 'AKUDRU', 'INVKNO', 'ONE97', 'NUVWEA', 'EMCPHA', 'ANARAT', 'SIGI', 'CAMACT', 'IIFL27', 'WAAENE', 'PIRPHA', 'KAYTEC', 'NTPGRE', 'NMDSTE', 'INDLTD', 'FIVSTA', 'HYUMOT', 'RAYLIF', 'FSNECO', 'DOMIND', 'MAHN16', 'STAHEA', 'GODIGI', 'BHAHEX', 'RAICHI', 'APTVAL', 'PBFINT', 'DELLIM', 'INDREN', 'BAJHOU', 'SAILIF', 'RRKAB', 'ADAWIL', 'CEINFO', 'WABIND', 'INOIND', 'SYRTEC', 'OLAELE', 'MAPHA', 'ADIWA1', 'ANGBRO', 'JYOCNC', 'JIOFIN', 'NIVBUP']
# print(len(stocks))


a = ['IRBINF.csv', 'INDREN.csv', 'WELIND.csv', 'SOLIN.csv', 'DOMIND.csv', 'TBOTEK.csv', 'AEGLOG.csv', 'IRCINT.csv', 'SUPIND.csv', 'TRILTD.csv', 'JKCEME.csv', 'GLELIF.csv', 'SARENE.csv', 'DATPAT.csv', 'PERSYS.csv', 'INDBA.csv', 'ADAWIL.csv', 'CADHEA.csv', 'UNIBAN.csv', 'RUCSOY.csv', 'VOLTAS.csv', 'KANNER.csv', 'BHADYN.csv', 'HIMCHE.csv', 'UNISPI.csv', 'KRIINS.csv', 'GLAPH.csv', 'GOKEXP.csv', 'GODPRO.csv', 'INOWIN.csv', 'ECLSER.csv', 'KARVYS.csv', 'STAHEA.csv', 'VISMEG.csv', 'PREEST.csv', 'HONCON.csv', 'KECIN.csv', 'CRAAUT.csv', 'BHAFOR.csv', 'CEINFO.csv', 'WOCKHA.csv', 'NETTEC.csv', 'PREENR.csv', 'THICHE.csv', 'HINPET.csv', 'TECMAH.csv', 'CCLPRO.csv', 'GRAVIN.csv', 'UTIAMC.csv', 'NOCIL.csv', 'JBCHEM.csv', 'KIRENG.csv', 'RURELE.csv', 'TATELX.csv', 'RAICHI.csv', 'POLI.csv', 'LATVIE.csv', 'MAPHA.csv', 'LLOMET.csv', 'SUNPHA.csv', 'NIVBUP.csv', 'ALKAMI.csv', 'KPRMIL.csv', 'ABB.csv', 'BALCHI.csv', 'JINSTA.csv', 'LTOVER.csv', 'CITUNI.csv', 'DRLAL.csv', 'HINCON.csv', 'APAIND.csv', 'INTGEM.csv', 'KALJEW.csv', 'COALIN.csv', 'NTPGRE.csv', 'SBFFIN.csv', 'EXIIND.csv', 'SIEMEN.csv', 'JAMKAS.csv', 'CLESCI.csv', 'INVKNO.csv', 'SAREIN.csv', 'IIFWEA.csv', 'GIC.csv', 'ABBIND.csv', 'NATPHA.csv', 'BLUDAR.csv', 'ROUMOB.csv', 'TATTEC.csv', 'PIRPHA.csv', 'PVRLIM.csv', 'JIOFIN.csv', 'ENDTEC.csv', 'BRIENT.csv', 'LIC.csv', 'GLEPHA.csv', 'SUNFIN.csv', 'DIVLAB.csv', 'BANBAN.csv', 'CERSAN.csv', 'SAILIF.csv', 'ESCORT.csv', 'AMARAJ.csv', 'NHPC.csv', 'VEDLIM.csv', 'PGELEC.csv', 'GAIL.csv', 'MININD.csv', 'PAGIND.csv', 'TATCOM.csv', 'UNIP.csv', 'MOTOSW.csv', 'INDOVE.csv', 'INDR.csv', 'TECEEC.csv', 'PBFINT.csv', 'INDRAI.csv', 'KAYTEC.csv', 'BRASOL.csv', 'SHIME.csv', 'HINDAL.csv', 'CROGR.csv', 'COCSHI.csv', 'STYABS.csv', 'JYOCNC.csv', 'RAIVIK.csv', 'BHAHEX.csv', 'INOIND.csv', 'HINCOP.csv', 'SCHELE.csv', 'JSWENE.csv', 'SHYMET.csv', 'AFCINF.csv', 'ALKLAB.csv', 'MCX.csv', 'ORAFIN.csv', 'ZOMLIM.csv', 'NEWSOF.csv', 'PEAGL.csv', 'HBLPOW.csv', 'ACTCON.csv', 'AARIND.csv', 'HYUMOT.csv', 'EMCPHA.csv', 'ACMSOL.csv', 'GUJGA.csv', 'NATALU.csv', 'DEEFER.csv', 'LEMTRE.csv', 'XPRIND.csv', 'GLOHEA.csv', 'CONBIO.csv', 'BIRCOR.csv', 'KPITEC.csv', 'VARTEX.csv', 'APLAPO.csv', 'PHOMIL.csv', 'UCOBAN.csv', 'LININ.csv', 'EIDPAR.csv', 'THERMA.csv', 'HDFAMC.csv', 'IIFHOL.csv', 'AMBCE.csv', 'IPCLAB.csv', 'CAREVE.csv', 'CDSL.csv', 'DELLIM.csv', 'TUBIN.csv', 'OLAELE.csv', 'TECIND.csv', 'NARHRU.csv', 'FINCAB.csv', 'RAMFOR.csv', 'VEDFAS.csv', 'CAPPOI.csv', 'FDC.csv', 'ASTDM.csv', 'ALSTD.csv', 'KCPLTD.csv', 'SHRPIS.csv', 'MUTFIN.csv', 'RITLIM.csv', 'RENSUG.csv', 'CHEPET.csv', 'SIGI.csv', 'WAAENE.csv', 'SWAENE.csv', 'ADIAMC.csv', 'MOLPAC.csv', 'HINAER.csv', 'NEULAB.csv', 'CROGRE.csv', 'AMIORG.csv', 'RAYLIF.csv', 'ADATRA.csv', 'HONAUT.csv', 'SUDCHE.csv', 'KPITE.csv', 'JINSP.csv', 'HAPMIN.csv', 'TMLDVR.csv', 'AADHOS.csv', 'BIKFOO.csv', 'BASF.csv', 'SKFIND.csv', 'INFEDG.csv', 'BHAELE.csv', 'BOMBUR.csv', 'RAICOR.csv', 'SAIL.csv', 'SUNFAS.csv', 'FSNECO.csv', 'RATINF.csv', 'AKUDRU.csv', 'ASHLEY.csv', 'HILLTD.csv', 'BSE.csv', 'JSWINF.csv', 'ABBPOW.csv', 'WABIND.csv', 'WHIIND.csv', 'EMALIM.csv', 'PHICAR.csv', 'GODIGI.csv', 'BAJHOU.csv', 'ZENTE.csv', 'DCMSHR.csv', 'JBMAUT.csv', 'LTTEC.csv', 'MOTSU.csv', 'LAULAB.csv', 'CAMACT.csv', 'KFITEC.csv', 'RELNIP.csv', 'AJAPHA.csv', 'JSWHOL.csv', 'SWILIM.csv', 'OBEREA.csv', 'ORIREF.csv', 'JMFINA.csv', 'GARREA.csv', 'CYILIM.csv', 'TATTE.csv', 'RRKAB.csv', 'ATUL.csv', 'ANARAT.csv', 'KALPOW.csv', 'KIRBRO.csv', 'TVSMOT.csv', 'VIJDIA.csv', 'NUVWEA.csv', 'GUJPPL.csv', 'JINSAW.csv', 'SONBLW.csv', 'ASTPOL.csv', 'INDLTD.csv', 'FIRSOU.csv', 'TEJNET.csv', 'VARBEV.csv']
b = []
for n in a:
    n = n.removesuffix(".csv")
    b.append(n)

print(b)
# path = os.path.abspath(os.path.curdir)
# print(path)
# print(os.path.abspath(__file__))