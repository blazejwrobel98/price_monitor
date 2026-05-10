from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from price_monitor.models import AppKv, PriceRecord, Product

KV_NTFY_CHANNEL = "ntfy_channel"


def list_products(db: Session, active_only: bool = False) -> list[Product]:
    q = select(Product).order_by(Product.created_at.desc())
    if active_only:
        q = q.where(Product.is_active.is_(True))
    return list(db.scalars(q))


def get_product(db: Session, product_id: int) -> Product | None:
    return db.get(Product, product_id)


def create_product(db: Session, **kwargs) -> Product:
    p = Product(**kwargs)
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


def update_product(db: Session, product: Product, **kwargs) -> Product:
    for k, v in kwargs.items():
        if v is not None:
            setattr(product, k, v)
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def delete_product(db: Session, product: Product) -> None:
    db.delete(product)
    db.commit()


def add_price_record(
    db: Session,
    *,
    product_id: int,
    price: Decimal | None,
    status: str,
    detail: str | None = None,
    checked_at: datetime | None = None,
) -> PriceRecord:
    rec = PriceRecord(
        product_id=product_id,
        price=price,
        status=status,
        detail=detail,
        checked_at=checked_at or datetime.now(timezone.utc),
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return rec


def touch_price_record_checked_at(db: Session, record_id: int, checked_at: datetime) -> None:
    """Przesuwa znacznik czasu odczytu (np. ta sama cena co poprzednio — bez nowego wiersza)."""
    row = db.get(PriceRecord, record_id)
    if not row:
        return
    row.checked_at = checked_at
    db.add(row)
    db.commit()


def latest_records_for_products(db: Session, product_ids: list[int]) -> dict[int, PriceRecord]:
    if not product_ids:
        return {}
    sub = (
        select(PriceRecord.product_id, func.max(PriceRecord.id).label("max_id"))
        .where(PriceRecord.product_id.in_(product_ids))
        .group_by(PriceRecord.product_id)
        .subquery()
    )
    q = select(PriceRecord).join(
        sub,
        (PriceRecord.product_id == sub.c.product_id) & (PriceRecord.id == sub.c.max_id),
    )
    rows = list(db.scalars(q))
    return {r.product_id: r for r in rows}


def list_price_history(
    db: Session, product_id: int, limit: int = 500, offset: int = 0
) -> list[PriceRecord]:
    q = (
        select(PriceRecord)
        .where(PriceRecord.product_id == product_id)
        .order_by(PriceRecord.checked_at.desc())
        .offset(offset)
        .limit(limit)
    )
    return list(db.scalars(q))


def kv_get(db: Session, key: str) -> str | None:
    row = db.get(AppKv, key)
    return row.value if row else None


def kv_set(db: Session, key: str, value: str) -> None:
    row = db.get(AppKv, key)
    if row:
        row.value = value
    else:
        db.add(AppKv(key=key, value=value))
    db.commit()


def kv_delete(db: Session, key: str) -> None:
    row = db.get(AppKv, key)
    if row:
        db.delete(row)
        db.commit()


def latest_price_record(db: Session, product_id: int) -> PriceRecord | None:
    """Ostatni wiersz historii dla produktu (najwyższe id) — stan widoczny na liście."""
    q = (
        select(PriceRecord)
        .where(PriceRecord.product_id == product_id)
        .order_by(PriceRecord.id.desc())
        .limit(1)
    )
    return db.scalars(q).first()


def latest_ok_price_record(db: Session, product_id: int) -> PriceRecord | None:
    """Ostatni zapisany rekord z udaną ceną (przed dodaniem nowego odczytu)."""
    q = (
        select(PriceRecord)
        .where(
            PriceRecord.product_id == product_id,
            PriceRecord.status == "ok",
            PriceRecord.price.is_not(None),
        )
        .order_by(PriceRecord.id.desc())
        .limit(1)
    )
    return db.scalars(q).first()
