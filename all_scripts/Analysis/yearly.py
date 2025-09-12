import pandas as pd
import os

home = os.path.expanduser("~")
folder_path = os.path.join(home, "Documents", "Stock_Market", "final_stock", "case6")
output_yearly_path = os.path.join(home, "Documents", "Stock_Market", "Final_Result", "new_output", "master_file_case6_yearly.xlsx")
output_stockwise_path = os.path.join(home, "Documents", "Stock_Market", "Final_Result", "new_output", "master_file_case6_stockwise.xlsx")


def process_file(file_path):
    df = pd.read_csv(file_path)
    df.columns = [col.replace('₹', '').replace('‚Çπ', '').strip() for col in df.columns]

    df = df.rename(columns={
        'Profit/Loss': 'Profit/Loss',
        'Capital After Trade': 'Capital After Trade',
        'Deposit This Trade': 'Deposit This Trade',
        'Total Deposits': 'Total Deposits',
        'Net Investment': 'Net Investment'
    })

    df['Entry Date'] = pd.to_datetime(df['Entry Date'], dayfirst=True, errors='coerce')
    df['Exit Date'] = pd.to_datetime(df['Exit Date'], dayfirst=True, errors='coerce')
    df = df.dropna(subset=['Entry Date', 'Exit Date'])

    df['Entry Year'] = df['Entry Date'].dt.year
    df['Exit Year'] = df['Exit Date'].dt.year
    
    # How many years trade is held
    df['Holding Years'] = df['Exit Year'] - df['Entry Year'] + 1
    
    # Holding profit/loss per year
    df['Hold'] = df['Profit/Loss'] / df['Holding Years']
    df['Hold Loss'] = df['Hold'].apply(lambda x: x if x < 0 else 0)

    stock_name = os.path.basename(file_path).replace('_backtest(58).csv', '')
    rows = []

    for _, row in df.iterrows():
        # Expand rows for each holding year
        for year in range(row['Entry Year'], row['Exit Year'] + 1):
            rows.append({
                'Year': year,
                'Hold': row['Hold'],
                'Hold Loss': row['Hold Loss'],
                # Trades closed in Exit Year get full flags/values; holding years have zero or False
                'Hit Trade': (row['Profit/Loss'] > 0 and year == row['Exit Year']),
                'Miss Trade': (row['Profit/Loss'] <= 0 and year == row['Exit Year']),
                'Investment Entry': row['Investment'] if year == row['Entry Year'] else 0,  # Invested at Entry Year
                'Investment Exit': row['Investment'] if year == row['Exit Year'] else 0,     # Capital returned at Exit Year
                'Profit Amount': row['Profit/Loss'] if (row['Profit/Loss'] > 0 and year == row['Exit Year']) else 0,
                'Loss Amount': row['Profit/Loss'] if (row['Profit/Loss'] <= 0 and year == row['Exit Year']) else 0,
                'Trade Closed': 1 if year == row['Exit Year'] else 0,
                'Trade Held': 1 if (year >= row['Entry Year'] and year < row['Exit Year']) else 0,
                'Net Investment': row['Net Investment'] if year == row['Exit Year'] else 0,
                'stocks_name': stock_name
            })

    df_expanded = pd.DataFrame(rows)

    # Group by Year and Stock for stock-wise summary
    yearly_stockwise = df_expanded.groupby(['Year', 'stocks_name']).agg(
        total_investment_entry=('Investment Entry', 'sum'),
        total_investment_exit=('Investment Exit', 'sum'),
        total_profit=('Profit Amount', 'sum'),
        total_loss=('Loss Amount', 'sum'),
        total_hold_profit=('Hold', 'sum'),
        total_hold_loss=('Hold Loss', 'sum'),
        total_trades_closed=('Trade Closed', 'sum'),
        total_trades_held=('Trade Held', 'sum'),
        hit_trades=('Hit Trade', 'sum'),
        loss_trades=('Miss Trade', 'sum'),
        net_investment=('Net Investment', 'sum'),
    ).reset_index()

    # Calculate ROI, profit% and loss% based on total_investment_entry
    yearly_stockwise['return_of_investment'] = (yearly_stockwise['total_profit'] / yearly_stockwise['total_investment_entry'] * 100).fillna(0)
    yearly_stockwise['profit_pct'] = yearly_stockwise['return_of_investment']
    yearly_stockwise['loss_pct'] = (yearly_stockwise['total_loss'] / yearly_stockwise['total_investment_entry'] * 100).fillna(0)

    # Replace infinite or NaN where total_investment_entry is zero
    yearly_stockwise.replace([float('inf'), float('-inf')], 0, inplace=True)

    return yearly_stockwise


def main():
    all_yearly_data = []

    for filename in os.listdir(folder_path):
        if filename.endswith('.csv'):
            file_path = os.path.join(folder_path, filename)
            try:
                yearly_data = process_file(file_path)
                all_yearly_data.append(yearly_data)
            except Exception as e:
                print(f"Error processing {filename}: {e}")

    if all_yearly_data:
        combined_df = pd.concat(all_yearly_data, ignore_index=True)

        # 1. Year-wise aggregation across all stocks
        yearly_summary = combined_df.groupby('Year').agg(
            total_investment_entry=('total_investment_entry', 'sum'),
            total_investment_exit=('total_investment_exit', 'sum'),
            total_profit=('total_profit', 'sum'),
            total_loss=('total_loss', 'sum'),
            total_hold_profit=('total_hold_profit', 'sum'),
            total_hold_loss=('total_hold_loss', 'sum'),
            total_trades_closed=('total_trades_closed', 'sum'),
            total_trades_held=('total_trades_held', 'sum'),
            hit_trades=('hit_trades', 'sum'),
            loss_trades=('loss_trades', 'sum'),
            net_investment=('net_investment', 'sum'),
        ).reset_index()

        # Calculate overall ROI and percentages for year-wise summary
        yearly_summary['return_of_investment'] = (yearly_summary['total_profit'] / yearly_summary['total_investment_entry'] * 100).fillna(0)
        yearly_summary['profit_pct'] = yearly_summary['return_of_investment']
        yearly_summary['loss_pct'] = (yearly_summary['total_loss'] / yearly_summary['total_investment_entry'] * 100).fillna(0)

        yearly_summary.replace([float('inf'), float('-inf')], 0, inplace=True)

        # 2. Stock-wise summary already prepared as combined_df
        stockwise_summary = combined_df.copy()

        print(yearly_summary)
        print(stockwise_summary)

        yearly_summary.to_excel(output_yearly_path, index=False)
        stockwise_summary.to_excel(output_stockwise_path, index=False)

        print(f"Year-wise summary saved to {output_yearly_path}")
        print(f"Stock-wise summary saved to {output_stockwise_path}")

    else:
        print("No data to process.")


if __name__ == "__main__":
    main()
