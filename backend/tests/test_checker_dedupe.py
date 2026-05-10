from decimal import Decimal
from unittest.mock import patch

from price_monitor import crud
from price_monitor.models import Product
from price_monitor.services.checker import run_check_for_product


def test_same_ok_price_updates_timestamp_not_new_row(client):
    settings = client.app.state.settings
    db = client.app.state.session_factory()
    try:
        p = crud.create_product(
            db,
            name="T",
            url="https://example.com",
            price_selector=".x",
            currency="PLN",
            check_interval_minutes=60,
            is_active=True,
        )
        pid = p.id
        crud.add_price_record(
            db,
            product_id=pid,
            price=Decimal("10.00"),
            status="ok",
            detail=None,
        )
        n1 = len(crud.list_price_history(db, pid, limit=100))
        assert n1 == 1

        p2 = crud.get_product(db, pid)
        with patch(
            "price_monitor.services.checker.fetch_and_extract_price",
            return_value=("ok", Decimal("10.00"), None),
        ):
            run_check_for_product(db, p2, settings)

        rows = crud.list_price_history(db, pid, limit=100)
        assert len(rows) == 1
        assert rows[0].price == Decimal("10.00")

        with patch(
            "price_monitor.services.checker.fetch_and_extract_price",
            return_value=("ok", Decimal("9.99"), None),
        ):
            run_check_for_product(db, crud.get_product(db, pid), settings)

        assert len(crud.list_price_history(db, pid, limit=100)) == 2
    finally:
        db.close()


def test_error_then_ok_still_inserts(client):
    settings = client.app.state.settings
    db = client.app.state.session_factory()
    try:
        p = crud.create_product(
            db,
            name="E",
            url="https://example.com",
            price_selector=".x",
            currency="PLN",
            check_interval_minutes=60,
            is_active=True,
        )
        pid = p.id
        crud.add_price_record(
            db,
            product_id=pid,
            price=None,
            status="error",
            detail="fail",
        )
        with patch(
            "price_monitor.services.checker.fetch_and_extract_price",
            return_value=("ok", Decimal("5"), None),
        ):
            run_check_for_product(db, crud.get_product(db, pid), settings)
        assert len(crud.list_price_history(db, pid, limit=10)) == 2
    finally:
        db.close()
