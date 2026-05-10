from datetime import datetime
from decimal import Decimal

import httpx
from selectolax.parser import HTMLParser

from price_monitor.config import Settings
from price_monitor.services.price_parse import parse_price_from_text


def fetch_and_extract_price(
    *,
    url: str,
    price_selector: str,
    settings: Settings,
) -> tuple[str, Decimal | None, str | None]:
    """
    Returns (status, price, detail).
    status is 'ok' or 'error'.
    """
    headers = {"User-Agent": settings.default_user_agent}
    try:
        with httpx.Client(
            timeout=settings.request_timeout_seconds,
            follow_redirects=True,
            headers=headers,
        ) as client:
            resp = client.get(url)
            resp.raise_for_status()
            html = resp.text
    except httpx.HTTPError as e:
        return "error", None, f"HTTP error: {e}"
    except OSError as e:
        return "error", None, f"Network error: {e}"

    try:
        tree = HTMLParser(html)
        node = tree.css_first(price_selector)
        if node is None:
            return "error", None, f"No node matched selector: {price_selector!r}"
        text = node.text(deep=True)
        if not text:
            return "error", None, "Matched node has no text"
        price = parse_price_from_text(text)
        return "ok", price, text.strip()[:500]
    except ValueError as e:
        return "error", None, str(e)
    except Exception as e:  # noqa: BLE001 — surface unexpected parse errors
        return "error", None, f"Parse error: {e}"
