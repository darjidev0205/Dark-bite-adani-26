from urllib.parse import urlparse

from bson import ObjectId


def is_valid_object_id(val: str) -> bool:
    """
    Strict validation for 24-character hexadecimal MongoDB ObjectIds.
    """
    if not isinstance(val, str) or len(val) != 24:
        return False
    return ObjectId.is_valid(val)


def sanitize_input_text(text: str | None, max_length: int = 1000) -> str | None:
    """
    Sanitizes string inputs by stripping non-printable control characters
    (preserving newlines and tabs) and bounding length.
    """
    if text is None:
        return None
    # Strip dangerous ASCII control chars except \n, \r, \t
    cleaned = "".join(ch for ch in text if ch in ("\n", "\r", "\t") or (32 <= ord(ch) <= 126 or ord(ch) > 127))
    cleaned = cleaned.strip()
    return cleaned[:max_length] if len(cleaned) > max_length else cleaned


def generate_minimized_summary(
    input_type: str,
    message: str | None = None,
    url: str | None = None,
    recipient_name: str | None = None,
    amount: float | None = None,
) -> str:
    """
    Generates a minimized, privacy-preserving, sanitized summary.
    Never persists raw payment messages, credentials, PINs, OTPs, or full sensitive URLs.
    """
    parts = [f"type={input_type}"]

    if amount is not None:
        parts.append(f"amount={amount}")

    if input_type == "message" and message:
        # Detect basic threat categories without persisting message text
        msg_lower = message.lower()
        signals = []
        if "pin" in msg_lower:
            signals.append("pin_term")
        if "otp" in msg_lower:
            signals.append("otp_term")
        if "refund" in msg_lower or "cashback" in msg_lower or "reward" in msg_lower:
            signals.append("reward_term")
        if "urgent" in msg_lower or "block" in msg_lower or "expire" in msg_lower:
            signals.append("urgency_term")
        detected_categories = ",".join(signals) if signals else "general"
        parts.append(f"len={len(message)}")
        parts.append(f"indicators=[{detected_categories}]")

    elif input_type == "url" and url:
        try:
            parsed = urlparse(url)
            # Store only scheme and sanitized hostname, strip paths, credentials, and query tokens
            hostname = parsed.hostname or "unknown"
            scheme = parsed.scheme or "unknown"
            parts.append(f"scheme={scheme}")
            parts.append(f"host={hostname[:60]}")
        except Exception:
            parts.append("host=unparseable")

    elif input_type == "recipient" and recipient_name:
        # Keep only length and generic prefix
        safe_name = recipient_name.strip()
        parts.append(f"recipient_len={len(safe_name)}")

    return f"Summary({'; '.join(parts)})"
