import json
import logging
import re
import sys
from typing import Any

# Redaction patterns for sensitive information
SENSITIVE_PATTERNS = [
    # Bearer tokens and JWTs
    (re.compile(r"Bearer\s+([A-Za-z0-9_\-\.]+)", re.IGNORECASE), "Bearer [REDACTED_TOKEN]"),
    (re.compile(r"eyJ[a-zA-Z0-9_\-]{10,}\.[a-zA-Z0-9_\-]{10,}\.[a-zA-Z0-9_\-]{10,}"), "[REDACTED_JWT]"),
    # UPI PINs (4 or 6 digit codes)
    (re.compile(r"(?i)(?:upi\s*pin|pin)\s*[:=]?\s*(\d{4,6})"), "pin:[REDACTED_PIN]"),
    # OTPs
    (re.compile(r"(?i)(?:otp|code|one\s*time\s*password)\s*[:=]?\s*(\d{4,8})"), "otp:[REDACTED_OTP]"),
    # Credit/Debit Card numbers
    (re.compile(r"\b(?:\d{4}[ -]?){3}\d{4}\b"), "[REDACTED_CARD_NUMBER]"),
    # Bank Account numbers (9-18 digits)
    (re.compile(r"(?i)(?:a/c|acc|account|acct)\s*#?\s*[:=]?\s*(\d{9,18})"), "account:[REDACTED_ACCT]"),
    # Password parameters in query strings or JSON
    (re.compile(r'(?i)(["\']?password["\']?\s*[:=]\s*["\'])([^"\']+)(["\'])'), r"\1[REDACTED]\3"),
    # Sensitive URL query parameters (e.g. token=xyz, pin=1234)
    (re.compile(r'(?i)([?&](?:token|key|pin|otp|secret)=)[^&]+'), r"\1[REDACTED]"),
]


def redact_sensitive_text(text: str) -> str:
    """
    Sanitizes string by masking sensitive payment, credentials, tokens, and PIN patterns.
    """
    if not text:
        return text
    sanitized = text
    for pattern, replacement in SENSITIVE_PATTERNS:
        sanitized = pattern.sub(replacement, sanitized)
    return sanitized


class PrivacyLogFormatter(logging.Formatter):
    """
    Structured JSON log formatter that ensures privacy-conscious logging.
    Guarantees no raw payment credentials or tokens leak into standard logs.
    """

    def format(self, record: logging.LogRecord) -> str:
        # Standard message string formatting
        raw_msg = record.getMessage()
        sanitized_msg = redact_sensitive_text(raw_msg)

        log_data: dict[str, Any] = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "logger": record.name,
            "message": sanitized_msg,
        }

        # Include additional extra attributes if present and safe
        if hasattr(record, "user_uid"):
            log_data["user_uid"] = record.user_uid
        if hasattr(record, "endpoint"):
            log_data["endpoint"] = record.endpoint
        if hasattr(record, "status_code"):
            log_data["status_code"] = record.status_code
        if hasattr(record, "duration_ms"):
            log_data["duration_ms"] = record.duration_ms

        # Do not include stack trace in production unless explicitly needed
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_data)


def configure_logging(log_level: str = "INFO") -> None:
    """
    Configures root application logging with the PrivacyLogFormatter.
    """
    numeric_level = getattr(logging, log_level.upper(), logging.INFO)
    root_logger = logging.getLogger()
    root_logger.setLevel(numeric_level)

    # Remove any existing handlers to prevent duplicate output
    for handler in list(root_logger.handlers):
        root_logger.removeHandler(handler)

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(PrivacyLogFormatter())
    root_logger.addHandler(handler)

    # Quieten excessively verbose third-party loggers
    logging.getLogger("urllib3").setLevel(logging.WARNING)
    logging.getLogger("pymongo").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    """
    Returns a configured logger instance.
    """
    return logging.getLogger(name)
