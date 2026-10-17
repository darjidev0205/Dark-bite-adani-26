import ipaddress
import re
from urllib.parse import urlparse

# Major payment brands frequently targeted by brand spoofing
TARGET_BRANDS = [
    "paytm",
    "phonepe",
    "gpay",
    "googlepay",
    "bhim",
    "sbi",
    "hdfc",
    "icici",
    "axis",
    "kotak",
    "npci",
    "cred",
    "amazonpay",
]

# Legitimate domains for the target brands
LEGIT_DOMAINS = {
    "paytm": ["paytm.com", "paytmbank.com"],
    "phonepe": ["phonepe.com"],
    "gpay": ["google.com", "pay.google.com"],
    "googlepay": ["google.com", "pay.google.com"],
    "bhim": ["bhimupi.org.in", "npci.org.in"],
    "sbi": ["onlinesbi.sbi", "sbi.co.in"],
    "hdfc": ["hdfcbank.com"],
    "icici": ["icicibank.com"],
    "axis": ["axisbank.com"],
    "kotak": ["kotak.com"],
    "npci": ["npci.org.in"],
    "cred": ["cred.club"],
    "amazonpay": ["amazon.in", "amazon.com"],
}

# Suspicious high-abuse Top Level Domains
SUSPICIOUS_TLDS = {
    "xyz", "top", "work", "click", "buzz", "gq", "ml", "cf", "ga", "tk", "loan", "men",
    "download", "racing", "date", "faith", "stream", "live", "vip"
}

# Dangerous extensions
DANGEROUS_EXTENSIONS = [".apk", ".exe", ".scr", ".bat", ".vbs", ".cmd", ".jar", ".ps1"]


class URLAnalysisResult:
    def __init__(self):
        self.is_suspicious: bool = False
        self.reasons: list[str] = []
        self.risk_indicators: list[dict[str, str]] = []
        self.hostname: str = ""
        self.scheme: str = ""
        self.live_reputation_checked: bool = False
        self.reputation_disclaimer: str = (
            "No outbound network connections were made. Safe offline heuristic analysis was performed to prevent SSRF."
        )


class SafeURLAnalyzer:
    """
    Safe static URL inspector for payment and collect links.
    Evaluates deceptive hostnames, IP literals, unsupported schemes, and risky patterns.
    Strictly avoids visiting submitted URLs or making external outbound DNS/HTTP calls.
    """

    def analyze(self, raw_url: str | None) -> URLAnalysisResult:
        result = URLAnalysisResult()
        if not raw_url or not raw_url.strip():
            return result

        clean_url = raw_url.strip()

        # Check for non-standard schemes before parsing
        scheme_match = re.match(r"^([a-zA-Z0-9_\-]+):", clean_url)
        scheme_prefix = scheme_match.group(1).lower() if scheme_match else ""

        if scheme_prefix in ("javascript", "data", "file", "vbscript", "about"):
            result.is_suspicious = True
            result.reasons.append(f"Dangerous URI scheme detected: '{scheme_prefix}:'")
            result.risk_indicators.append({
                "code": "DANGEROUS_SCHEME",
                "title": f"Dangerous scheme '{scheme_prefix}'",
                "description": f"The URI uses the forbidden '{scheme_prefix}:' pseudo-protocol, often used in browser exploits.",
                "severity": "high",
            })
            return result

        try:
            # If no scheme given, prepend http:// safely for URL parsing
            parse_target = clean_url if "://" in clean_url else f"http://{clean_url}"
            parsed = urlparse(parse_target)
        except Exception:
            result.is_suspicious = True
            result.reasons.append("Malformed URL syntax")
            result.risk_indicators.append({
                "code": "MALFORMED_URL",
                "title": "Malformed URL syntax",
                "description": "The submitted URL could not be parsed as a standard web address.",
                "severity": "medium",
            })
            return result

        result.scheme = parsed.scheme.lower()
        result.hostname = (parsed.hostname or "").lower()

        # 1. Scheme Check
        if result.scheme == "http":
            result.is_suspicious = True
            result.reasons.append("Unencrypted HTTP protocol used for financial interaction")
            result.risk_indicators.append({
                "code": "INSECURE_HTTP_SCHEME",
                "title": "Unencrypted HTTP link",
                "description": "Payment and login links must use secure HTTPS encryption. Plain HTTP exposes data to interception.",
                "severity": "medium",
            })
        elif result.scheme not in ("https", "upi"):
            result.is_suspicious = True
            result.reasons.append(f"Unsupported scheme: {result.scheme}")
            result.risk_indicators.append({
                "code": "UNSUPPORTED_SCHEME",
                "title": "Unsupported protocol",
                "description": f"The link uses protocol '{result.scheme}' rather than HTTPS.",
                "severity": "medium",
            })

        # 2. Hostname extraction & IP literal checks
        host = result.hostname
        if not host:
            result.is_suspicious = True
            result.reasons.append("URL is missing a valid hostname")
            return result

        # Check for IP literal host
        is_ip = False
        try:
            ip_obj = ipaddress.ip_address(host)
            is_ip = True
            result.is_suspicious = True
            if ip_obj.is_private or ip_obj.is_loopback or ip_obj.is_reserved or ip_obj.is_link_local:
                result.reasons.append(f"Internal/Private IP address host: {host}")
                result.risk_indicators.append({
                    "code": "INTERNAL_IP_HOST",
                    "title": "Private or internal IP host",
                    "description": "The URL targets a private/local network address, indicating a malicious SSRF or intranet exploit probe.",
                    "severity": "high",
                })
            else:
                result.reasons.append(f"Direct public IP host used: {host}")
                result.risk_indicators.append({
                    "code": "RAW_IP_HOST",
                    "title": "Numeric IP address host",
                    "description": "Legitimate banks and payment gateways use registered domain names, never raw numeric IP addresses.",
                    "severity": "high",
                })
        except ValueError:
            is_ip = False

        # If not an IP literal, evaluate domain characteristics
        if not is_ip:
            # Check Punycode / IDN Homograph
            if "xn--" in host:
                result.is_suspicious = True
                result.reasons.append("Punycode (internationalized domain) detected - possible homograph spoofing")
                result.risk_indicators.append({
                    "code": "PUNYCODE_HOMOGRAPH",
                    "title": "Internationalized domain spoofing",
                    "description": "The domain uses encoded characters that resemble standard letters to impersonate legitimate services.",
                    "severity": "high",
                })

            # Check Suspicious TLD
            tld = host.split(".")[-1] if "." in host else ""
            if tld in SUSPICIOUS_TLDS:
                result.is_suspicious = True
                result.reasons.append(f"High-risk TLD: '.{tld}'")
                result.risk_indicators.append({
                    "code": "SUSPICIOUS_TLD",
                    "title": f"High-risk domain extension (.{tld})",
                    "description": f"The link uses the '.{tld}' top-level domain, frequently associated with disposable phishing campaigns.",
                    "severity": "medium",
                })

            # Check Brand Spoofing / Typosquatting
            for brand in TARGET_BRANDS:
                if brand in host:
                    allowed = LEGIT_DOMAINS.get(brand, [])
                    # Verify if host is an exact allowed domain or legitimate subdomain
                    is_legit = any(host == d or host.endswith(f".{d}") for d in allowed)
                    if not is_legit:
                        result.is_suspicious = True
                        result.reasons.append(f"Unauthorized brand usage detected: '{brand}' on host '{host}'")
                        result.risk_indicators.append({
                            "code": "BRAND_IMPERSONATION",
                            "title": f"Possible {brand.upper()} brand spoofing",
                            "description": f"The domain mentions '{brand}' but is not an official domain authorized by the provider.",
                            "severity": "high",
                        })
                        break

            # Multi-level subdomains pattern (e.g. secure.login.verify.domain.com)
            parts = host.split(".")
            if len(parts) > 4:
                result.is_suspicious = True
                result.reasons.append("Excessive subdomain depth")
                result.risk_indicators.append({
                    "code": "EXCESSIVE_SUBDOMAINS",
                    "title": "Excessive subdomain hierarchy",
                    "description": "The URL has an unusually deep subdomain chain commonly used to obfuscate the real destination.",
                    "severity": "medium",
                })

        # 3. Path & Query checks
        path = parsed.path.lower()
        for ext in DANGEROUS_EXTENSIONS:
            if path.endswith(ext):
                result.is_suspicious = True
                result.reasons.append(f"Link attempts to download executable file: {ext}")
                result.risk_indicators.append({
                    "code": "MALICIOUS_DOWNLOAD",
                    "title": "Executable package download",
                    "description": f"The URL links directly to a {ext} executable or application package. Fraudsters use this to install remote access trojans (RATs).",
                    "severity": "high",
                })
                break

        # Check for userinfo embedded in authority (e.g. http://google.com@evil.com)
        if parsed.username or parsed.password:
            result.is_suspicious = True
            result.reasons.append("URL contains embedded credentials/userinfo")
            result.risk_indicators.append({
                "code": "EMBEDDED_USERINFO",
                "title": "Misleading URL authority (@ symbol)",
                "description": "The URL contains embedded credentials before '@', designed to trick users into misidentifying the true destination.",
                "severity": "high",
            })

        return result
