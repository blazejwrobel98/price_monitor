import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from price_monitor import crud
from price_monitor.api.deps import get_db
from price_monitor.schemas import NotificationsSettings
from price_monitor.services.ntfy import get_publish_url_from_db, resolve_ntfy_publish_url, send_ntfy

router = APIRouter(prefix="/settings/notifications", tags=["notifications"])


@router.get("", response_model=NotificationsSettings)
def get_notifications(db: Session = Depends(get_db)):
    v = crud.kv_get(db, crud.KV_NTFY_CHANNEL)
    return NotificationsSettings(ntfy_channel=v or "")


@router.put("", response_model=NotificationsSettings)
def put_notifications(body: NotificationsSettings, db: Session = Depends(get_db)):
    c = body.ntfy_channel.strip()
    if c:
        try:
            resolve_ntfy_publish_url(c)
        except ValueError:
            raise HTTPException(status_code=400, detail="Nieprawidłowy kanał ntfy") from None
        crud.kv_set(db, crud.KV_NTFY_CHANNEL, c)
    else:
        crud.kv_delete(db, crud.KV_NTFY_CHANNEL)
    return get_notifications(db)


@router.post("/test")
def test_notifications(db: Session = Depends(get_db)):
    url = get_publish_url_from_db(db)
    if not url:
        raise HTTPException(status_code=400, detail="Ustaw i zapisz kanał ntfy przed testem.")
    headers = {"Title": "Price Monitor — test", "Tags": "white_check_mark"}
    body = "Powiadomienia z Price Monitor działają."
    try:
        with httpx.Client(timeout=20.0) as client:
            r = client.post(url, content=body.encode("utf-8"), headers=headers)
            r.raise_for_status()
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=502,
            detail=f"ntfy odrzucił żądanie: HTTP {e.response.status_code}",
        ) from e
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Połączenie z ntfy nie powiodło się: {e!s}") from e
    return {"ok": True}
