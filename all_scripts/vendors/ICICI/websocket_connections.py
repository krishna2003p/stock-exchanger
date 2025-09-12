import socketio
import threading
import os
import pandas as pd
from datetime import datetime
import base64

class BreezeWebsocketClient:
    def __init__(self, session_key, script_codes, on_tick_callback):
        self.session_key = session_key
        self.script_codes = script_codes
        self.on_tick_callback = on_tick_callback
        self.sio = socketio.Client()
        self._lock = threading.Lock()
        self._connected = False
        self._subscribed_codes = set()
        self.token_to_code = {}  # Fixed: Changed from list to dict
        
        self.sio.on('stock', self._on_stock)
        
        self.tux_to_user_value = {
            "orderFlow": {"B": "Buy", "S": "Sell", "N": "NA"},
            "limitMarketFlag": {"L": "Limit", "M": "Market", "S": "StopLoss"},
            "orderType": {"T": "Day", "I": "IoC", "V": "VTC"},
            "productType": {"F": "Futures", "O": "Options", "P": "FuturePlus", 
                           "U": "FuturePlus_sltp", "I": "OptionPlus", "C": "Cash", 
                           "Y": "eATM", "B": "BTST", "M": "Margin", "T": "MarginPlus"},
            "orderStatus": {"A": "All", "R": "Requested", "Q": "Queued", "O": "Ordered", 
                           "P": "Partially Executed", "E": "Executed", "J": "Rejected", 
                           "X": "Expired", "B": "Partially Executed And Expired", 
                           "D": "Partially Executed And Cancelled", "F": "Freezed", "C": "Cancelled"},
            "optionType": {"C": "Call", "P": "Put", "*": "Others"},
        }

    def _on_stock(self, data):
        try:
            ticks = self.parse_data(data)
            if callable(self.on_tick_callback):
                self.on_tick_callback(ticks)
        except Exception as e:
            print(f"Error processing tick data: {e}")

    def connect(self):
        try:
            auth = self._get_auth_from_session_key()
            self.sio.connect(
                "https://livefeeds.icicidirect.com",
                headers={"User-Agent": "python-socketio[client]/socket"},
                auth=auth,
                transports=["websocket"],
                wait_timeout=3
            )
            self._connected = True
            self.subscribe_all(self.script_codes)
            print("Websocket connected and subscribed to initial scripts.")
        except Exception as e:
            print(f"Failed to connect websocket: {e}")
            self._connected = False

    def _get_auth_from_session_key(self):
        user_id, token = base64.b64decode(self.session_key.encode()).decode().split(":")
        return {"user": user_id, "token": token}

    def subscribe_all(self, codes):
        with self._lock:
            tokens = self.convert_codes_to_tokens(codes)
            if tokens:
                self.sio.emit('join', tokens)
                self._subscribed_codes.update(tokens)
                print(f"Subscribed to tokens: {tokens}")

    def subscribe_stock(self, code):
        with self._lock:
            token = self.convert_code_to_token([code])  # Pass as list
            if token and token not in self._subscribed_codes:
                self.sio.emit('join', [token])
                self._subscribed_codes.add(token)
                print(f"Subscribed to {code} ({token})")

    def unsubscribe_stock(self, code):
        with self._lock:
            token = self.convert_code_to_token([code])  # Pass as list
            if token and token in self._subscribed_codes:
                self.sio.emit('leave', [token])
                self._subscribed_codes.remove(token)
                print(f"Unsubscribed from {code} ({token})")

    def disconnect(self):
        with self._lock:
            tokens = list(self._subscribed_codes)
            if tokens:
                self.sio.emit('leave', tokens)
            self.sio.emit('disconnect', 'transport close')
            if self._connected:
                self.sio.disconnect()
            self._connected = False

    def convert_code_to_token(self, codes):
        """Convert single code to token - expects list input"""
        file_path = os.path.join(os.path.expanduser("~"), "Documents", "Stock_Market", "common_csv", "StockScriptNew.csv")
        
        try:
            df = pd.read_csv(file_path)
            df['SM'] = df['SM'].str.strip().str.upper()
            df['EC'] = df['EC'].str.strip().str.upper()
            df['TK'] = df['TK'].astype(str).str.strip()
            
            filtered_df = df[(df['EC'] == 'NSE') & (df['SM'].isin(codes)) & (df['TK'] != '')]
            
            for _, row in filtered_df.iterrows():
                token = f"4.1!{row['TK']}"
                self.token_to_code[token] = row['SM']
                return token
        except Exception as e:
            print(f"Error converting code to token: {e}")
        return None

    def convert_codes_to_tokens(self, codes):
        """Convert multiple codes to tokens"""
        stock_tokens = []
        file_path = os.path.join(os.path.expanduser("~"), "Documents", "Stock_Market", "common_csv", "StockScriptNew.csv")
        
        try:
            df = pd.read_csv(file_path)
            df['SM'] = df['SM'].str.strip().str.upper()
            df['EC'] = df['EC'].str.strip().str.upper()
            df['TK'] = df['TK'].astype(str).str.strip()
            
            filtered_df = df[(df['EC'] == 'NSE') & (df['SM'].isin(codes)) & (df['TK'] != '')]
            
            for _, row in filtered_df.iterrows():
                token = f"4.1!{row['TK']}"
                stock_tokens.append(token)
                self.token_to_code[token] = row['SM']
            
            print(f"Converted codes {codes} to tokens: {stock_tokens}")
        except Exception as e:
            print(f"Error converting codes to tokens: {e}")
        
        return stock_tokens

    def parse_market_depth(self, data, exchange):
        depth = []
        counter = 0
        for lis in data:
            counter += 1
            depth_dict = {}
            if exchange == '1':
                depth_dict["BestBuyRate-"+str(counter)] = lis[0]
                depth_dict["BestBuyQty-"+str(counter)] = lis[1]
                depth_dict["BestSellRate-"+str(counter)] = lis[2]
                depth_dict["BestSellQty-"+str(counter)] = lis[3]
            else:
                depth_dict["BestBuyRate-"+str(counter)] = lis[0]
                depth_dict["BestBuyQty-"+str(counter)] = lis[1]
                depth_dict["BuyNoOfOrders-"+str(counter)] = lis[2]
                depth_dict["BuyFlag-"+str(counter)] = lis[3]
                depth_dict["BestSellRate-"+str(counter)] = lis[4]
                depth_dict["BestSellQty-"+str(counter)] = lis[5]
                depth_dict["SellNoOfOrders-"+str(counter)] = lis[6]
                depth_dict["SellReserved-"+str(counter)] = lis[7]
            depth.append(depth_dict)
        return depth

    def parse_data(self, data):
        if data and isinstance(data, list) and len(data) > 0 and isinstance(data[0], str) and "!" not in data[0]:
            # Order data parsing (existing logic)
            order_dict = {}
            order_dict["sourceNumber"] = data[0]
            # ... (keep your existing order parsing logic)
            return order_dict
        
        if not data or not isinstance(data, list) or len(data) == 0:
            return {}
            
        try:
            exchange = str.split(data[0], '!')[0].split('.')[0]
            data_type = str.split(data[0], '!')[0].split('.')[1]
        except:
            return {}

        if exchange == '6':
            # Commodity data parsing
            data_dict = {}
            data_dict["symbol"] = data[0]
            data_dict["AndiOPVolume"] = data[1]
            data_dict["Reserved"] = data[2]
            data_dict["IndexFlag"] = data[3]
            data_dict["ttq"] = data[4]
            data_dict["last"] = data[5]
            data_dict["ltq"] = data[6]
            data_dict["ltt"] = datetime.fromtimestamp(data[7]).strftime('%c')
            data_dict["AvgTradedPrice"] = data[8]
            data_dict["TotalBuyQnt"] = data[9]
            data_dict["TotalSellQnt"] = data[10]
            data_dict["ReservedStr"] = data[11]
            data_dict["ClosePrice"] = data[12]
            data_dict["OpenPrice"] = data[13]
            data_dict["HighPrice"] = data[14]
            data_dict["LowPrice"] = data[15]
            data_dict["ReservedShort"] = data[16]
            data_dict["CurrOpenInterest"] = data[17]
            data_dict["TotalTrades"] = data[18]
            data_dict["HightestPriceEver"] = data[19]
            data_dict["LowestPriceEver"] = data[20]
            data_dict["TotalTradedValue"] = data[21]
            marketDepthIndex = 0
            for i in range(22, len(data)):
                data_dict["Quantity-"+str(marketDepthIndex)] = data[i][0]
                data_dict["OrderPrice-"+str(marketDepthIndex)] = data[i][1]
                data_dict["TotalOrders-"+str(marketDepthIndex)] = data[i][2]
                data_dict["Reserved-"+str(marketDepthIndex)] = data[i][3]
                data_dict["SellQuantity-"+str(marketDepthIndex)] = data[i][4]
                data_dict["SellOrderPrice-"+str(marketDepthIndex)] = data[i][5]
                data_dict["SellTotalOrders-"+str(marketDepthIndex)] = data[i][6]
                data_dict["SellReserved-"+str(marketDepthIndex)] = data[i][7]
                marketDepthIndex += 1
        elif data_type == '1':
            # Equity data parsing
            data_dict = {
                "symbol": data[0],
                "stock_code": self.token_to_code.get(data[0], ''),
                "open": data[1] if len(data) > 1 else 0,
                "last": data[2] if len(data) > 2 else 0,
                "high": data[3] if len(data) > 3 else 0,
                "low": data[4] if len(data) > 4 else 0,
                "change": data[5] if len(data) > 5 else 0,
                "bPrice": data[6] if len(data) > 6 else 0,
                "bQty": data[7] if len(data) > 7 else 0,
                "sPrice": data[8] if len(data) > 8 else 0,
                "sQty": data[9] if len(data) > 9 else 0,
                "ltq": data[10] if len(data) > 10 else 0,
                "avgPrice": data[11] if len(data) > 11 else 0,
                "quotes": "Quotes Data"
            }
            
            if len(data) == 21:
                data_dict.update({
                    "ttq": data[12],
                    "totalBuyQt": data[13],
                    "totalSellQ": data[14],
                    "ttv": data[15],
                    "trend": data[16],
                    "lowerCktLm": data[17],
                    "upperCktLm": data[18],
                    "ltt": datetime.fromtimestamp(data[19]).strftime('%c'),
                    "close": data[20]
                })
                data_dict['exchange'] = 'NSE Equity'
            elif len(data) == 23:
                data_dict.update({
                    "OI": data[12],
                    "CHNGOI": data[13],
                    "ttq": data[14],
                    "totalBuyQt": data[15],
                    "totalSellQ": data[16],
                    "ttv": data[17],
                    "trend": data[18],
                    "lowerCktLm": data[19],
                    "upperCktLm": data[20],
                    "ltt": datetime.fromtimestamp(data[21]).strftime('%c'),
                    "close": data[22]
                })
                data_dict['exchange'] = 'NSE Futures & Options'
        else:
            data_dict = {
                "symbol": data[0],
                "stock_code": self.token_to_code.get(data[0], ''),
                "time": datetime.fromtimestamp(data[1]).strftime('%c') if len(data) > 1 else "",
                "depth": self.parse_market_depth(data[2], exchange) if len(data) > 2 else [],
                "quotes": "Market Depth"
            }

        return data_dict


def start_websocket_in_thread(session_key, script_codes, on_tick_callback):
    """Compatibility function for existing code"""
    client = BreezeWebsocketClient(session_key, script_codes, on_tick_callback)
    
    def run_client():
        try:
            client.connect()
            # Keep the connection alive
            client.sio.wait()
        except Exception as e:
            print(f"Websocket thread error: {e}")
    
    thread = threading.Thread(target=run_client, daemon=True)
    thread.start()
    return client
