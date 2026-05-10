from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from price_monitor import crud
from price_monitor.api.deps import get_db, get_settings, reschedule_jobs
from price_monitor.models import Product
from price_monitor.schemas import (
    CheckResult,
    PriceRecordRead,
    ProductCreate,
    ProductListItem,
    ProductUpdate,
)
from price_monitor.services.checker import run_check_for_product

router = APIRouter(prefix="/products", tags=["products"])


def _product_list_item(db: Session, p: Product) -> ProductListItem:
    latest = crud.latest_records_for_products(db, [p.id])
    r = latest.get(p.id)
    return ProductListItem(
        id=p.id,
        name=p.name,
        url=p.url,
        price_selector=p.price_selector,
        currency=p.currency,
        check_interval_minutes=p.check_interval_minutes,
        is_active=p.is_active,
        created_at=p.created_at,
        last_error=p.last_error,
        last_price=r.price if r else None,
        last_checked_at=r.checked_at if r else None,
    )


@router.get("", response_model=list[ProductListItem])
def list_products(db: Session = Depends(get_db)):
    products = crud.list_products(db)
    latest = crud.latest_records_for_products(db, [p.id for p in products])
    out: list[ProductListItem] = []
    for p in products:
        r = latest.get(p.id)
        out.append(
            ProductListItem(
                id=p.id,
                name=p.name,
                url=p.url,
                price_selector=p.price_selector,
                currency=p.currency,
                check_interval_minutes=p.check_interval_minutes,
                is_active=p.is_active,
                created_at=p.created_at,
                last_error=p.last_error,
                last_price=r.price if r else None,
                last_checked_at=r.checked_at if r else None,
            )
        )
    return out


@router.post("", response_model=ProductListItem, status_code=201)
def create_product(
    body: ProductCreate,
    db: Session = Depends(get_db),
    _: None = Depends(reschedule_jobs),
):
    p = crud.create_product(
        db,
        name=body.name,
        url=body.url,
        price_selector=body.price_selector,
        currency=body.currency,
        check_interval_minutes=body.check_interval_minutes,
        is_active=body.is_active,
    )
    return _product_list_item(db, p)


@router.get("/{product_id}", response_model=ProductListItem)
def get_product(product_id: int, db: Session = Depends(get_db)):
    p = crud.get_product(db, product_id)
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    return _product_list_item(db, p)


@router.patch("/{product_id}", response_model=ProductListItem)
def patch_product(
    product_id: int,
    body: ProductUpdate,
    db: Session = Depends(get_db),
    _: None = Depends(reschedule_jobs),
):
    p = crud.get_product(db, product_id)
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    data = body.model_dump(exclude_unset=True)
    p = crud.update_product(db, p, **data)
    return _product_list_item(db, p)


@router.delete("/{product_id}", status_code=204)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(reschedule_jobs),
):
    p = crud.get_product(db, product_id)
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    crud.delete_product(db, p)


@router.get("/{product_id}/history", response_model=list[PriceRecordRead])
def history(
    product_id: int,
    limit: int = 200,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    p = crud.get_product(db, product_id)
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    return crud.list_price_history(db, product_id, limit=min(limit, 2000), offset=offset)


@router.post("/{product_id}/check", response_model=CheckResult)
def check_now(
    product_id: int,
    db: Session = Depends(get_db),
    settings=Depends(get_settings),
):
    p = crud.get_product(db, product_id)
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    run_check_for_product(db, p, settings)
    db.refresh(p)
    last = crud.list_price_history(db, product_id, limit=1)
    if not last:
        raise HTTPException(status_code=500, detail="No record after check")
    r = last[0]
    return CheckResult(
        status=r.status,
        price=r.price,
        detail=r.detail,
        checked_at=r.checked_at,
    )
