import requests
import json
import hashlib
from datetime import datetime, timezone

customerDetail_url = "https://api.icicidirect.com/breezeapi/api/v1/customerdetails"
secret_key = "3X58i5Mr764a68Ey56136499070275lA"
appkey = "9H0zb254hW0m8949Qs44x8n6482h804$"
session_key = "52870557"

time_stamp = datetime.now(timezone.utc).isoformat()[:19] + '.000Z'

customerDetail_payload = json.dumps({
  "SessionToken": session_key,
  "AppKey": appkey
})
customerDetail_headers = {
    'Content-Type': 'application/json',
}

customerDetail_response = requests.request("GET", customerDetail_url, headers=customerDetail_headers, data=customerDetail_payload)
data = json.loads(customerDetail_response.text)
session_token = data["Success"]["session_token"]
url = "https://api.icicidirect.com/breezeapi/api/v1/dematholdings"

payload = json.dumps({})
checksum = hashlib.sha256((time_stamp+payload+secret_key).encode("utf-8")).hexdigest()
# checksum = "9dc2731852aacc3a21b665aff62d02c782bb13278aeb736fcb7b1906d2d91d76"
headers = {
    'Content-Type': 'application/json',
    'X-Checksum': 'token '+ checksum,
    'X-Timestamp': time_stamp,
    'X-AppKey': appkey,
    'X-SessionToken': session_token
}

response = requests.request("GET", url, headers=headers, data=payload)
print(response.text)