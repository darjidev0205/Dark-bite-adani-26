import base64
import time
from abc import ABC, abstractmethod
from datetime import UTC, datetime
from typing import Any, Literal
import urllib.request
import urllib.error
import json

from app.config import get_settings

AccountReputationStatus = Literal[
    "VERIFIED_REPORTED_FRAUD",
    "SUSPICIOUS_INDICATORS",
    "NO_KNOWN_REPORTS",
    "UNVERIFIED",
    "NOT_APPLICABLE",
]

AnalysisSource = Literal["LOCAL_RULES", "VIRUSTOTAL", "CACHED_INTELLIGENCE"]


class ReputationLookupResult:
    def __init__(
        self,
        status: AccountReputationStatus,
        source: AnalysisSource,
        details: str,
        malicious_count: int = 0,
        total_engines: int = 0,
        lookup_timestamp: str | None = None,
    ):
        self.status = status
        self.source = source
        self.details = details
        self.malicious_count = malicious_count
        self.total_engines = total_engines
        self.lookup_timestamp = lookup_timestamp or datetime.now(UTC).isoformat()

    def to_dict(self) -> dict[str, Any]:
        return {
            "status": self.status,
            "source": self.source,
            "details": self.details,
            "malicious_count": self.malicious_count,
            "total_engines": self.total_engines,
            "lookup_timestamp": self.lookup_timestamp,
        }


class BaseReputationProvider(ABC):
    @abstractmethod
    def lookup_url(self, url: str) -> ReputationLookupResult:
        pass

    @abstractmethod
    def lookup_vpa(self, vpa: str) -> ReputationLookupResult:
        pass


class ReputationService(BaseReputationProvider):
    """
    Threat Intelligence and Account Reputation Gateway.
    - Integrates VirusTotal API when VIRUSTOTAL_API_KEY is configured.
    - Caches reputation responses in-memory with a configurable TTL.
    - Enforces strict HTTP timeouts and error resilience (never breaks the request lifecycle).
    - Distinguishes UNVERIFIED accounts from confirmed VERIFIED_REPORTED_FRAUD.
    - Falls back gracefully to LOCAL_RULES when external providers are unconfigured or offline.
    """

    def __init__(self):
        self._cache: dict[str, tuple[ReputationLookupResult, float]] = {}

    def _get_from_cache(self, key: str) -> ReputationLookupResult | None:
        if key in self._cache:
            entry, expire_at = self._cache[key]
            if time.time() < expire_at:
                return ReputationLookupResult(
                    status=entry.status,
                    source="CACHED_INTELLIGENCE",
                    details=f"{entry.details} (Cached)",
                    malicious_count=entry.malicious_count,
                    total_engines=entry.total_engines,
                    lookup_timestamp=entry.lookup_timestamp,
                )
            # Expired
            del self._cache[key]
        return None

    def _set_cache(self, key: str, result: ReputationLookupResult, ttl_seconds: int):
        self._cache[key] = (result, time.time() + ttl_seconds)

    def lookup_url(self, url: str) -> ReputationLookupResult:
        """
        Queries VirusTotal API v3 for URL reputation if API key is configured.
        Returns UNVERIFIED or NO_KNOWN_REPORTS without penalizing legitimate links.
        """
        if not url or not url.strip():
            return ReputationLookupResult(
                status="NOT_APPLICABLE",
                source="LOCAL_RULES",
                details="No URL supplied for reputation lookup.",
            )

        clean_url = url.strip()
        cache_key = f"url:{clean_url}"
        cached = self._get_from_cache(cache_key)
        if cached:
            return cached

        settings = get_settings()
        api_key = settings.VIRUSTOTAL_API_KEY

        if not api_key or not api_key.strip():
            # Honest UNVERIFIED state without external threat intelligence
            res = ReputationLookupResult(
                status="UNVERIFIED",
                source="LOCAL_RULES",
                details="External threat intelligence provider not configured. Evaluated with local heuristic security rules.",
            )
            return res

        try:
            # VirusTotal API v3 URL identifier format: base64 without padding
            url_id = base64.urlsafe_b64encode(clean_url.encode()).decode().strip("=")
            endpoint = f"https://www.virustotal.com/api/v3/urls/{url_id}"

            req = urllib.request.Request(
                endpoint,
                headers={
                    "x-apikey": api_key.strip(),
                    "Accept": "application/json",
                    "User-Agent": "UPIShield-ThreatIntel/1.0",
                },
            )

            with urllib.request.urlopen(req, timeout=settings.REPUTATION_LOOKUP_TIMEOUT_SECONDS) as response:
                payload = json.loads(response.read().decode())
                attributes = payload.get("data", {}).get("attributes", {})
                stats = attributes.get("last_analysis_stats", {})

                malicious = stats.get("malicious", 0)
                suspicious = stats.get("suspicious", 0)
                harmless = stats.get("harmless", 0)
                undetected = stats.get("undetected", 0)
                total = malicious + suspicious + harmless + undetected

                if malicious >= 3:
                    res = ReputationLookupResult(
                        status="VERIFIED_REPORTED_FRAUD",
                        source="VIRUSTOTAL",
                        details=f"VirusTotal threat intelligence confirmed {malicious}/{total} security vendors flagged this URL as malicious/phishing.",
                        malicious_count=malicious,
                        total_engines=total,
                    )
                elif malicious > 0 or suspicious >= 2:
                    res = ReputationLookupResult(
                        status="SUSPICIOUS_INDICATORS",
                        source="VIRUSTOTAL",
                        details=f"VirusTotal detected {malicious + suspicious}/{total} suspicious or low-confidence detections.",
                        malicious_count=malicious,
                        total_engines=total,
                    )
                else:
                    res = ReputationLookupResult(
                        status="NO_KNOWN_REPORTS",
                        source="VIRUSTOTAL",
                        details=f"VirusTotal reported 0 malicious detections across {total} security vendors.",
                        malicious_count=0,
                        total_engines=total,
                    )

                self._set_cache(cache_key, res, settings.REPUTATION_CACHE_TTL_SECONDS)
                return res

        except urllib.error.HTTPError as http_err:
            if http_err.code == 404:
                # URL is not currently indexed in VirusTotal
                res = ReputationLookupResult(
                    status="NO_KNOWN_REPORTS",
                    source="VIRUSTOTAL",
                    details="URL has not been submitted or reported to VirusTotal intelligence database.",
                )
                self._set_cache(cache_key, res, settings.REPUTATION_CACHE_TTL_SECONDS)
                return res
            elif http_err.code == 429:
                # Rate limit exceeded
                return ReputationLookupResult(
                    status="UNVERIFIED",
                    source="LOCAL_RULES",
                    details="External threat provider rate limit reached. Local security heuristics applied.",
                )
            else:
                return ReputationLookupResult(
                    status="UNVERIFIED",
                    source="LOCAL_RULES",
                    details=f"External provider returned HTTP {http_err.code}. Local security heuristics applied.",
                )
        except Exception:
            # Network timeout, DNS error, or offline
            return ReputationLookupResult(
                status="UNVERIFIED",
                source="LOCAL_RULES",
                details="External threat intelligence service timed out or unavailable. Local security heuristics applied.",
            )

    def lookup_vpa(self, vpa: str) -> ReputationLookupResult:
        """
        Assesses UPI VPA account reputation.
        Never fabricates account verification or fraud reports.
        Missing external reputation information does not penalize the user.
        """
        if not vpa or not vpa.strip():
            return ReputationLookupResult(
                status="NOT_APPLICABLE",
                source="LOCAL_RULES",
                details="No payee UPI ID specified in request.",
            )

        clean_vpa = vpa.strip()

        # Offline heuristic check for obvious phishing keywords in handle
        suspicious_handle_keywords = ["customer-care", "support-desk", "refund-desk", "kyc-update", "nodal-office"]
        vpa_lower = clean_vpa.lower()
        if any(k in vpa_lower for k in suspicious_handle_keywords):
            return ReputationLookupResult(
                status="SUSPICIOUS_INDICATORS",
                source="LOCAL_RULES",
                details=f"The recipient address '{clean_vpa}' contains deceptive customer-support keywords.",
            )

        # Standard VPA with no external blacklist report
        return ReputationLookupResult(
            status="UNVERIFIED",
            source="LOCAL_RULES",
            details="Recipient address has no authoritative third-party verification badge. Always confirm payee identity before paying.",
        )
