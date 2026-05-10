from datetime import datetime, timezone

from sqlalchemy.orm import Session

from price_monitor import crud
from price_monitor.config import Settings
from price_monitor.models import Product
from price_monitor.services.scraper import fetch_and_extract_price


def run_check_for_product(db: Session, product: Product, settings: Settings):
    status, price, detail = fetch_and_extract_price(
        url=product.url,
        price_selector=product.price_selector,
        settings=settings,
    )
    now = datetime.now(timezone.utc)
    if status == "ok":
        product.last_error = None
    else:
        product.last_error = detail
    db.add(product)
    crud.add_price_record(
        db,
        product_id=product.id,
        price=price,
        status=status,
        detail=detail,
        checked_at=now,
    )
