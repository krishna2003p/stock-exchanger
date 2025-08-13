from breeze_connect import BreezeConnect
import traceback
from credentials import *

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
        breeze = connect_breeze(api_key,api_secret,session_token)
        return breeze
    except Exception as e:
        print(f"Error in multi_connect function::")
        traceback.print_exc()
