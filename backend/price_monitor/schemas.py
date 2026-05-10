from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    url: str = Field(..., min_length=1)
    price_selector: str = Field(..., min_length=1, max_length=512)
    currency: str = Field(default="PLN", max_length=8)
    check_interval_minutes: int = Field(default=60, ge=5, le=24 * 60)
    is_active: bool = True


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    url: str | None = Field(default=None, min_length=1)
    price_selector: str | None = Field(default=None, min_length=1, max_length=512)
    currency: str | None = Field(default=None, max_length=8)
    check_interval_minutes: int | None = Field(default=None, ge=5, le=24 * 60)
    is_active: bool | None = None


class ProductRead(ProductBase):
    id: int
    created_at: datetime
    last_error: str | None

    model_config = {"from_attributes": True}


class ProductListItem(ProductRead):
    last_price: Decimal | None = None
    last_checked_at: datetime | None = None


class PriceRecordRead(BaseModel):
    id: int
    product_id: int
    price: Decimal | None
    checked_at: datetime
    status: str
    detail: str | None

    model_config = {"from_attributes": True}


class CheckResult(BaseModel):
    status: str
    price: Decimal | None = None
    detail: str | None = None
    checked_at: datetime
