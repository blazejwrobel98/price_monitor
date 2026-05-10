from __future__ import annotations

import logging
from decimal import Decimal
from urllib.parse import quote, urlparse

import httpx
from sqlalchemy.orm import Session

from price_monitor import crud
from price_monitor.models import Product

log = logging.getLogger(__name__)
DEFAULT_NTFY = "https://ntfy.sh"


def _latin1_header_value(s: str) -> str:
    """HTTP/1 nagłówki muszą dać się zakodować jako latin-1; em dash itd. zamieniamy."""
    t = s.replace("\u2013", "-").replace("\u2014", "-").replace("\u2015", "-")
    return t.encode("latin-1", errors="replace").decode("latin-1")


def resolve_ntfy_publish_url(channel: str) -> str:
    raw = channel.strip()
    if not raw:
        raise ValueError("empty_channel")
    low = raw.lower()
    if low.startswith("http://") or low.startswith("https://"):
        return raw.rstrip("/")
    return f"{DEFAULT_NTFY.rstrip('/')}/{quote(raw, safe='/-_.~')}"


def get_publish_url_from_db(db: Session) -> str | None:
    v = crud.kv_get(db, crud.KV_NTFY_CHANNEL)
    if not v or not str(v).strip():
        return None
    try:
        return resolve_ntfy_publish_url(str(v))
    except ValueError:
        return None


def send_ntfy(db: Session, title: str, body: str, tags: str | None = None) -> None:
    url = get_publish_url_from_db(db)
    if not url:
        log.debug("ntfy_skip_no_channel")
        return
    headers = {"Title": _latin1_header_value(title)}
    if tags:
        headers["Tags"] = _latin1_header_value(tags)
    try:
        with httpx.Client(timeout=20.0) as client:
            r = client.post(url, content=body.encode("utf-8"), headers=headers)
            r.raise_for_status()
    except Exception:
        log.exception("ntfy_send_failed host=%s", urlparse(url).hostname)


def notify_product_added(db: Session, product: Product) -> None:
    title = "Price Monitor - monitoring"
    body = f'Dodano produkt: "{product.name}"\n{product.url}'
    send_ntfy(db, title, body, "heavy_plus_sign")


def notify_price_dropped(db: Session, product: Product, old_price: Decimal, new_price: Decimal) -> None:
    title = f"Cena spadła: {product.name}"

    def fmt(p: Decimal) -> str:
        s = format(p, "f").rstrip("0").rstrip(".")
        return s if s else "0"

    body = (
        f"{product.name}\n"
        f"Było: {fmt(old_price)} {product.currency}\n"
        f"Teraz: {fmt(new_price)} {product.currency}\n"
        f"{product.url}"
    )
    send_ntfy(db, title, body, "chart_with_downwards_trend,moneybag")
