import pytest

from app.services.url_analyzer import SafeURLAnalyzer


@pytest.fixture
def analyzer() -> SafeURLAnalyzer:
    return SafeURLAnalyzer()


def test_legitimate_url_safe(analyzer: SafeURLAnalyzer):
    res = analyzer.analyze("https://pay.google.com/about")
    assert res.is_suspicious is False
    assert len(res.risk_indicators) == 0
    assert res.live_reputation_checked is False
    assert "No outbound network connections" in res.reputation_disclaimer


def test_brand_spoofing_detected(analyzer: SafeURLAnalyzer):
    res = analyzer.analyze("http://paytm-kyc-verify-account.xyz/update")
    assert res.is_suspicious is True
    codes = [i["code"] for i in res.risk_indicators]
    assert "BRAND_IMPERSONATION" in codes
    assert "SUSPICIOUS_TLD" in codes
    assert "INSECURE_HTTP_SCHEME" in codes


def test_private_internal_ip_ssrf_safety(analyzer: SafeURLAnalyzer):
    """
    Prevent SSRF: Links pointing to localhost or private subnets are flagged as dangerous.
    """
    res = analyzer.analyze("http://192.168.1.1/router-login")
    assert res.is_suspicious is True
    codes = [i["code"] for i in res.risk_indicators]
    assert "INTERNAL_IP_HOST" in codes


def test_raw_public_ip_host(analyzer: SafeURLAnalyzer):
    res = analyzer.analyze("http://185.120.45.67/payment")
    assert res.is_suspicious is True
    codes = [i["code"] for i in res.risk_indicators]
    assert "RAW_IP_HOST" in codes


def test_dangerous_schemes(analyzer: SafeURLAnalyzer):
    res1 = analyzer.analyze("javascript:alert(document.cookie)")
    assert res1.is_suspicious is True
    assert "DANGEROUS_SCHEME" in [i["code"] for i in res1.risk_indicators]

    res2 = analyzer.analyze("data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==")
    assert res2.is_suspicious is True
    assert "DANGEROUS_SCHEME" in [i["code"] for i in res2.risk_indicators]


def test_malicious_apk_download(analyzer: SafeURLAnalyzer):
    res = analyzer.analyze("https://support-desk-help.com/downloads/customer_support.apk")
    assert res.is_suspicious is True
    codes = [i["code"] for i in res.risk_indicators]
    assert "MALICIOUS_DOWNLOAD" in codes


def test_embedded_userinfo_trick(analyzer: SafeURLAnalyzer):
    res = analyzer.analyze("https://google.com@phishing-target.net/login")
    assert res.is_suspicious is True
    codes = [i["code"] for i in res.risk_indicators]
    assert "EMBEDDED_USERINFO" in codes
