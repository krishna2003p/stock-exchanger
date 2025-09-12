import pandas as pd
import os

home = os.path.expanduser("~")
folder_path = os.path.join(home, "Documents", "Stock_Market", "final_stock", "case5")
output_monthly_path = os.path.join(home, "Documents", "Stock_Market", "Final_Result", "new_output", "master_file_case5_monthly.xlsx")
output_stockwise_path = os.path.join(home, "Documents", "Stock_Market", "Final_Result", "new_output", "master_file_case5_stockwise_monthly.xlsx")


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

    # Extract Entry and Exit month as Period (monthly)
    df['Entry Month'] = df['Entry Date'].dt.to_period('M')
    df['Exit Month'] = df['Exit Date'].dt.to_period('M')

    # Calculate holding months (inclusive)
    df['Holding Months'] = ((df['Exit Date'].dt.year - df['Entry Date'].dt.year) * 12
                            + (df['Exit Date'].dt.month - df['Entry Date'].dt.month) + 1)

    # Annual (monthly) hold profit/loss allocated equally
    df['Hold'] = df['Profit/Loss'] / df['Holding Months']
    df['Hold Loss'] = df['Hold'].apply(lambda x: x if x < 0 else 0)

    stock_name = os.path.basename(file_path).replace('_backtest(58).csv', '')
    rows = []

    for _, row in df.iterrows():
        month_range = pd.period_range(start=row['Entry Month'], end=row['Exit Month'], freq='M')
        for month in month_range:
            rows.append({
                'Month': month,
                'Hold': row['Hold'],
                'Hold Loss': row['Hold Loss'],
                'Hit Trade': (row['Profit/Loss'] > 0 and month == row['Exit Month']),
                'Miss Trade': (row['Profit/Loss'] <= 0 and month == row['Exit Month']),
                'Investment Entry': row['Investment'] if month == row['Entry Month'] else 0,
                'Investment Exit': row['Investment'] if month == row['Exit Month'] else 0,
                'Profit Amount': row['Profit/Loss'] if (row['Profit/Loss'] > 0 and month == row['Exit Month']) else 0,
                'Loss Amount': row['Profit/Loss'] if (row['Profit/Loss'] <= 0 and month == row['Exit Month']) else 0,
                'Trade Closed': 1 if month == row['Exit Month'] else 0,
                'Trade Held': 1 if (month >= row['Entry Month'] and month < row['Exit Month']) else 0,
                'Net Investment': row['Net Investment'] if month == row['Exit Month'] else 0,
                'stocks_name': stock_name
            })

    df_expanded = pd.DataFrame(rows)

    # Aggregate monthly data by Month + stocks_name (stock-wise monthly summary)
    monthly_stockwise = df_expanded.groupby(['Month', 'stocks_name']).agg(
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

    # ROI, profit%, loss% based on total_investment_entry
    monthly_stockwise['return_of_investment'] = (monthly_stockwise['total_profit'] / monthly_stockwise['total_investment_entry'] * 100).fillna(0)
    monthly_stockwise['profit_pct'] = monthly_stockwise['return_of_investment']
    monthly_stockwise['loss_pct'] = (monthly_stockwise['total_loss'] / monthly_stockwise['total_investment_entry'] * 100).fillna(0)
    monthly_stockwise.replace([float('inf'), float('-inf')], 0, inplace=True)

    return monthly_stockwise


def main():
    all_monthly_data = []

    for filename in os.listdir(folder_path):
        if filename.endswith('.csv'):
            file_path = os.path.join(folder_path, filename)
            try:
                monthly_data = process_file(file_path)
                all_monthly_data.append(monthly_data)
            except Exception as e:
                print(f"Error processing {filename}: {e}")

    if all_monthly_data:
        combined_df = pd.concat(all_monthly_data, ignore_index=True)

        # 1. Monthly aggregation across all stocks combined
        monthly_summary = combined_df.groupby('Month').agg(
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

        # Calculate ROI and % profit/loss for monthly summary
        monthly_summary['return_of_investment'] = (monthly_summary['total_profit'] / monthly_summary['total_investment_entry'] * 100).fillna(0)
        monthly_summary['profit_pct'] = monthly_summary['return_of_investment']
        monthly_summary['loss_pct'] = (monthly_summary['total_loss'] / monthly_summary['total_investment_entry'] * 100).fillna(0)
        monthly_summary.replace([float('inf'), float('-inf')], 0, inplace=True)

        # 2. Stock-wise monthly summary is combined_df as is
        stockwise_summary = combined_df.copy()

        print(monthly_summary)
        print(stockwise_summary)

        monthly_summary.to_excel(output_monthly_path, index=False)
        stockwise_summary.to_excel(output_stockwise_path, index=False)

        print(f"Monthly summary saved to {output_monthly_path}")
        print(f"Stock-wise monthly summary saved to {output_stockwise_path}")

    else:
        print("No data to process.")


if __name__ == "__main__":
    main()
