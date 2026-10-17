import urllib.request
import json

BASE_URL = "http://127.0.0.1:8000"

def test_endpoint(name, method, path, body=None):
    url = f"{BASE_URL}{path}"
    data = json.dumps(body).encode() if body else None
    headers = {"Content-Type": "application/json"} if body else {}
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode())
            print(f"[{resp.status}] {name}:")
            if "risk_level" in res:
                print(f"    Risk: {res['risk_level']}, Score: {res['risk_score']}, Source: {res.get('analysis_source')}")
                print(f"    Summary: {res.get('summary')}")
            else:
                print(f"    Response: {res}")
            return True
    except Exception as e:
        print(f"[FAIL] {name}: {e}")
        return False

print("=== RUNNING API TESTS ===")
test_endpoint("GET /health", "GET", "/health")
test_endpoint("GET /api/v1/health", "GET", "/api/v1/health")
test_endpoint("Analyze Message", "POST", "/api/v1/analyze", {
    "text": "Dear customer, your electricity will be disconnected tonight at 9:30 PM. Call officer at 9876543210 immediately.",
    "request_type": "message"
})
test_endpoint("Analyze URL", "POST", "/api/v1/analyze", {
    "url": "http://sbi-kyc-update-pan-verification.online/login",
    "request_type": "url"
})
test_endpoint("Analyze Legitimate QR", "POST", "/api/v1/analyze", {
    "text": "upi://pay?pa=store@okaxis&pn=Grocery%20Mart&am=250.00&cu=INR",
    "request_type": "qr"
})
test_endpoint("Analyze Suspicious QR", "POST", "/api/v1/analyze", {
    "text": "upi://pay?pa=fake.cashback77@ybl&pn=PhonePe%20Reward&am=1999.00&cu=INR&tn=Enter%20UPI%20PIN%20to%20receive%20refund",
    "request_type": "qr"
})
test_endpoint("Analyze Payment Request", "POST", "/api/v1/analyze", {
    "text": "upi://pay?pa=lottery.helpdesk@oksbi&pn=KBC%20Lottery%20Prize",
    "request_type": "payment"
})

