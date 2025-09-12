import base64
import socketio
import time

# Get User ID and Session Token
session_key = "VzAyNDQ4NDY6MzEzMDYzODI="  # Example session key
user_id, session_token = base64.b64decode(session_key.encode('ascii')).decode('ascii').split(":")

# Python Socket IO Client
sio = socketio.Client()
auth = {"user": user_id, "token": session_token}
print(f"My AUTH:: {auth}")

# Use correct path and transports
sio.connect(
    "https://breezeapi.icicidirect.com/",
    socketio_path='/ohlcvstream',  # must start with a slash
    headers={"User-Agent": "python-socketio[client]/socket"},
    auth=auth,
    transports=["websocket"],
    wait_timeout=3
)

# Use correct instrument code
script_code = ["1.1!500209"]  # Replace with actual valid code

# Channel name
channel_name = "1SEC"

# Callback
def on_ticks(ticks):
    print("TICKS:", ticks)

# Subscribe callback BEFORE join
sio.on(channel_name, on_ticks)
sio.emit('join', script_code)
print("Streaming started.")

time.sleep(60)  # Wait for some data

sio.emit("leave", script_code)
sio.disconnect()
print("Disconnected.")
