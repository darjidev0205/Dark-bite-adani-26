from urllib.parse import parse_qs, urlparse


class UPIQRAnalysisResult:
    def __init__(self):
        self.is_valid_upi: bool = False
        self.payee_vpa: str | None = None
        self.payee_name: str | None = None
        self.amount: float | None = None
        self.transaction_note: str | None = None
        self.currency: str | None = None
        self.signals: list[dict[str, str]] = []
        self.warnings: list[str] = []


class SafeQRService:
    """
    Analyzes decoded UPI QR code strings (UPI URIs).
    Treats QR payloads strictly as data. Never initiates payments or guarantees payee identity.
    """

    # Common valid bank/PSP handle suffixes in India
    KNOWN_HANDLES = {
        "okhdfcbank", "okaxis", "okicici", "oksbi", "paytm", "ybl", "ibl", "axl",
        "apl", "barodampay", "upi", "ptaxis", "ptyes", "ptsbi", "pthdfc"
    }

    def analyze_upi_uri(self, uri_str: str) -> UPIQRAnalysisResult:
        result = UPIQRAnalysisResult()
        if not uri_str or not uri_str.strip():
            result.warnings.append("Empty QR URI content")
            return result

        clean_uri = uri_str.strip()
        if not clean_uri.lower().startswith("upi://pay"):
            result.warnings.append("QR content is not a standard UPI payment URI (must begin with 'upi://pay')")
            result.signals.append({
                "code": "NON_UPI_QR",
                "title": "Non-standard QR code",
                "description": "The scanned QR code is not a standard NPCI UPI payment format.",
                "severity": "medium",
            })
            return result

        try:
            parsed = urlparse(clean_uri)
            params = parse_qs(parsed.query)

            # Extract pa (Payee Address / VPA)
            pa_list = params.get("pa", [])
            result.payee_vpa = pa_list[0].strip() if pa_list else None

            # Extract pn (Payee Name)
            pn_list = params.get("pn", [])
            result.payee_name = pn_list[0].strip() if pn_list else None

            # Extract am (Amount)
            am_list = params.get("am", [])
            if am_list:
                try:
                    result.amount = float(am_list[0])
                except ValueError:
                    result.warnings.append("Invalid amount in UPI QR")

            # Extract cu (Currency)
            cu_list = params.get("cu", [])
            result.currency = cu_list[0].upper() if cu_list else "INR"

            # Extract tn (Transaction Note)
            tn_list = params.get("tn", [])
            result.transaction_note = tn_list[0].strip() if tn_list else None

            # Validate VPA presence and format
            if not result.payee_vpa:
                result.warnings.append("Missing Payee Address (pa parameter) in UPI QR")
                result.signals.append({
                    "code": "MISSING_PAYEE_VPA",
                    "title": "Missing payee VPA",
                    "description": "The QR code lacks a destination virtual payment address (VPA).",
                    "severity": "high",
                })
            else:
                result.is_valid_upi = True
                if "@" not in result.payee_vpa:
                    result.signals.append({
                        "code": "MALFORMED_VPA",
                        "title": "Malformed UPI ID",
                        "description": "The recipient handle is missing the standard @ provider delimiter.",
                        "severity": "high",
                    })

            # Check transaction note for suspicious phrasing
            if result.transaction_note:
                tn_lower = result.transaction_note.lower()
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
