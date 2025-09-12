from breeze_connect import BreezeConnect
import traceback
from credentials import *
from datetime import datetime, timezone
import json
import requests

credentials_data = ['VACHI','SWADESH','RAMKISHAN','RAMKISHANHUF','SWADESHHUF']

# Single Credentials Connection
def connect_breeze(api_key, api_secret, session_token):
    breeze = BreezeConnect(api_key=api_key)
    breeze.generate_session(api_secret=api_secret, session_token=session_token)
    return breeze

# Multi Credentials Connection
def multi_connect(user):
    try:
        print(f"Excuing multi_connect function:: for {user}")
        user_credentials = ICICI_CREDENTIALS[user]
        api_key = user_credentials['API_KEY']
        api_secret = user_credentials['API_SECRET']
        session_token = user_credentials['SESSION_TOKEN']
        session_generate(user)
        breeze = connect_breeze(api_key,api_secret,session_token)
        return breeze
    except Exception as e:
        print(f"Error in multi_connect function::")
        traceback.print_exc()

def session_generate(user):
    try:
        user_credentials = ICICI_CREDENTIALS[user]
        session_key = user_credentials['SESSION_TOKEN']
        appkey = user_credentials['API_KEY']
        customerDetail_payload = json.dumps({
        "SessionToken": session_key,
        "AppKey": appkey
        })
        customerDetail_headers = {
            'Content-Type': 'application/json',
        }

        customerDetail_response = requests.request("GET", CUSTOMER_DETAIL_URL, headers=customerDetail_headers, data=customerDetail_payload)
        data = json.loads(customerDetail_response.text)
        session_token = data["Success"]["session_token"]
        user_credentials['SESSION_KEY'] = session_token
        print(f"session_token::  {session_token}")
        return session_token
    except Exception as e:
        print(f"Error in session_generate function:: {e}")
        traceback.print_exc()

# multi_connect("SWADESHHUF")   

