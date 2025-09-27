import pandas as pd
import numpy as np
from datetime import datetime
import warnings
import os

warnings.filterwarnings('ignore')

class TradingViewIndicators:
    """
    TradingView-compatible RSI and EMA calculations with correct timing
    """
    
    @staticmethod
    def rsi(prices, period=14):
        """
        Calculate RSI using correct Wilder's smoothing method (TradingView compatible)
        
        Args:
            prices: pandas Series of closing prices
            period: RSI period (default 14)
            
        Returns:
            pandas Series with RSI values
        """
        delta = prices.diff()
        delta = delta.dropna()
        gains = delta.where(delta > 0, 0)
        losses = (-delta).where(delta < 0, 0)
        # period = 15

        # print(f"delta data:: {delta}")
        # print(f"gains data:: {gains}")
        # print(f"losses data:: {losses}")

        # Calculate initial averages using SMA
        avg_gain = gains.rolling(window=period, min_periods=period).mean()
        avg_loss = losses.rolling(window=period, min_periods=period).mean()

        # print(f"Initial avg_gain data:: {avg_gain}")
        # print(f"Initial avg_loss data:: {avg_loss}")


        # Apply Wilder's smoothing for subsequent periods
        for i in range(period, len(delta)):
            avg_gain.iloc[i] = (avg_gain.iloc[i-1] * (period - 1) + gains.iloc[i]) / period
            avg_loss.iloc[i] = (avg_loss.iloc[i-1] * (period - 1) + losses.iloc[i]) / period
        
        # Calculate RS and RSI
        rs = avg_gain / avg_loss
        rsi = 100 - (100 / (1 + rs))
        rsi = rsi.round(2)
        print(f"Completed RSI data:: {rsi}")
        return rsi
    
    @staticmethod
    def ema(prices, period):
        """
        Calculate EMA using TradingView's method
        
        Args:
            prices: pandas Series of closing prices
            period: EMA period
            
        Returns:
            pandas Series with EMA values
        """
        alpha = 2.0 / (period + 1)
        return prices.ewm(alpha=alpha, adjust=False, ).mean()
    
    @staticmethod
    def calculate_multi_timeframe_indicators(df, price_col='close'):
        """
        Calculate RSI and EMA for multiple timeframes (Daily, Weekly, Monthly)
        
        Args:
            df: pandas DataFrame with datetime index and OHLC data
            price_col: column name for closing prices (default 'close')
            
        Returns:
            pandas DataFrame with all calculated indicators
        """
        if not isinstance(df.index, pd.DatetimeIndex):
            raise ValueError("DataFrame must have DatetimeIndex")
        
        result_df = df.copy()
        
        # ==========================================
        # DAILY INDICATORS
        # ==========================================
        print("Calculating Daily indicators...")
        
        # Daily RSI
        result_df['RSI_D'] = TradingViewIndicators.rsi(df[price_col], 14)
        
        # Daily EMAs
        result_df['EMA_50_D'] = TradingViewIndicators.ema(df[price_col], 50)
        result_df['EMA_100_D'] = TradingViewIndicators.ema(df[price_col], 100)
        result_df['EMA_200_D'] = TradingViewIndicators.ema(df[price_col], 200)
        
        # ==========================================
        # WEEKLY INDICATORS
        # ==========================================
        print("Calculating Weekly indicators...")
        # Resample to weekly data (Monday close)
        weekly_ohlc = df.resample('W-MON', label='left', closed='left').agg({
            'open': 'first',
            'high': 'max',
            'low': 'min',
            price_col: 'last',
            'volume': 'sum' if 'volume' in df.columns else lambda x: x.iloc[0]
        }).dropna()
        
        # Weekly RSI
        weekly_rsi = TradingViewIndicators.rsi(weekly_ohlc[price_col], 14)
        
        # Weekly EMAs
        weekly_ema_50 = TradingViewIndicators.ema(weekly_ohlc[price_col], 50)
        weekly_ema_100 = TradingViewIndicators.ema(weekly_ohlc[price_col], 100)
        weekly_ema_200 = TradingViewIndicators.ema(weekly_ohlc[price_col], 200)
        
        # Forward fill weekly values to daily timeframe
        result_df['RSI_W'] = weekly_rsi.reindex(result_df.index, method='ffill')
        result_df['EMA_50_W'] = weekly_ema_50.reindex(result_df.index, method='ffill')
        result_df['EMA_100_W'] = weekly_ema_100.reindex(result_df.index, method='ffill')
        result_df['EMA_200_W'] = weekly_ema_200.reindex(result_df.index, method='ffill')

        # ==========================================
        # MONTHLY INDICATORS
        # ==========================================
        print("Calculating Monthly indicators...")
        # Resample to monthly data (month end)
        monthly_ohlc = df.resample('MS', label='left', closed='left').agg({
            'open': 'first',
            'high': 'max',
            'low': 'min',
            price_col: 'last',
            'volume': 'sum' if 'volume' in df.columns else lambda x: x.iloc[0]
        }).dropna()
        
        # Monthly RSI
        monthly_rsi = TradingViewIndicators.rsi(monthly_ohlc[price_col], 14)
        
        # Monthly EMAs
        monthly_ema_50 = TradingViewIndicators.ema(monthly_ohlc[price_col], 50)
        monthly_ema_100 = TradingViewIndicators.ema(monthly_ohlc[price_col], 100)
        monthly_ema_200 = TradingViewIndicators.ema(monthly_ohlc[price_col], 200)
        
        # Forward fill monthly values to daily timeframe
        result_df['RSI_M'] = monthly_rsi.reindex(result_df.index, method='ffill')
        result_df['EMA_50_M'] = monthly_ema_50.reindex(result_df.index, method='ffill')
        result_df['EMA_100_M'] = monthly_ema_100.reindex(result_df.index, method='ffill')
        result_df['EMA_200_M'] = monthly_ema_200.reindex(result_df.index, method='ffill')

        return result_df
    
    @staticmethod
    def add_trading_signals(df):
        """
        Add common trading signals based on RSI and EMA
        
        Args:
            df: DataFrame with calculated indicators
            
        Returns:
            DataFrame with additional signal columns
        """
        # Multi-timeframe RSI bullish signal (your existing strategy)
        df['rsi_bullish_signal'] = ((df['RSI_D'] > 58) & 
                                   (df['RSI_W'] > 58) & 
                                   (df['RSI_M'] > 58))
        
        # Multi-timeframe RSI bearish signal
        df['rsi_bearish_signal'] = ((df['RSI_D'] < 42) & 
                                   (df['RSI_W'] < 42) & 
                                   (df['RSI_M'] < 42))
        
        # EMA trend signals
        df['ema_bullish_trend'] = ((df['close'] > df['EMA_50_D']) & 
                                  (df['EMA_50_D'] > df['EMA_100_D']) & 
                                  (df['EMA_100_D'] > df['EMA_200_D']))
        
        df['ema_bearish_trend'] = ((df['close'] < df['EMA_50_D']) & 
                                  (df['EMA_50_D'] < df['EMA_100_D']) & 
                                  (df['EMA_100_D'] < df['EMA_200_D']))
        
        # Combined signals (RSI + EMA trend)
        df['strong_buy_signal'] = (df['rsi_bullish_signal'] & df['ema_bullish_trend'])
        df['strong_sell_signal'] = (df['rsi_bearish_signal'] & df['ema_bearish_trend'])
        
        return df

def load_and_process_data(file_path, datetime_col='datetime'):
    """
    Load CSV file and prepare it for indicator calculation
    
    Args:
        file_path: path to CSV file
        datetime_col: name of datetime column
        
    Returns:
        pandas DataFrame ready for processing
    """
    print(f"Loading data from {file_path}...")
    
    # Load data
    df = pd.read_csv(file_path)
    
    # Convert datetime and set as index
    df[datetime_col] = pd.to_datetime(df[datetime_col])
    df.set_index(datetime_col, inplace=True)
    
    # Keep only OHLCV columns
    required_cols = ['open', 'high', 'low', 'close']
    optional_cols = ['volume']
    available_cols = required_cols + [col for col in optional_cols if col in df.columns]
    df_clean = df[available_cols].copy()
    
    # print(f"Data loaded: {len(df_clean)} rows from {df_clean.index[0].date()} to {df_clean.index[-1].date()}")
    return df_clean

def main():
    """
    Main function to process the data and calculate indicators
    """
    print("TradingView Indicators Calculator (FIXED VERSION)")
    print("=" * 50)
    print()
    
    # Configuration
    home_dir = os.path.expanduser("~")
    print(f"Home directory: {home_dir}")
    input_file = os.path.join(home_dir, 'Documents', 'Stock_Market', 'nifty_500', '1_day_data', 'ZOMLIM.csv')
    output_file = os.path.join(home_dir, 'Documents', 'Stock_Market', 'ZOMLIM_RESULT.csv')
    
    try:
        # Load and prepare data
        df = load_and_process_data(input_file)

        # data = {
        #     'datetime': [
        #         '23/07/21 12:07', '26/07/21 12:07', '27/07/21 12:07', '28/07/21 12:07',
        #         '29/07/21 12:07', '30/07/21 12:07', '02/08/21 12:08', '03/08/21 12:08',
        #         '04/08/21 12:08', '05/08/21 12:08', '06/08/21 12:08', '09/08/21 12:08',
        #         '10/08/21 12:08', '11/08/21 12:08', '12/08/21 12:08', '13/08/21 12:08',
        #         '16/08/21 12:08', '17/08/21 12:08', '18/08/21 12:08', '20/08/21 12:08',
        #         '23/08/21 12:08', '24/08/21 12:08', '25/08/21 12:08', '26/08/21 12:08',
        #         '27/08/21 12:08', '30/08/21 12:08', '31/08/21 12:08'
        #     ],
        #     'open': [
        #         116, 126.35, 141.7, 131, 134.95, 142.6, 135.75, 137, 139.8, 138.75,
        #         135.5, 132.4, 131, 123, 135.65, 133.85, 136.4, 132.8, 134.5, 134.95,
        #         137.8, 127.25, 126, 125.25, 126.6, 127.85, 134
        #     ],
        #     'high': [
        #         138.9, 143.75, 147.8, 135, 144, 142.7, 140.75, 140.8, 141, 138.9,
        #         136.2, 133.55, 131.45, 138.75, 137.4, 139.75, 136.9, 134.35, 136.8,
        #         141.45, 137.8, 127.95, 128.5, 127.15, 129.5, 135.45, 135.2
        #     ],
        #     'low': [
        #         115, 125.3, 127.75, 123.55, 132.2, 131, 135.15, 137, 135.25, 132,
        #         130.1, 127.25, 122.1, 123, 132.05, 132.1, 132.25, 130.6, 133.3,
        #         133, 124.75, 120.5, 123.1, 124.35, 124.1, 127.55, 131.35
        #     ],
        #     'close': [
        #         126, 140.65, 132.9, 131.2, 141.55, 133.5, 139.7, 139.4, 138.4, 134.95,
        #         131.35, 130.6, 125.2, 135.65, 135.45, 137.35, 134.95, 132.5, 134.95,
        #         139.3, 127.25, 125, 124.25, 125.85, 124.7, 133.55, 134.55
        #     ],
        #     'volume': [
        #         694895290, 249723854, 240341900, 159793731, 117973089, 88312522, 66909732,
        #         46610001, 41134419, 38437134, 31975356, 41358299, 43164004, 111702781,
        #         51256670, 33674300, 20305361, 15815187, 22566920, 53789580, 68470861,
        #         56713556, 51078811, 20645403, 22227595, 45239080, 24640924
        #     ]
        # }

        # # Create DataFrame and set datetime
        # df = pd.DataFrame(data)
        # df['datetime'] = pd.to_datetime(df['datetime'], format='%d/%m/%y %H:%M')
        # df.set_index('datetime', inplace=True)
        
        # Calculate all indicators
        print("\nCalculating TradingView indicators...")
        df_with_indicators = TradingViewIndicators.calculate_multi_timeframe_indicators(df)
        
        # Add trading signals
        print("Adding trading signals...")
        df_final = TradingViewIndicators.add_trading_signals(df_with_indicators)
        
        # Display summary
        print("\n" + "=" * 50)
        print("CALCULATION SUMMARY (FIXED VERSION)")
        print("=" * 50)
        
        # Count non-null values
        indicator_counts = {}
        indicator_cols = [col for col in df_final.columns if any(x in col for x in ['RSI', 'EMA'])]
        
        for col in indicator_cols:
            count = df_final[col].notna().sum()
            indicator_counts[col] = count
        
        # print(f"Total trading days: {len(df_final)}")
        print("\nIndicator availability:")
        for indicator, count in indicator_counts.items():
            print(f"  {indicator}: {count} values")
        
        # Show first valid dates
        print("\nFirst valid indicator dates:")
        for col in ['RSI_D', 'RSI_W', 'RSI_M', 'EMA_200_D']:
            if col in df_final.columns:
                first_valid = df_final[col].first_valid_index()
                if first_valid:
                    print(f"  {col}: {first_valid.strftime('%Y-%m-%d')}")
        
        # Show sample data
        print("\nSample data (last 10 days):")
        sample_cols = ['close', 'RSI_D', 'RSI_W', 'RSI_M', 'EMA_200_D', 'rsi_bullish_signal']
        available_sample_cols = [col for col in sample_cols if col in df_final.columns]
        sample_data = df_final[available_sample_cols].tail(10)
        
        for idx, row in sample_data.iterrows():
            date = idx.strftime('%Y-%m-%d')
            close = row['close']
            rsi_d = row['RSI_D'] if pd.notna(row['RSI_D']) else 'NaN'
            rsi_w = row['RSI_W'] if pd.notna(row['RSI_W']) else 'NaN'
            rsi_m = row['RSI_M'] if pd.notna(row['RSI_M']) else 'NaN'
            signal = 'BUY' if row.get('rsi_bullish_signal', False) else 'WAIT'
            
            if isinstance(rsi_d, float):
                rsi_d = f"{rsi_d:.1f}"
            if isinstance(rsi_w, float):
                rsi_w = f"{rsi_w:.1f}"
            if isinstance(rsi_m, float):
                rsi_m = f"{rsi_m:.1f}"
                
            print(f"  {date}: Close={close:7.2f}, RSI_D={rsi_d:>5s}, RSI_W={rsi_w:>5s}, RSI_M={rsi_m:>5s} → {signal}")
        
        # Save results
        df_final.to_csv(output_file)
        print(f"\nResults saved to: {output_file}")
        print(f"File contains {len(df_final)} rows and {len(df_final.columns)} columns")
        
        # Show column list
        print("\nGenerated columns:")
        for i, col in enumerate(df_final.columns):
            print(f"  {i+1:2d}. {col}")
        
        return df_final
    
    except Exception as e:
        print(f"Error: {str(e)}")
        return None

if __name__ == "__main__":
    # Run the main function
    result_df = main()