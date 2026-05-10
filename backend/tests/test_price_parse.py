from decimal import Decimal


def test_parse_pln_basic():
    from price_monitor.services.price_parse import parse_price_from_text

    assert parse_price_from_text("129,99 zł") == Decimal("129.99")


def test_parse_us_style():
    from price_monitor.services.price_parse import parse_price_from_text

    assert parse_price_from_text("$1,234.56") == Decimal("1234.56")


def test_parse_plain():
    from price_monitor.services.price_parse import parse_price_from_text

    assert parse_price_from_text("42") == Decimal("42")
