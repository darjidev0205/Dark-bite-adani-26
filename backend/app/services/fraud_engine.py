import re
from typing import Any, Literal
from pydantic import BaseModel, Field

from app.schemas.scan import RiskLevel, ScanAnalyzeRequest, ScanSignal
from app.services.qr_service import SafeQRService, UPIQRAnalysisResult
from app.services.reputation_service import (
    AccountReputationStatus,
    AnalysisSource,
    ReputationLookupResult,
    ReputationService,
)
from app.services.url_analyzer import SafeURLAnalyzer


class ScoreContribution(BaseModel):
    rule_code: str = Field(..., description="Unique rule code that contributed points")
    points: int = Field(..., description="Risk points contributed (0-100)")
    evidence: str = Field(..., description="Exact substring or parameter triggering the rule")
    rationale: str = Field(..., description="Explanation of why this rule contributes risk")


class FraudEngineRuleConfig:
    """
    Configurable, versioned rule weights for auditability and compliance.
    Evidence-based weighting calibrated against real-world UPI threat vectors.
    """
    VERSION: str = "2.0.0"

    # Evidence-based rule weights
    WEIGHT_PIN_TO_RECEIVE: int = 50       # Safety critical: PIN requested to receive funds
    WEIGHT_OTP_OR_PASSWORD: int = 50      # Safety critical: OTP or netbanking password harvesting
    WEIGHT_DECEPTIVE_URL: int = 30        # Verified deceptive or phishing URL
    WEIGHT_DECEPTIVE_LURE: int = 25       # Deceptive lure (lottery, fake refund, cashback bait)
    WEIGHT_URGENCY_OR_THREAT: int = 20    # Artificial panic deadline (KYC block, power cutoff)
    WEIGHT_MALFORMED_VPA: int = 25        # Broken or invalid destination VPA
    WEIGHT_IMPERSONATION_HANDLE: int = 25 # Generic "support/refund/helpdesk" handle spoofing

    # Normal parameters contribute exactly 0 points
    WEIGHT_STANDARD_UPI_URI: int = 0
    WEIGHT_UNVERIFIED_ACCOUNT: int = 0
    WEIGHT_UNKNOWN_PAYLOAD: int = 0

    # Risk thresholds
    THRESHOLD_LOW_MAX: int = 19
    THRESHOLD_MEDIUM_MAX: int = 49
    # 50 and above is HIGH


class FraudAnalysisReport(BaseModel):
    risk_score: int
    risk_level: RiskLevel
    summary: str
    signals: list[ScanSignal]
    evidence: list[str]
    score_contributions: list[ScoreContribution]
    account_reputation_status: AccountReputationStatus
    payee_vpa: str | None = None
    payee_name: str | None = None
    amount: float | None = None
    analysis_source: AnalysisSource
    recommended_action: str
    disclaimer: str = "This is an evidence-based heuristic assessment, not a definitive fraud determination."


class FraudDetectionEngine:
    """
    Deterministic, explainable evidence-based fraud detection engine for UPI requests.
    Calculates normalized risk scores (0-100) strictly from detected indicators.
    Never penalizes standard UPI parameters or unverified accounts without evidence.
    """

    def __init__(self, config: FraudEngineRuleConfig | None = None):
        self.config = config or FraudEngineRuleConfig()
        self.url_analyzer = SafeURLAnalyzer()
        self.qr_service = SafeQRService()
        self.reputation_service = ReputationService()

        # Regex patterns for social engineering attacks
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
        Backward-compatible method returning (risk_score, risk_level, signals, recommended_action).
        """
        report = self.analyze_detailed(
            text=request.message or "",
            url=request.url,
            request_type=request.input_type,
            recipient_name=request.recipient_name,
            amount=request.amount,
        )
        return report.risk_score, report.risk_level, report.signals, report.recommended_action

    def analyze_detailed(
        self,
        text: str,
        url: str | None = None,
        request_type: str = "message",
        recipient_name: str | None = None,
        amount: float | None = None,
    ) -> FraudAnalysisReport:
        """
        Core evidence-driven scoring evaluation.
        Produces full structured report including score contributions,
        account reputation status, and deduplicated signals.
        """
        score = 0
        signals: list[ScanSignal] = []
        evidence_list: list[str] = []
        score_contributions: list[ScoreContribution] = []
        triggered_codes: set[str] = set()
        safety_critical_flag = False

        account_reputation_status: AccountReputationStatus = "UNVERIFIED"
        analysis_source: AnalysisSource = "LOCAL_RULES"
        payee_vpa: str | None = None
        payee_name: str | None = recipient_name
        extracted_amount: float | None = amount

        clean_text = (text or "").strip()

        # ----------------------------------------------------------------------
        # 1. QR PAYLOAD PARSING & EVALUATION
        # ----------------------------------------------------------------------
        if request_type == "qr" or clean_text.lower().startswith("upi://pay"):
            qr_res: UPIQRAnalysisResult = self.qr_service.analyze_upi_uri(clean_text)

            if qr_res.is_valid_upi:
                payee_vpa = qr_res.payee_vpa
                if qr_res.payee_name and not payee_name:
                    payee_name = qr_res.payee_name
                if qr_res.amount is not None and extracted_amount is None:
                    extracted_amount = qr_res.amount

                # Evaluate signals emitted by SafeQRService
                for s in qr_res.signals:
                    sig_code = s["code"]
                    if sig_code not in triggered_codes:
                        triggered_codes.add(sig_code)

                        if sig_code == "QR_PIN_TO_RECEIVE":
                            score += self.config.WEIGHT_PIN_TO_RECEIVE
                            safety_critical_flag = True
                            score_contributions.append(
                                ScoreContribution(
                                    rule_code=sig_code,
                                    points=self.config.WEIGHT_PIN_TO_RECEIVE,
                                    evidence=qr_res.transaction_note or clean_text[:80],
                                    rationale="QR transaction note deceptively claims a UPI PIN is required to receive money.",
                                )
                            )
                        elif sig_code.startswith("QR_NOTE_") or sig_code == "QR_DECEPTIVE_LURE_NOTE":
                            score += self.config.WEIGHT_DECEPTIVE_LURE
                            score_contributions.append(
                                ScoreContribution(
                                    rule_code=sig_code,
                                    points=self.config.WEIGHT_DECEPTIVE_LURE,
                                    evidence=qr_res.transaction_note or clean_text[:80],
                                    rationale="QR transaction note uses lottery/cashback bait commonly seen in collect fraud.",
                                )
                            )
                        elif sig_code in ("MALFORMED_VPA", "MISSING_PAYEE_VPA"):
                            score += self.config.WEIGHT_MALFORMED_VPA
                            score_contributions.append(
                                ScoreContribution(
                                    rule_code=sig_code,
                                    points=self.config.WEIGHT_MALFORMED_VPA,
                                    evidence=qr_res.payee_vpa or clean_text[:80],
                                    rationale=s["description"],
                                )
                            )
                        elif sig_code == "NON_UPI_QR":
                            # Informational signal; does not contribute risk score
                            pass

                        signals.append(
                            ScanSignal(
                                code=sig_code,
                                title=s["title"],
                                description=s["description"],
                                severity=s["severity"],  # type: ignore
                            )
                        )
                        evidence_list.append(s["description"])

                # Standard valid parameters add ZERO points
                if not qr_res.signals:
                    # Legitimate UPI QR code without warning signs
                    account_reputation_status = "UNVERIFIED"

            elif qr_res.payload_type == "WEB_URL":
                # Web URL embedded inside QR code
                url = clean_text
            else:
                # Plain text or custom QR format: evaluate content for text patterns
                pass

        # ----------------------------------------------------------------------
        # 2. MESSAGE / TEXT CONTENT ANALYSIS
        # ----------------------------------------------------------------------
        if clean_text:
            # Rule A: Enter UPI PIN to receive money (+50) [SAFETY CRITICAL]
            if self.pin_receive_pattern.search(clean_text) or self.pin_generic_receive_pattern.search(clean_text):
                if "PIN_REQUEST_RECEIVE" not in triggered_codes:
                    triggered_codes.add("PIN_REQUEST_RECEIVE")
                    score += self.config.WEIGHT_PIN_TO_RECEIVE
                    safety_critical_flag = True
                    match_snippet = clean_text[:100]
                    score_contributions.append(
                        ScoreContribution(
                            rule_code="PIN_REQUEST_RECEIVE",
                            points=self.config.WEIGHT_PIN_TO_RECEIVE,
                            evidence=match_snippet,
                            rationale="Entering a UPI PIN always debits funds from your account. Receiving money never requires a PIN.",
                        )
                    )
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
                    evidence_list.append(match_snippet)

            # Rule B: Request for OTP or Password (+50) [SAFETY CRITICAL]
            if self.otp_pattern.search(clean_text) or self.password_pattern.search(clean_text):
                if "CREDENTIAL_OR_OTP_DEMAND" not in triggered_codes:
                    triggered_codes.add("CREDENTIAL_OR_OTP_DEMAND")
                    score += self.config.WEIGHT_OTP_OR_PASSWORD
                    safety_critical_flag = True
                    match_snippet = clean_text[:100]
                    score_contributions.append(
                        ScoreContribution(
                            rule_code="CREDENTIAL_OR_OTP_DEMAND",
                            points=self.config.WEIGHT_OTP_OR_PASSWORD,
                            evidence=match_snippet,
                            rationale="Legitimate banking institutions never ask customers to share verification codes or passwords.",
                        )
                    )
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
                    evidence_list.append(match_snippet)

            # Rule C: Urgent threat or coercive language (+20)
            if self.urgency_pattern.search(clean_text):
                if "URGENCY_COERCION" not in triggered_codes:
                    triggered_codes.add("URGENCY_COERCION")
                    score += self.config.WEIGHT_URGENCY_OR_THREAT
                    match_snippet = clean_text[:100]
                    score_contributions.append(
                        ScoreContribution(
                            rule_code="URGENCY_COERCION",
                            points=self.config.WEIGHT_URGENCY_OR_THREAT,
                            evidence=match_snippet,
                            rationale="Artificial urgency and threats are used by scammers to rush victims into unauthorized actions.",
                        )
                    )
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
                    evidence_list.append(match_snippet)

            # Rule D: Suspicious refund or reward framing (+25)
            if self.refund_reward_pattern.search(clean_text):
                if "REWARD_REFUND_BAIT" not in triggered_codes:
                    triggered_codes.add("REWARD_REFUND_BAIT")
                    score += self.config.WEIGHT_DECEPTIVE_LURE
                    match_snippet = clean_text[:100]
                    score_contributions.append(
                        ScoreContribution(
                            rule_code="REWARD_REFUND_BAIT",
                            points=self.config.WEIGHT_DECEPTIVE_LURE,
                            evidence=match_snippet,
                            rationale="Unsolicited refund, lottery, or cashback claims are classic social engineering lures.",
                        )
                    )
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
                    evidence_list.append(match_snippet)

            # Embedded web URL detection inside message text (skip upi://)
            url_matches = re.findall(r"https?://[^\s]+", clean_text)
            if url_matches and not url:
                url = url_matches[0]

        # ----------------------------------------------------------------------
        # 3. URL EVALUATION & THREAT INTELLIGENCE
        # ----------------------------------------------------------------------
        if url and not url.lower().startswith("upi://"):
            # Static heuristic analysis
            url_res = self.url_analyzer.analyze(url)
            if url_res.is_suspicious:
                for indicator in url_res.risk_indicators:
                    code = indicator["code"]
                    if code not in triggered_codes:
                        triggered_codes.add(code)
                        pts = self.config.WEIGHT_DECEPTIVE_URL
                        score += pts
                        score_contributions.append(
                            ScoreContribution(
                                rule_code=code,
                                points=pts,
                                evidence=url[:100],
                                rationale=indicator["description"],
                            )
                        )
                        signals.append(
                            ScanSignal(
                                code=code,
                                title=indicator["title"],
                                description=indicator["description"],
                                severity=indicator["severity"],  # type: ignore
                            )
                        )
                        evidence_list.append(indicator["title"])

            # Query Reputation Provider if available
            try:
                rep_res = self.reputation_service.lookup_url(url)
            except Exception:
                rep_res = ReputationLookupResult(
                    status="UNVERIFIED",
                    source="LOCAL_RULES",
                    details="External threat lookup unavailable. Evaluated with local security heuristics.",
                )
            analysis_source = rep_res.source
            if rep_res.status == "VERIFIED_REPORTED_FRAUD":
                account_reputation_status = "VERIFIED_REPORTED_FRAUD"
                if "REPUTATION_CONFIRMED_FRAUD" not in triggered_codes:
                    triggered_codes.add("REPUTATION_CONFIRMED_FRAUD")
                    score += 60
                    score_contributions.append(
                        ScoreContribution(
                            rule_code="REPUTATION_CONFIRMED_FRAUD",
                            points=60,
                            evidence=url[:100],
                            rationale=rep_res.details,
                        )
                    )
                    signals.append(
                        ScanSignal(
                            code="REPUTATION_CONFIRMED_FRAUD",
                            title="Confirmed malicious link in threat database",
                            description=rep_res.details,
                            severity="high",
                        )
                    )
                    evidence_list.append(rep_res.details)
            elif rep_res.status == "NO_KNOWN_REPORTS":
                if account_reputation_status != "VERIFIED_REPORTED_FRAUD":
                    account_reputation_status = "NO_KNOWN_REPORTS"

        # ----------------------------------------------------------------------
        # 4. RECIPIENT & VPA ANALYSIS
        # ----------------------------------------------------------------------
        if recipient_name:
            recip = recipient_name.strip()
            suspicious_handle_keywords = ["customer", "support", "helpdesk", "refund", "kyc", "nodal", "official"]
            recip_lower = recip.lower()
            if any(k in recip_lower for k in suspicious_handle_keywords):
                code = "SUSPICIOUS_RECIPIENT_KEYWORDS"
                if code not in triggered_codes:
                    triggered_codes.add(code)
                    pts = 15
                    score += pts
                    score_contributions.append(
                        ScoreContribution(
                            rule_code=code,
                            points=pts,
                            evidence=recip,
                            rationale="Recipient name contains generic support/banking keywords commonly used in impersonation scams.",
                        )
                    )
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
                    evidence_list.append(recip)
            elif request_type == "recipient":
                code = "UNVERIFIED_RECIPIENT"
                if code not in triggered_codes:
                    triggered_codes.add(code)
                    pts = 15
                    score += pts
                    score_contributions.append(
                        ScoreContribution(
                            rule_code=code,
                            points=pts,
                            evidence=recip,
                            rationale="Unknown recipient identity evaluated under recipient verification check.",
                        )
                    )
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
                    evidence_list.append(recip)

        vpa_to_check = payee_vpa or (recipient_name if recipient_name and "@" in recipient_name else None)
        if vpa_to_check:
            # Query VPA reputation
            vpa_rep = self.reputation_service.lookup_vpa(vpa_to_check)
            if vpa_rep.status == "SUSPICIOUS_INDICATORS":
                if "SUSPICIOUS_RECIPIENT_KEYWORDS" not in triggered_codes:
                    triggered_codes.add("SUSPICIOUS_RECIPIENT_KEYWORDS")
                    score += self.config.WEIGHT_IMPERSONATION_HANDLE
                    score_contributions.append(
                        ScoreContribution(
                            rule_code="SUSPICIOUS_RECIPIENT_KEYWORDS",
                            points=self.config.WEIGHT_IMPERSONATION_HANDLE,
                            evidence=vpa_to_check,
                            rationale="Recipient handle uses generic customer support keywords to impersonate official institutions.",
                        )
                    )
                    signals.append(
                        ScanSignal(
                            code="SUSPICIOUS_RECIPIENT_KEYWORDS",
                            title="Misleading recipient entity name",
                            description=(
                                f"The recipient '{vpa_to_check}' contains support/banking keywords. "
                                "Scammers frequently set handles like 'Customer Care' to deceive victims."
                            ),
                            severity="medium",
                        )
                    )
                    evidence_list.append(vpa_to_check)

        # ----------------------------------------------------------------------
        # 5. HIGH-VALUE ANOMALY ADVISORY
        # ----------------------------------------------------------------------
        if extracted_amount and extracted_amount > 50000:
            if "HIGH_VALUE_TRANSACTION" not in triggered_codes:
                triggered_codes.add("HIGH_VALUE_TRANSACTION")
                # Advisory flag (does not inflate score to fraud levels)
                signals.append(
                    ScanSignal(
                        code="HIGH_VALUE_TRANSACTION",
                        title="High-value payment amount",
                        description=(
                            f"Payment of Rs. {extracted_amount:,.2f} exceeds standard retail consumer thresholds. "
                            "Double check the beneficiary before authorizing."
                        ),
                        severity="medium",
                    )
                )
                evidence_list.append(f"Amount: Rs. {extracted_amount:,.2f}")

        # ----------------------------------------------------------------------
        # 6. REPUTATION & EVIDENCE HARMONIZATION
        # ----------------------------------------------------------------------
        # Distinguish Request Risk from Account Reputation
        if account_reputation_status != "VERIFIED_REPORTED_FRAUD":
            if any(s.severity == "high" for s in signals):
                account_reputation_status = "SUSPICIOUS_INDICATORS"
            elif signals:
                account_reputation_status = "SUSPICIOUS_INDICATORS"
            elif payee_vpa or recipient_name:
                account_reputation_status = "UNVERIFIED"
            else:
                account_reputation_status = "NOT_APPLICABLE"

        # Cap score at 100
        risk_score = min(score, 100)

        # Determine risk level based on normalized thresholds
        if risk_score <= self.config.THRESHOLD_LOW_MAX:
            risk_level: RiskLevel = "low"
        elif risk_score <= self.config.THRESHOLD_MEDIUM_MAX:
            risk_level = "medium"
        else:
            risk_level = "high"

        # Safety-critical override
        if safety_critical_flag:
            risk_level = "high"
            if risk_score < 50:
                risk_score = 50

        # Formulate actionable summary and recommendations
        summary = self._formulate_summary(risk_level, triggered_codes, signals)
        recommended_action = self._determine_recommended_action(risk_level, triggered_codes)

        return FraudAnalysisReport(
            risk_score=risk_score,
            risk_level=risk_level,
            summary=summary,
            signals=signals,
            evidence=evidence_list,
            score_contributions=score_contributions,
            account_reputation_status=account_reputation_status,
            payee_vpa=payee_vpa,
            payee_name=payee_name,
            amount=extracted_amount,
            analysis_source=analysis_source,
            recommended_action=recommended_action,
        )

    def _formulate_summary(self, risk_level: RiskLevel, triggered_codes: set[str], signals: list[ScanSignal]) -> str:
        if risk_level == "high":
            if "PIN_REQUEST_RECEIVE" in triggered_codes:
                return "CRITICAL WARNING: This request asks you to enter your UPI PIN to receive money. This is an active PIN fraud attempt."
            if "CREDENTIAL_OR_OTP_DEMAND" in triggered_codes:
                return "CRITICAL WARNING: Request attempts to steal your OTP or netbanking security credentials."
            if "REPUTATION_CONFIRMED_FRAUD" in triggered_codes:
                return "HIGH RISK: The destination web link is confirmed as an active phishing/malicious destination in threat intelligence feeds."
            return "This request contains high-risk indicators commonly associated with payment fraud or social engineering."
        elif risk_level == "medium":
            return "This request exhibits suspicious warning signs. Exercise caution before approving or entering credentials."
        else:
            return "No known suspicious indicators were detected based on heuristic evaluation. Always verify recipient details before paying."

    def _determine_recommended_action(self, risk_level: RiskLevel, triggered_codes: set[str]) -> str:
        if "PIN_REQUEST_RECEIVE" in triggered_codes or "QR_PIN_TO_RECEIVE" in triggered_codes:
            return "Do not enter your UPI PIN. UPI PIN is only entered to pay money, never to receive it. Decline this request immediately."
        if "CREDENTIAL_OR_OTP_DEMAND" in triggered_codes:
            return "Never share your OTP or netbanking password with anyone. Official representatives will never ask for verification codes."
        if "BRAND_IMPERSONATION" in triggered_codes or "REPUTATION_CONFIRMED_FRAUD" in triggered_codes:
            return "Do not open this link or input your payment details. The destination is unauthorized and may attempt to steal credentials."
        if risk_level == "high":
            return "Do not proceed with this payment or collect request. Independently verify the sender through trusted official contact numbers."
        if risk_level == "medium":
            return "Exercise caution. Confirm whether you are sending or receiving funds, and check the payee name on your banking confirmation screen."
        return "No high-risk indicators detected. Always confirm recipient name and amount on your bank screen before entering your PIN."
