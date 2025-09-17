import os
import sys
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio
import threading
import traceback
import subprocess

sys.path.append(os.path.join(os.path.dirname(__file__), 'common_scripts'))
from enable_logging import print_log

# Import trading logic module
sys.path.append(os.path.join(os.path.dirname(__file__), 'vendors', 'ICICI'))
import trading_logic

app = FastAPI()

# CORS for Next.js UI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

# Forward config and shared state from trading_logic
CONFIG = trading_logic.CONFIG

config_lock = trading_logic.config_lock

class SessionUpdateRequest(BaseModel):
    user: str
    session_token: str

class ConfigRequest(BaseModel):
    stock: str = None
    capital_per_stock: float = None
    interval: int = None
    is_live: bool = None

class ConditionRequest(BaseModel):
    entry_condition: list = None
    exit_condition: list = None

# API endpoints delegate to trading_logic functions
@app.get("/")
async def root():
    with config_lock:
        status = {
            "capital_per_stock": CONFIG["capital_per_stock"],
            "is_live": CONFIG["is_live"],
            "interval": CONFIG["interval"],
            "session_token": CONFIG["session_token"],
            "user": CONFIG["user"],
            "symbols": CONFIG["symbols"],
            "entry_condition": CONFIG.get("entry_condition", []),
            "exit_condition": CONFIG.get("exit_condition", []),
        }
    return {"message": "Stock Trading Bot API is running", "status": status}

@app.post("/update_session")
async def update_session(req: SessionUpdateRequest):
    CONFIG['session_token'] = req.session_token
    CONFIG['user'] = req.user
    print_log(f"update session")
    return {"message": "Session updated"}
    # return await trading_logic.update_session(req)

@app.post("/add_stock")
async def add_stock(req: ConfigRequest):
    CONFIG['symbols'].append(req.stock)
    return {"message": f"Stock {req.stock} added"}
    # return await trading_logic.add_stock(req)

@app.post("/remove_stock")
async def remove_stock(req: ConfigRequest):
    CONFIG['symbols'].remove(req.stock)
    return {"message": f"Stock {req.stock} removed"}
    # return await trading_logic.remove_stock(req)

@app.post("/update_capital")
async def update_capital(req: ConfigRequest):
    CONFIG['capital_per_stock'] = req.capital_per_stock
    return {"message": f"capital_per_stock updated to {req.capital_per_stock}"}
    # return await trading_logic.update_capital(req)

@app.post("/update_interval")
async def update_interval(req: ConfigRequest):
    CONFIG['interval'] = req.interval
    return {"message": f"interval updated to {req.interval}"}
    # return await trading_logic.update_interval(req)

@app.post("/update_is_live")
async def update_is_live(req: ConfigRequest):
    CONFIG['is_live'] = req.is_live
    return {"message": f"is_live updated to {req.is_live}"}
    # return await trading_logic.update_is_live(req)

@app.post("/update_entry_condition")
async def update_entry_condition(req: ConditionRequest):
    print_log(f"Please wait for some time to update entry condition")
    return {"message": "Entry condition updated"}
    # return await trading_logic.update_entry_condition(req)

@app.post("/update_exit_condition")
async def update_exit_condition(req: ConditionRequest):
    print_log(f"Please wait for some time to update exit condition")
    return {"message": "Exit condition updated"}
    # return await trading_logic.update_exit_condition(req)

@app.post("/run_bot")
async def run_bot():
    try:
        script_path = os.path.join(os.path.dirname(__file__), 'vendors', 'ICICI', 'long_term_trading_bot.py')
        print(f"Bot Path:: {script_path}")
        # Run the script
        result = subprocess.run(
            ['python3', script_path],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )

        if result.returncode != 0:
            print_log(f"Bot run failed:\n{result.stderr}")
            raise HTTPException(status_code=500, detail=f"Bot failed to run:\n{result.stderr}")

        print_log("Bot run successfully")
        return {
            "success": True,
            "output": result.stdout
        }

    except Exception as e:
        traceback_str = traceback.format_exc()
        print_log(f"Exception while running bot: {traceback_str}")
        raise HTTPException(status_code=500, detail=str(e))


# @app.post("/update_session")
# async def update_session(req: SessionUpdateRequest):
#     return await trading_logic.update_session(req)

# @app.post("/add_stock")
# async def add_stock(req: ConfigRequest):
#     return await trading_logic.add_stock(req)

# @app.post("/remove_stock")
# async def remove_stock(req: ConfigRequest):
#     return await trading_logic.remove_stock(req)

# @app.post("/update_capital")
# async def update_capital(req: ConfigRequest):
#     return await trading_logic.update_capital(req)

# @app.post("/update_interval")
# async def update_interval(req: ConfigRequest):
#     return await trading_logic.update_interval(req)

# @app.post("/update_is_live")
# async def update_is_live(req: ConfigRequest):
#     return await trading_logic.update_is_live(req)

# @app.post("/update_entry_condition")
# async def update_entry_condition(req: ConditionRequest):
#     return await trading_logic.update_entry_condition(req)

# @app.post("/update_exit_condition")
# async def update_exit_condition(req: ConditionRequest):
#     return await trading_logic.update_exit_condition(req)

# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     await trading_logic.lifespan_setup()
#     yield
#     # Optional cleanup on shutdown
#     print_log("Shutdown initiated, cleaning up...")

# app.router.lifespan_context = lifespan

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=9000)
