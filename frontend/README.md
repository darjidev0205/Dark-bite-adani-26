# UPI Shield — Stop Fraud Before Payment (Frontend)

UPI Shield is a modern, responsive fintech security awareness dashboard built for everyday Indian UPI users, students, and professionals to evaluate suspicious payment messages, links, and QR codes before any money is authorized.

---

## 🛠️ Technology Stack

- **Framework**: React.js 19 with Vite & TypeScript
- **Styling**: Tailwind CSS (custom Navy, Teal, Amber, and Rose tokens)
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **HTTP Client**: Axios with interceptors, timeouts, and error handling

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18+ (tested on v22+)
- **Python**: 3.10+ (for the FastAPI backend)

### 2. Install Frontend Dependencies
```bash
cd frontend
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default content of `.env`:
```env
VITE_API_BASE_URL=http://localhost:8000
```

### 4. Run the Backend (FastAPI)
From the repository root or `backend/` directory:
```bash
cd backend
# Using your Python virtual environment
uvicorn app.main:app --reload --port 8000
```
API docs will be available at `http://localhost:8000/docs`.

### 5. Start Frontend Development Server
In a separate terminal:
```bash
cd frontend
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 🔌 API Integration Contract

### Endpoint
`POST /api/v1/analyze`

### Request Payload
```json
{
  "text": "Your account is blocked. Enter your UPI PIN to receive a refund.",
  "url": null,
  "request_type": "message",
  "recipient_name": null
}
```

### Response Payload
```json
{
  "risk_level": "HIGH",
  "risk_score": 90,
  "summary": "This request contains suspicious payment instructions.",
  "indicators": [
    {
      "code": "PIN_FOR_RECEIVING_MONEY",
      "title": "PIN requested to receive money",
      "evidence": "Enter your UPI PIN to receive a refund.",
      "explanation": "A UPI PIN should not be entered to receive money.",
      "severity": "HIGH"
    }
  ],
  "recommended_actions": [
    "Do not enter your UPI PIN.",
    "Verify the request independently."
  ],
  "disclaimer": "This is a heuristic assessment, not a definitive fraud determination."
}
```

---

## 📋 Manual Testing Checklist

| Step | Action | Expected Result |
| :--- | :--- | :--- |
| **1. Header Status** | Open `http://localhost:5173` | Badge shows `Backend Connected` (green pulse) when port 8000 is active. |
| **2. High-Risk Scam Test** | Click scenario: `Fake Refund (Requests UPI PIN)` | Form auto-populates; click **Analyze Request**. High Risk (Red) badge appears with heuristic score and matched evidence. |
| **3. Phishing Link Test** | Click scenario: `Urgent KYC Suspension Link` | Analysis flags suspicious emergency threat and unfamiliar domain. |
| **4. Low-Risk Test** | Click scenario: `Normal Counter Grocery Payment` | Low Risk badge appears in neutral/navy tone. *No misleading "100% safe guarantee" is displayed.* |
| **5. Reset Button** | Click **Reset** | Form fields, scores, and indicators are cleared immediately. |
| **6. Navigation** | Click **Safety Tips** & **About** tabs | View NPCI safety checklist, scam breakdown, and architecture notes. |
| **7. Error Handling** | Stop backend (`Ctrl+C` in backend) and analyze | Friendly backend-unavailable banner appears with clear restart instructions and retry action. |

---

## 🛡️ Security & Zero-Credential Philosophy
UPI Shield is strictly a **safety awareness prototype**. It never collects, records, or asks for:
- UPI PINs
- OTPs
- Netbanking passwords
- Debit/credit card details
- Bank account numbers
