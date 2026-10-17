from urllib.parse import parse_qs, urlparse


class UPIQRAnalysisResult:
    def __init__(self):
        self.is_valid_upi: bool = False
        self.payload_type: str = "UNKNOWN"
        self.payee_vpa: str | None = None
        self.payee_name: str | None = None
        self.amount: float | None = None
        self.transaction_note: str | None = None
        self.currency: str | None = None
        self.merchant_code: str | None = None
        self.transaction_ref: str | None = None
        self.ref_url: str | None = None
        self.signals: list[dict[str, str]] = []
        self.warnings: list[str] = []


class SafeQRService:
    """
    Analyzes decoded UPI QR code strings (UPI URIs) and arbitrary QR payloads safely.
    Treats QR payloads strictly as untrusted data. Never initiates payments or guarantees payee identity.
    Adheres to NPCI UPI Linking Specifications and avoids penalizing standard QR parameters.
    """

    KNOWN_HANDLES = {
        "okhdfcbank", "okaxis", "okicici", "oksbi", "paytm", "ybl", "ibl", "axl",
        "apl", "barodampay", "upi", "ptaxis", "ptyes", "ptsbi", "pthdfc", "postbank",
        "idbi", "aubank", "jupiteraxis", "sliceaxis", "airtel", "yesbank", "kotak"
    }

    def analyze_upi_uri(self, uri_str: str) -> UPIQRAnalysisResult:
        result = UPIQRAnalysisResult()
        if not uri_str or not uri_str.strip():
            result.warnings.append("Empty QR URI content")
            return result

        clean_uri = uri_str.strip()

        # Check payload type
        if clean_uri.lower().startswith("upi://pay"):
            result.payload_type = "UPI_PAYMENT_URI"
            result.is_valid_upi = True
        else:
            result.is_valid_upi = False
            result.warnings.append("QR content is not a standard UPI payment URI (must begin with 'upi://pay')")
            result.signals.append({
                "code": "NON_UPI_QR",
                "title": "Non-standard QR code",
                "description": "The scanned QR code is not a standard NPCI UPI payment format.",
                "severity": "low",
            })
            if clean_uri.lower().startswith(("http://", "https://")):
                result.payload_type = "WEB_URL"
            else:
                result.payload_type = "PLAIN_TEXT_OR_CUSTOM"
            return result

        try:
            parsed = urlparse(clean_uri)
            params = parse_qs(parsed.query)

            # Standard NPCI UPI URI parameters
            # pa: Payee Address / VPA
            pa_list = params.get("pa", [])
            result.payee_vpa = pa_list[0].strip() if pa_list else None

            # pn: Payee Name (display name)
            pn_list = params.get("pn", [])
            result.payee_name = pn_list[0].strip() if pn_list else None

            # am: Transaction Amount
            am_list = params.get("am", [])
            if am_list:
                try:
                    result.amount = float(am_list[0])
                except ValueError:
                    result.warnings.append("Non-numeric amount parameter in UPI QR")

            # cu: Currency (default to INR per NPCI)
            cu_list = params.get("cu", [])
            result.currency = cu_list[0].upper() if cu_list else "INR"

            # tn: Transaction Note
            tn_list = params.get("tn", [])
            result.transaction_note = tn_list[0].strip() if tn_list else None

            # mc: Merchant Category Code
            mc_list = params.get("mc", [])
            result.merchant_code = mc_list[0].strip() if mc_list else None

            # tr: Transaction Reference ID
            tr_list = params.get("tr", [])
            result.transaction_ref = tr_list[0].strip() if tr_list else None

            # url: Reference URL
            url_list = params.get("url", [])
            result.ref_url = url_list[0].strip() if url_list else None

            # Validate VPA presence
            if not result.payee_vpa:
                result.is_valid_upi = False
                result.warnings.append("Missing Payee Address (pa parameter) in UPI QR")
                result.signals.append({
                    "code": "MISSING_PAYEE_VPA",
                    "title": "Missing destination UPI ID",
                    "description": "The QR code lacks a destination virtual payment address (VPA parameter).",
                    "severity": "high",
                })
            else:
                if "@" not in result.payee_vpa or len(result.payee_vpa.split("@")[0]) == 0:
                    result.signals.append({
                        "code": "MALFORMED_VPA",
                        "title": "Malformed UPI ID",
                        "description": "The destination handle does not follow the standard handle@bank format.",
                        "severity": "high",
                    })

            # Check transaction note for suspicious/deceptive phrasing
            if result.transaction_note:
                tn_lower = result.transaction_note.lower()

                # Critical: PIN requested to receive
                if any(k in tn_lower for k in ["pin", "enter pin", "share pin"]) and any(
                    w in tn_lower for w in ["receive", "claim", "get", "credit", "refund"]
                ):
                    result.signals.append({
                        "code": "QR_PIN_TO_RECEIVE",
                        "title": "UPI PIN required claim in QR note",
                        "description": "The QR note deceptively claims you must enter a PIN to receive or claim funds. Receiving money never requires a PIN.",
                        "severity": "high",
                    })

                suspicious_terms = ["refund", "cashback", "lottery", "kyc", "pin", "verify"]
                for term in suspicious_terms:
                    if term in tn_lower:
                        result.signals.append({
                            "code": f"QR_NOTE_{term.upper()}",
                            "title": f"Suspicious transaction note ({term})",
                            "description": f"The QR transaction note mentions '{term}', often used to lure users into paying collect requests.",
                            "severity": "medium",
                        })
                        break

        except Exception as e:
            result.warnings.append(f"Failed to parse UPI QR content: {str(e)}")

        return result
