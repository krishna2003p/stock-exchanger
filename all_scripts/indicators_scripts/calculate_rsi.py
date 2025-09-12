import os
import pandas as pd
from datetime import datetime
import ta
import traceback

# Define your data folder path
data_dir = os.path.join(os.path.expanduser("~"), "Documents", "Stock_Market", "nifty_500", "5_minute_data")

def process_file(file_path):
    try:
        df = pd.read_csv(file_path, parse_dates=['datetime'], index_col='datetime')
        
        # Ensure numeric types
        for col in ["open", "high", "low", "close", "volume"]:
            df[col] = pd.to_numeric(df[col], errors='coerce')
        df.dropna(subset=["close"], inplace=True)
        
        # DAILY INDICATORS on resampled daily data
        daily = df.resample('D').agg({
            "open": "first",
            "high": "max",
            "low": "min",
            "close": "last",
            "volume": "sum"
        }).dropna()
        
        daily["RSI_D"] = ta.momentum.RSIIndicator(daily["close"], window=14).rsi()
        daily["EMA_50_D"] = ta.trend.EMAIndicator(daily["close"], window=50).ema_indicator()
        daily["EMA_100_D"] = ta.trend.EMAIndicator(daily["close"], window=100).ema_indicator()
        daily["EMA_200_D"] = ta.trend.EMAIndicator(daily["close"], window=200).ema_indicator()
        
        # WEEKLY INDICATORS
        weekly = df.resample('W').agg({
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
        
        # MONTHLY INDICATORS (using 'ME' as month end frequency)
        monthly = df.resample('ME').agg({
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
        
        daily_indicators = daily.filter(like='_D').reindex(df.index, method='ffill')
        weekly_indicators = weekly.filter(like='_W').reindex(df.index, method='ffill')
        monthly_indicators = monthly.filter(like='_M').reindex(df.index, method='ffill')
  
        # Drop overlapping indicator columns if they exist in original df (to avoid join conflicts)
        cols_to_drop = [
            'RSI_D', 'EMA_50_D', 'EMA_100_D', 'EMA_200_D',
            'RSI_W', 'EMA_50_W', 'EMA_100_W', 'EMA_200_W',
            'RSI_M', 'EMA_50_M', 'EMA_100_M', 'EMA_200_M',
        ]
        df.drop(columns=[c for c in cols_to_drop if c in df.columns], inplace=True)
        # Join the reindexed indicator columns
        df = df.join(daily_indicators).join(weekly_indicators).join(monthly_indicators)

        # Forward fill remaining NaNs (using recommended .ffill())
        df.ffill(inplace=True)

        next_col_drop = ['product_type','expiry_date','right','strike_price','open_interest']
        for col in next_col_drop:
            if col in df.columns:
                df = df.drop(columns=[col])

        # Reset index to save datetime as a column
        df.reset_index(inplace=True)
        
        # Save updated dataframe back to same CSV file (overwrite)
        df.to_csv(file_path, index=False)
        print(f"✅ Updated and saved data for {os.path.basename(file_path)}")
    
    except Exception as e:
        print(f"❌ Error processing {os.path.basename(file_path)}: {e}")
        traceback.print_exc()

def main():
    data = ['DIVLAB.csv', 'HOMFIR.csv', 'MININD.csv', 'TECMAH.csv', 'JKTYRE.csv', 'ADAGAS.csv', 'ZENTE.csv', 'ABBIND.csv', 'DRLAL.csv', 'MAXHEA.csv', 'FAGBEA.csv', 'VEDFAS.csv', 'FINCAB.csv', 'STABAN.csv', 'COCSHI.csv', 'PRAIN.csv', 'MOTOSW.csv', 'AMBEN copy.csv', 'CARUNI.csv', 'MAGFI.csv', 'INDRAI.csv', 'SHRCEM.csv', 'RUCSOY.csv', 'MRFTYR.csv', 'SOLIN.csv', 'LLOMET.csv', 'BAAUTO.csv', 'LININ.csv', 'IPCLAB.csv', 'ASIPAI.csv', 'TBOTEK.csv', 'EIDPAR.csv', 'SWAENE.csv', 'BLUSTA.csv', 'JAMKAS.csv', 'FININD.csv', 'ALOIND.csv', 'EICMOT.csv', 'SAGINI.csv', 'BHAPET.csv', 'STEWIL.csv', 'INDGAS.csv', 'NETTEC.csv', 'POWGRI.csv', 'MAXFIN.csv', 'ENDTEC.csv', 'COALIN.csv', 'ROUMOB.csv', 'GARREA.csv', 'GUJGA.csv', 'GNFC.csv', 'ABBPOW.csv', 'SCHELE.csv', 'BAJFI.csv', '3MIND.csv', 'IIFHOL.csv', 'SAPFOO.csv', 'ADAPOW.csv', 'ASTPOL.csv', 'AMARAJ.csv', 'WESDEV.csv', 'WHIIND.csv', 'CASIND.csv', 'INDOVE.csv', 'FEDBAN.csv', 'CHAHOT.csv', 'GOLTEL.csv', 'PUNBAN.csv', 'CORINT.csv', 'GSPL.csv', 'HINCOP.csv', 'HAPMIN.csv', 'MARUTI.csv', 'SUNFIN.csv', 'GILIND.csv', 'JUBFOO.csv', '.DS_Store', 'MUTFIN.csv', 'PETLNG.csv', 'CERSAN.csv', 'MRPL.csv', 'KPITE.csv', 'KRIINS.csv', 'TRAREC.csv', 'ADAPOR.csv', 'GESHIP.csv', 'NATMIN.csv', 'VARTEX.csv', 'CENPLY.csv', 'BAJHOL.csv', 'MOTSU.csv', 'LAULAB.csv', 'AEGLOG.csv', 'INTGEM.csv', 'COMENG.csv', 'SBFFIN.csv', 'HIMFUT.csv', 'ALEPHA.csv', 'RAICOR.csv', 'RAMFOR.csv', 'GLELIF.csv', 'WIPRO.csv', 'NHPC.csv', 'APAIND.csv', 'HUDCO.csv', 'SKFIND.csv', 'ESCORT.csv', 'PREENR.csv', 'WELIND.csv', 'AIAENG.csv', 'TATTEC.csv', 'GUJFLU.csv', 'AARIND.csv', 'INDIBA.csv', 'ADIFAS.csv', 'SAREIN.csv', 'NARHRU.csv', 'FIRSOU.csv', 'ACMSOL.csv', 'KPITEC.csv', 'UCOBAN.csv', 'ELGEQU.csv', 'EIHLIM.csv', 'RADKHA.csv', 'KECIN.csv', 'ACTCON.csv', 'CYILIM.csv', 'RATINF.csv', 'GLAPHA.csv', 'PIRENT.csv', 'BAYIND.csv', 'VISMEG.csv', 'CAPGLO.csv', 'KANNER.csv', 'CROGR.csv', 'NTPC.csv', 'LATVIE.csv', 'HONAUT.csv', 'IRBINF.csv', 'CDSL.csv', 'BRASOL.csv', 'PFIZER.csv', 'NETW18.csv', 'ADICAP.csv', 'DCMSHR.csv', 'BHAINF.csv', 'RENSUG.csv', 'SUNTV.csv', 'AFCINF.csv', 'PHICAR.csv', 'TUBIN.csv', 'ANARAJ.csv', 'SWILIM.csv', 'KEIIND.csv', 'PTCIN.csv', 'ONGC.csv', 'LTTEC.csv', 'HONCON.csv', 'BERPAI.csv', 'ITI.csv', 'CANHOM.csv', 'DEEFER.csv', 'OBEREA.csv', 'INDHOT.csv', 'JSWINF.csv', 'POLMED.csv', 'GODPHI.csv', 'SUNPHA.csv', 'CONBIO.csv', 'GLEPHA.csv', 'AAVFIN.csv', 'ALSTD.csv', 'HINDAL.csv', 'MAHMAH.csv', 'AMBEN.csv', 'NEULAB.csv', 'INFTEC.csv', 'ADAGRE.csv', 'ASHLEY.csv', 'LICHF.csv', 'NAGCON.csv', 'TCS.csv', 'BOSLIM.csv', 'CAREVE.csv', 'GRANUL.csv', 'CHOINV.csv', 'PAGIND.csv', 'CANBAN.csv', 'MACDEV.csv', 'BANBAN.csv', 'TATPOW.csv', 'BSE.csv', 'BRIENT.csv', 'PNBHOU.csv', 'SUVPH.csv', 'DBREAL.csv', 'JUBING.csv', 'BIKFOO.csv', 'HINAER.csv', 'MAHSEA.csv', 'MASTEK.csv', 'JBCHEM.csv', 'ZEEENT.csv', 'AADHOS.csv', 'TITIND.csv', 'DEVIN.csv', 'HEG.csv', 'BHAELE.csv', 'BASF.csv', 'ASAIND.csv', 'AVESUP.csv', 'TATCOM.csv', 'THERMA.csv', 'COLPAL.csv', 'KFITEC.csv', 'KALPOW.csv', 'PVRLIM.csv', 'TATMOT.csv', 'RAYMON.csv', 'GLOHEA.csv', 'VARBEV.csv', 'INTAVI.csv', 'TRENT.csv', 'APOHOS.csv', 'JUBLIF.csv', 'RAIVIK.csv', 'CAPPOI.csv', 'BIOCON.csv', 'RCF.csv', 'SIEMEN.csv', 'DATPAT.csv', 'RURELE.csv', 'SOBDEV.csv', 'INDBA.csv', 'LIC.csv', 'ELEENG.csv', 'MAHFIN.csv', 'NEWIN.csv', 'INDCEM.csv', 'TATINV.csv', 'NAVBHA.csv', 'KPRMIL.csv', 'MINERA.csv', 'MPHLIM.csv', 'ADIAMC.csv', 'CITUNI.csv', 'TUBINV.csv', 'CRISIL.csv', 'LARTOU.csv', 'JUSDIA.csv', 'MAHGAS.csv', 'POLI.csv', 'SUNFAS.csv', 'SUPIND.csv', 'CLESCI.csv', 'HDFAMC.csv', 'CHEPET.csv', 'CUMIND.csv', 'LTFINA.csv', 'KALJEW.csv', 'AURPHA.csv', 'JBMAUT.csv', 'NATALU.csv', 'IIFL26.csv', 'MARLIM.csv', 'YESBAN.csv', 'TECEEC.csv', 'DABIND.csv', 'AKUDRU.csv', 'OILIND.csv', 'ASTDM.csv', 'BANBAR.csv', 'CONCOR.csv', 'INVKNO.csv', 'CROGRE.csv', 'USHMA.csv', 'KAJCER.csv', 'SARENE.csv', 'ONE97.csv', 'NUVWEA.csv', 'EMCPHA.csv', 'ANARAT.csv', 'ASTPHA.csv', 'SIGI.csv', 'CAMACT.csv', 'REDIND.csv', 'INFEDG.csv', 'BRIIND.csv', 'BAFINS.csv', 'HBLPOW.csv', 'IIFL27.csv', 'TORPOW.csv', 'JINSP.csv', 'CENBAN.csv', 'INDOIL.csv', 'WAAENE.csv', 'SBILIF.csv', 'PIRPHA.csv', 'KAYTEC.csv', 'BOMBUR.csv', 'TRILTD.csv', 'PNCINF.csv', 'MAZDOC.csv', 'NTPGRE.csv', 'MANAFI.csv', 'FACT.csv', 'NMDSTE.csv', 'UNIP.csv', 'MCX.csv', 'CEAT.csv', 'GUJMI.csv', 'PREEST.csv', 'INDLTD.csv', 'FIVSTA.csv', 'PERSYS.csv', 'CIPLA.csv', 'HINPET.csv', 'GODAGR.csv', 'ACC.csv', 'ORIREF.csv', 'ORAFIN.csv', 'GODPRO.csv', 'VEDLIM.csv', 'IIFWEA.csv', 'JKCEME.csv', 'ITC.csv', 'JAIPOW.csv', 'IFCI.csv', 'CHAFER.csv', 'HYUMOT.csv', 'AFFIND.csv', 'RAYLIF.csv', 'WOCKHA.csv', 'FSNECO.csv', 'DOMIND.csv', 'CADHEA.csv', 'NESIND.csv', 'INTDES.csv', 'UTIAMC.csv', 'SAIL.csv', 'SJVLIM.csv', 'BALCHI.csv', 'IDECEL.csv', 'GMRINF.csv', 'MAHN16.csv', 'CENTEX.csv', 'ATUL.csv', 'ABB.csv', 'SRF.csv', 'EXIIND.csv', 'HINZIN.csv', 'ADATRA.csv', 'STAHEA.csv', 'JYOLAB.csv', 'TATELX.csv', 'GODIGI.csv', 'BHAHEX.csv', 'GAIL.csv', 'RAICHI.csv', 'KNRCON.csv', 'GRAVIN.csv', 'VOLTAS.csv', 'TATGLO.csv', 'NBCC.csv', 'APTVAL.csv', 'TATTE.csv', 'ALKAMI.csv', 'SBICAR.csv', 'DEENIT.csv', 'PBFINT.csv', 'COMAGE.csv', 'DELLIM.csv', 'NEWSOF.csv', 'INDREN.csv', 'VGUARD.csv', 'JSWENE.csv', 'POWFIN.csv', 'IDBI.csv', 'UNIBAN.csv', 'PHOMIL.csv', 'BAJHOU.csv', 'AXIBAN.csv', 'INDMAR.csv', 'SHYMET.csv', 'RITLIM.csv', 'APLAPO.csv', 'FORHEA.csv', 'ICILOM.csv', 'LTINFO.csv', 'NAVFLU.csv', 'SAILIF.csv', 'TATCHE.csv', 'INDR.csv', 'RBLBAN.csv', 'SHRTRA.csv', 'TVSMOT.csv', 'CCLPRO.csv', 'METHEA.csv', 'RRKAB.csv', 'ADAWIL.csv', 'GUJPPL.csv', 'BANMAH.csv', 'CEINFO.csv', 'ENGIND.csv', 'WABIND.csv', 'ODICEM.csv', 'GRASIM.csv', 'BALIND.csv', 'INOIND.csv', 'PIDIND.csv', 'PIIND.csv', 'ALKLAB.csv', 'RAMCEM.csv', 'LEMTRE.csv', 'SUZENE.csv', 'SYRTEC.csv', 'GODCON.csv', 'MOTSUM.csv', 'NATPHA.csv', 'ADAENT.csv', 'HCLTEC.csv', 'ICIPRU.csv', 'BHEL.csv', 'SCI.csv', 'KOTMAH.csv', 'KARVYS.csv', 'OLAELE.csv', 'UNISPI.csv', 'TANSOL.csv', 'CRAAUT.csv', 'AMBCE.csv', 'BLUDAR.csv', 'BATIND.csv', 'IDFBAN.csv', 'HDFBAN.csv', 'BHAFOR.csv', 'INDHO.csv', 'WELCOR.csv', 'GODIND.csv', 'BHADYN.csv', 'HERHON.csv', 'MAPHA.csv', 'SONSOF.csv', 'BANIND.csv', 'RELIND.csv', 'CREGRA.csv', 'IRCINT.csv', 'KIRBRO.csv', 'AUSMA.csv', 'JSWHOL.csv', 'RELNIP.csv', 'ICIBAN.csv', 'KIRENG.csv', 'TRITUR.csv', 'HDFSTA.csv', 'DIXTEC.csv', 'APOTYR.csv', 'NEYLIG.csv', 'HDFWA2.csv', 'BLSINT.csv', 'JINSAW.csv', 'JINSTA.csv', 'MINCOR.csv', 'SYNINT.csv', 'TORPHA.csv', 'SONBLW.csv', 'ADIWA1.csv', 'ERILIF.csv', 'DRREDD.csv', 'DLFLIM.csv', 'TIMIND.csv', 'ECLSER.csv', 'ANGBRO.csv', 'AJAPHA.csv', 'HINLEV.csv', 'JYOCNC.csv', 'CESC.csv', 'JIOFIN.csv', 'LTOVER.csv', 'TATSTE.csv', 'UNIBR.csv', 'NIVBUP.csv', 'JMFINA.csv', 'RELPOW.csv', 'JSWSTE.csv', 'ULTCEM.csv', 'TITWAG.csv', 'HAVIND.csv', 'BEML.csv', 'GIC.csv', 'INDEN.csv', 'TRIENG.csv', 'BHAAIR.csv', 'TEJNET.csv', 'PGELEC.csv', 'GODPOW.csv', 'HIMCHE.csv']
    for filename in data:
        file_path = os.path.join(data_dir, filename)
        process_file(file_path)
            # print('Executing')

if __name__ == "__main__":
    main()
