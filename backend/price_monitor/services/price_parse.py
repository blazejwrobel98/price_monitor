import re
from decimal import Decimal, InvalidOperation


def parse_price_from_text(raw: str) -> Decimal:
    """Extract a decimal price from messy text (spaces, currency words, comma/dot)."""
    s = raw.strip()
    if not s:
        raise ValueError("empty price text")
    # Remove common currency tokens and letters
    s = re.sub(r"(?i)\b(pln|eur|usd|zł|zl)\b", "", s)
    s = re.sub(r"[^\d,.\-]", "", s)
    s = s.strip()
    if not s:
        raise ValueError("no digits in price text")
    # If both comma and dot exist, assume comma is thousands (US) or decimal (EU)
    if "," in s and "." in s:
        last_comma = s.rfind(",")
        last_dot = s.rfind(".")
        if last_comma > last_dot:
            s = s.replace(".", "").replace(",", ".")
        else:
            s = s.replace(",", "")
    elif "," in s and "." not in s:
        parts = s.split(",")
        if len(parts) == 2 and len(parts[1]) <= 2:
            s = parts[0].replace(".", "") + "." + parts[1]
        else:
            s = s.replace(",", "")
    else:
        s = s.replace(",", "")
    try:
        return Decimal(s)
    except InvalidOperation as e:
        raise ValueError(f"invalid decimal: {raw!r}") from e
