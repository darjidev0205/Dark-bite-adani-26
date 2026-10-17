import pytest

from app.services.qr_service import SafeQRService


@pytest.fixture
def qr_service() -> SafeQRService:
    return SafeQRService()


def test_valid_upi_uri(qr_service: SafeQRService):
    uri = "upi://pay?pa=store@okhdfcbank&pn=SuperMarket&am=520.50&cu=INR&tn=Groceries"
    res = qr_service.analyze_upi_uri(uri)

    assert res.is_valid_upi is True
    assert res.payee_vpa == "store@okhdfcbank"
    assert res.payee_name == "SuperMarket"
    assert res.amount == 520.50
    assert res.currency == "INR"
    assert res.transaction_note == "Groceries"
    assert len(res.signals) == 0


def test_non_upi_qr_flagged(qr_service: SafeQRService):
    res = qr_service.analyze_upi_uri("https://example.com/pay")
    assert res.is_valid_upi is False
    assert any(s["code"] == "NON_UPI_QR" for s in res.signals)


def test_suspicious_note_in_qr(qr_service: SafeQRService):
    uri = "upi://pay?pa=unknown@okaxis&pn=BonusClaim&am=100.00&tn=Lottery%20Refund%20PIN"
    res = qr_service.analyze_upi_uri(uri)

    assert res.is_valid_upi is True
    signal_codes = [s["code"] for s in res.signals]
    assert any("QR_NOTE_" in code for code in signal_codes)
