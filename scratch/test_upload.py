import urllib.request
import json

url = "https://thaiba-garden-media-manager.vercel.app/api/chat/upload"
boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"

# Construct multipart/form-data body
body = []
body.append(f"--{boundary}".encode('utf-8'))
body.append('Content-Disposition: form-data; name="roomId"'.encode('utf-8'))
body.append(''.encode('utf-8'))
body.append('cea4326c-213e-416c-b19f-85053fa10483'.encode('utf-8'))

body.append(f"--{boundary}".encode('utf-8'))
body.append('Content-Disposition: form-data; name="file"; filename="test_log.txt"'.encode('utf-8'))
body.append('Content-Type: text/plain'.encode('utf-8'))
body.append(''.encode('utf-8'))
body.append('This is test telemetry content.'.encode('utf-8'))
body.append(f"--{boundary}--".encode('utf-8'))
body.append(''.encode('utf-8'))

data = b'\r\n'.join(body)

headers = {
    "Content-Type": f"multipart/form-data; boundary={boundary}",
    "Content-Length": str(len(data))
}

req = urllib.request.Request(url, data=data, headers=headers, method="POST")

try:
    print("Sending upload request...")
    with urllib.request.urlopen(req) as response:
        print(f"Status Code: {response.status}")
        print("Response Body:")
        print(response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(f"HTTP Error: {e.code}")
    print("Response Body:")
    print(e.read().decode('utf-8'))
except Exception as e:
    print("Request failed:", e)
