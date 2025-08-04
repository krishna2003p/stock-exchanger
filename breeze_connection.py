from breeze_connect import BreezeConnect

def connect_breeze(api_key, api_secret, session_token):
    breeze = BreezeConnect(api_key=api_key)
    breeze.generate_session(api_secret=api_secret, session_token=session_token)
    return breeze
