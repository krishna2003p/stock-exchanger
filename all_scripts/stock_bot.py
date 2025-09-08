from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from breeze_connection import *
import uvicorn

app = FastAPI()
class StockRequest(BaseModel):
    symbol: str = None
    exchange: str = None
    quantity: int = None
    order_type: str = None
    price: float = None
    user: str = None
    session_token: str = None

# Root endpoint
@app.get("/")
async def root():
    print(f"Root endpoint accessed: {ICICI_CREDENTIALS['VACHI']['SESSION_TOKEN']}")
    return {"message": "Welcome to the Stock Trading Bot API"}

# Endpoint to connect to the broker using multi_connect
@app.post("/connect")
async def connect_to_broker(user: str):
    try:
        if user not in ['VACHI','SWADESH','RAMKISHAN','RAMKISHANHUF','SWADESHHUF']:
            raise HTTPException(status_code=400, detail="Invalid user")
        breeze = multi_connect(user)
        if breeze:
            return {"message": f"Connected successfully for {user}"}
        else:
            raise HTTPException(status_code=500, detail="Connection failed")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/update_session")
async def update_session(req: StockRequest):
    try:
        user = req.user
        session_token = req.session_token
        if user not in ['VACHI','SWADESH','RAMKISHAN','RAMKISHANHUF','SWADESHHUF']:
            raise HTTPException(status_code=400, detail="Invalid user")
        breeze = ICICI_CREDENTIALS[user]
        if breeze:
            breeze['SESSION_TOKEN'] = session_token
            print(f"Session token updated for {user} to {session_token} now is {breeze['SESSION_TOKEN']}")
            return {"message": f"Session updated successfully for {user}"}
        else:
            raise HTTPException(status_code=500, detail="Session update failed")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    print(f"Starting server... URL: {'http://127.0.0.1:9000'}")
    uvicorn.run(app, host="127.0.0.1", port=9000)
