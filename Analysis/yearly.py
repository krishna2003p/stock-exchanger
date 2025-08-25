import pandas as pd
import os

home = os.path.expanduser("~")
folder_path = os.path.join(home, "Documents", "Stock_Market", "final_stock", "case4")
output_path = os.path.join(home, "Documents", "Stock_Market", "Final_Result","master_file_case4.xlsx")


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
    df = df.dropna(subset=['Entry Date'])

    # Extract year and create year range string like '2011-12'
    df['YearStart'] = df['Entry Date'].dt.year
    df['YearEnd'] = df['Entry Date'].dt.year + 1
    df['Year'] = df['YearStart'].astype(str) + '-' + df['YearEnd'].astype(str).str[-2:]

    df['Hit Trade'] = df['Profit/Loss'] > 0
    df['Miss Trade'] = df['Profit/Loss'] <= 0
    df['Profit Amount'] = df['Profit/Loss'].apply(lambda x: x if x > 0 else 0)
    df['Loss Amount'] = df['Profit/Loss'].apply(lambda x: x if x < 0 else 0)

    yearly_summary = df.groupby('Year').agg(
        hit_trades=('Hit Trade', 'sum'),
        miss_trades=('Miss Trade', 'sum'),
        total_investment=('Investment', 'sum'),
        total_profit=('Profit Amount', 'sum'),
        total_loss=('Loss Amount', 'sum'),
        trade_count=('Profit/Loss', 'count')
    ).reset_index()

    yearly_summary['profit_ratio_pct'] = (yearly_summary['hit_trades'] / yearly_summary['trade_count']) * 100
    yearly_summary['loss_ratio_pct'] = (yearly_summary['miss_trades'] / yearly_summary['trade_count']) * 100

    return yearly_summary


def main():
    all_yearly_data = []

    # folder_files = ['WABIND_backtest(58).csv']  # Replace with os.listdir(folder_path) to scan folder
    for filename in os.listdir(folder_path):
        if filename.endswith('.csv'):
            file_path = os.path.join(folder_path, filename)
            try:
                yearly_data = process_file(file_path)
                yearly_data['Stock_File'] = filename
                all_yearly_data.append(yearly_data)
            except Exception as e:
                print(f"Error processing {filename}: {e}")

    if all_yearly_data:
        combined_df = pd.concat(all_yearly_data, ignore_index=True)

        final_yearly_summary = combined_df.groupby('Year').agg(
            hit_trades=('hit_trades', 'sum'),
            miss_trades=('miss_trades', 'sum'),
            total_investment=('total_investment', 'sum'),
            total_profit=('total_profit', 'sum'),
            total_loss=('total_loss', 'sum'),
            trade_count=('trade_count', 'sum')
        ).reset_index()

        final_yearly_summary['profit_ratio_pct'] = (final_yearly_summary['hit_trades'] / final_yearly_summary['trade_count']) * 100
        final_yearly_summary['loss_ratio_pct'] = (final_yearly_summary['miss_trades'] / final_yearly_summary['trade_count']) * 100

        print(final_yearly_summary)

        final_yearly_summary.to_excel(output_path, index=False)
        print(f"Yearly analysis saved to {output_path}")
    else:
        print("No data to process.")


if __name__ == "__main__":
    main()
