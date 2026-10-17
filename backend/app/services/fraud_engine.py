import re

from app.schemas.scan import RiskLevel, ScanAnalyzeRequest, ScanSignal
from app.services.url_analyzer import SafeURLAnalyzer


class FraudEngineRuleConfig:
    """
    Configurable, versioned rule weights for auditability and compliance.
    """
    VERSION: str = "1.0.0"

    # Rule weights as specified in requirements
    WEIGHT_PIN_TO_RECEIVE: int = 50
    WEIGHT_OTP_OR_PASSWORD: int = 50
    WEIGHT_DECEPTIVE_URL: int = 30
    WEIGHT_URGENCY_OR_THREAT: int = 20
    WEIGHT_UNKNOWN_RECIPIENT: int = 15
    WEIGHT_REFUND_OR_REWARD: int = 15

    # Thresholds
    THRESHOLD_LOW_MAX: int = 19
    THRESHOLD_MEDIUM_MAX: int = 49
    # 50 and above is HIGH


class FraudDetectionEngine:
    """
    Deterministic, explainable rule-based fraud detection engine for UPI requests.
    Evaluates incoming payment messages, URLs, and recipient queries against
    known social engineering attack vectors.
    """

    def __init__(self, config: FraudEngineRuleConfig | None = None):
        self.config = config or FraudEngineRuleConfig()
        self.url_analyzer = SafeURLAnalyzer()

        # Precompiled regex patterns for accurate, un-duplicated detection
        self.pin_receive_pattern = re.compile(
            r"(?i)(?:enter|share|type|send|provide|put)\s+(?:your\s+)?(?:upi\s+)?pin\s+(?:to|for)\s+(?:receive|claim|get|accept|credit|refund)",
        )
        self.pin_generic_receive_pattern = re.compile(
            r"(?i)(?:receive|get|claim|credit)\s+(?:money|cash|cashback|refund|rs\.?|inr|\d+).*?(?:enter|share|give)\s+(?:upi\s+)?pin",
        )
        self.otp_pattern = re.compile(
            r"(?i)(?:enter|share|send|forward|tell|provide)\s+(?:the\s+|your\s+|this\s+)?(?:otp|one\s*time\s*password|verification\s*code|sms\s*code)",
        )
        self.password_pattern = re.compile(
            r"(?i)(?:enter|share|give|send|provide)\s+(?:the\s+|your\s+)?(?:netbanking\s+)?(?:password|credential)",
        )
        self.urgency_pattern = re.compile(
            r"(?i)(?:immediately|urgent|within\s+\d+\s*(?:mins?|minutes?|hours?)|account\s+(?:will\s+be\s+)?(?:blocked|suspended|frozen|deactivated)|electricity\s+power\s+cut|sim\s+block|kyc\s+(?:expired|suspended|mandatory|update))",
        )
        self.refund_reward_pattern = re.compile(
            r"(?i)(?:congratulations|you\s+have\s+won|lottery|lucky\s+draw|cashback\s+of\s+rs|refund\s+approved|claim\s+reward|bonus\s+credited)",
        )

    def analyze(self, request: ScanAnalyzeRequest) -> tuple[int, RiskLevel, list[ScanSignal], str]:
        """
        Executes deterministic rules across input data.
        Returns:
            (risk_score, risk_level, deduplicated_signals, recommended_action)
        """
        score = 0
        signals: list[ScanSignal] = []
        triggered_codes = set()
        safety_critical_flag = False

        # ----------------------------------------------------------------------
        # 1. MESSAGE ANALYSIS
        # ----------------------------------------------------------------------
        if request.message:
            msg = request.message

            # Rule A: Enter UPI PIN to receive money (+50) [SAFETY CRITICAL]
            if self.pin_receive_pattern.search(msg) or self.pin_generic_receive_pattern.search(msg):
                if "PIN_REQUEST_RECEIVE" not in triggered_codes:
                    score += self.config.WEIGHT_PIN_TO_RECEIVE
                    safety_critical_flag = True
                    triggered_codes.add("PIN_REQUEST_RECEIVE")
                    signals.append(
                        ScanSignal(
                            code="PIN_REQUEST_RECEIVE",
                            title="UPI PIN requested to receive money",
                            description=(
                                "A UPI PIN is ONLY entered to deduct money from your account. "
                                "Receiving money in UPI NEVER requires entering a PIN. This is a common fraud tactic."
                            ),
                            severity="high",
                        )
                    )

            # Rule B: Request for OTP or Password (+50) [SAFETY CRITICAL]
            if self.otp_pattern.search(msg) or self.password_pattern.search(msg):
                if "CREDENTIAL_OR_OTP_DEMAND" not in triggered_codes:
                    score += self.config.WEIGHT_OTP_OR_PASSWORD
                    safety_critical_flag = True
                    triggered_codes.add("CREDENTIAL_OR_OTP_DEMAND")
                    signals.append(
                        ScanSignal(
                            code="CREDENTIAL_OR_OTP_DEMAND",
                            title="OTP or security password requested",
                            description=(
                                "Legitimate banks and UPI apps never ask you to share an OTP, verification code, "
                                "or password via SMS, WhatsApp, or phone call."
                            ),
                            severity="high",
                        )
                    )

            # Rule C: Urgent threat or coercive language (+20)
            if self.urgency_pattern.search(msg):
                if "URGENCY_COERCION" not in triggered_codes:
                    score += self.config.WEIGHT_URGENCY_OR_THREAT
                    triggered_codes.add("URGENCY_COERCION")
                    signals.append(
                        ScanSignal(
                            code="URGENCY_COERCION",
                            title="Urgent threat or coercive deadline",
                            description=(
                                "The message uses artificial panic tactics (e.g. account blocking, power cutoff, "
                                "or urgent KYC deadline) to pressure you into acting without thinking."
                            ),
                            severity="medium",
                        )
                    )

            # Rule D: Suspicious refund or reward framing (+15)
            if self.refund_reward_pattern.search(msg):
                if "REWARD_REFUND_BAIT" not in triggered_codes:
                    score += self.config.WEIGHT_REFUND_OR_REWARD
                    triggered_codes.add("REWARD_REFUND_BAIT")
                    signals.append(
                        ScanSignal(
                            code="REWARD_REFUND_BAIT",
                            title="Unsolicited reward or refund lure",
                            description=(
                                "Unsolicited lottery, cashback, or refund messages are classic lures designed to "
                                "induce victims to approve unauthorized debit requests."
                            ),
                            severity="medium",
                        )
                    )

            # Embedded URL detection inside message text
            url_matches = re.findall(r"https?://[^\s]+", msg)
            if url_matches:
                for embedded_url in url_matches:
                    url_res = self.url_analyzer.analyze(embedded_url)
                    if url_res.is_suspicious:
                        for indicator in url_res.risk_indicators:
                            code = f"EMBEDDED_{indicator['code']}"
                            if code not in triggered_codes:
                                score += self.config.WEIGHT_DECEPTIVE_URL
                                triggered_codes.add(code)
                                signals.append(
                                    ScanSignal(
                                        code=code,
                                        title=indicator["title"],
                                        description=indicator["description"],
                                        severity=indicator["severity"],  # type: ignore
                                    )
                                )

        # ----------------------------------------------------------------------
        # 2. URL ANALYSIS (When input_type is url or url provided)
        # ----------------------------------------------------------------------
        if request.url:
            url_res = self.url_analyzer.analyze(request.url)
            if url_res.is_suspicious:
                for indicator in url_res.risk_indicators:
                    code = indicator["code"]
                    if code not in triggered_codes:
                        score += self.config.WEIGHT_DECEPTIVE_URL
                        triggered_codes.add(code)
                        signals.append(
                            ScanSignal(
                                code=code,
                                title=indicator["title"],
                                description=indicator["description"],
                                severity=indicator["severity"],  # type: ignore
                            )
                        )

        # ----------------------------------------------------------------------
        # 3. RECIPIENT ANALYSIS
        # ----------------------------------------------------------------------
        if request.recipient_name:
            recip = request.recipient_name.strip()
            # Distinguish missing verification from scam evidence:
            # Check for suspicious impersonation keywords in recipient handle/name
            suspicious_handle_keywords = ["customer", "support", "helpdesk", "refund", "kyc", "nodal", "official"]
            recip_lower = recip.lower()
            if any(k in recip_lower for k in suspicious_handle_keywords):
                code = "SUSPICIOUS_RECIPIENT_KEYWORDS"
                if code not in triggered_codes:
                    score += self.config.WEIGHT_UNKNOWN_RECIPIENT
                    triggered_codes.add(code)
                    signals.append(
                        ScanSignal(
                            code=code,
                            title="Misleading recipient entity name",
                            description=(
                                f"The recipient name '{recip}' contains generic support/banking keywords. "
                                "Scammers frequently set their display names to 'Customer Care' or 'KYC Support' to deceive users."
                            ),
                            severity="medium",
                        )
                    )
            elif request.input_type == "recipient":
                # For an unknown recipient without verification signals
                code = "UNVERIFIED_RECIPIENT"
                if code not in triggered_codes:
                    score += self.config.WEIGHT_UNKNOWN_RECIPIENT
                    triggered_codes.add(code)
                    signals.append(
                        ScanSignal(
                            code=code,
                            title="Unverified recipient identity",
                            description=(
                                "This recipient has no verified merchant badge or known history on this device. "
                                "Missing verification is an advisory reminder to verify the beneficiary before authorizing funds."
                            ),
                            severity="low",
                        )
                    )

        # ----------------------------------------------------------------------
        # 4. AMOUNT ANOMALIES
        # ----------------------------------------------------------------------
        if request.amount and request.amount > 50000:
            code = "HIGH_VALUE_TRANSACTION"
            if code not in triggered_codes:
                triggered_codes.add(code)
                signals.append(
                    ScanSignal(
                        code=code,
                        title="High-value payment amount",
                        description=(
                            f"Payment of Rs. {request.amount:,.2f} exceeds standard everyday retail thresholds. "
                            "Exercise extra caution and verify the recipient directly."
                        ),
                        severity="medium",
                    )
                )

        # ----------------------------------------------------------------------
        # 5. SCORE CAPPING & THRESHOLD CALCULATION
        # ----------------------------------------------------------------------
        # Cap score at 100
        risk_score = min(score, 100)

        # Determine risk level based on thresholds
        if risk_score <= self.config.THRESHOLD_LOW_MAX:
            risk_level: RiskLevel = "low"
        elif risk_score <= self.config.THRESHOLD_MEDIUM_MAX:
            risk_level = "medium"
        else:
            risk_level = "high"

        # Safety-critical override: Explicit PIN or OTP request demands High Risk warning
        if safety_critical_flag:
            risk_level = "high"
            if risk_score < 50:
                risk_score = 50

        # Synthesize clear, actionable recommendation
        recommended_action = self._determine_recommended_action(risk_level, triggered_codes)

        return risk_score, risk_level, signals, recommended_action

    def _determine_recommended_action(self, risk_level: RiskLevel, triggered_codes: set) -> str:
        """
        Produces context-aware, defensive guidance based on detected signals.
        """
        if "PIN_REQUEST_RECEIVE" in triggered_codes:
            return "Do not enter your UPI PIN. UPI PIN is only entered to pay money, never to receive it. Decline this request immediately."
        if "CREDENTIAL_OR_OTP_DEMAND" in triggered_codes:
            return "Never share your OTP or netbanking password with anyone. Official representatives will never ask for verification codes."
        if "BRAND_IMPERSONATION" in triggered_codes or "EMBEDDED_BRAND_IMPERSONATION" in triggered_codes:
            return "Do not open this link or input your payment details. The website is an unauthorized clone attempting to steal your credentials."
        if risk_level == "high":
            return "Do not proceed with this payment or collect request. Independently verify the sender through trusted official contact numbers."
        if risk_level == "medium":
            return "Exercise caution. Confirm whether you are sending or receiving funds, and check the payee name on your banking confirmation screen."
        return "No high-risk indicators detected. Always confirm recipient name and amount on your bank screen before entering your PIN."
