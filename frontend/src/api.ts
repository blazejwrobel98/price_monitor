export type Product = {
  id: number;
  name: string;
  url: string;
  price_selector: string;
  currency: string;
  check_interval_minutes: number;
  is_active: boolean;
  created_at: string;
  last_error: string | null;
  last_price: string | number | null;
  last_checked_at: string | null;
};

export type PriceRecord = {
  id: number;
  product_id: number;
  price: string | number | null;
  checked_at: string;
  status: string;
  detail: string | null;
};

const base = "";

/** Lista produktów z /api/products — krótki cache (nawigacja między zakładkami). */
let productsListCache: { data: Product[]; at: number } | null = null;
const PRODUCTS_LIST_TTL_MS = 45_000;

export function getProductsListIfCached(): Product[] | null {
  return peekProductsListCache();
}

export function invalidateProductsListCache(): void {
  productsListCache = null;
}

function peekProductsListCache(): Product[] | null {
  if (!productsListCache) return null;
  if (Date.now() - productsListCache.at > PRODUCTS_LIST_TTL_MS) return null;
  return productsListCache.data;
}

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json() as Promise<T>;
}

export async function fetchProduct(id: number): Promise<Product> {
  const res = await fetch(`${base}/api/products/${id}`);
  return parseJson(res);
}

export async function fetchProducts(options?: { force?: boolean }): Promise<Product[]> {
  if (!options?.force) {
    const hit = peekProductsListCache();
    if (hit) return hit;
  }
  const res = await fetch(`${base}/api/products`);
  const data = await parseJson<Product[]>(res);
  productsListCache = { data, at: Date.now() };
  return data;
}

export async function createProduct(body: {
  name: string;
  url: string;
  price_selector: string;
  currency?: string;
  check_interval_minutes?: number;
  is_active?: boolean;
}): Promise<Product> {
  const res = await fetch(`${base}/api/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await parseJson<Product>(res);
  invalidateProductsListCache();
  return data;
}

export async function updateProduct(
  id: number,
  body: Partial<{
    name: string;
    url: string;
    price_selector: string;
    currency: string;
    check_interval_minutes: number;
    is_active: boolean;
  }>,
): Promise<Product> {
  const res = await fetch(`${base}/api/products/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await parseJson<Product>(res);
  invalidateProductsListCache();
  return data;
}

export async function deleteProduct(id: number): Promise<void> {
  const res = await fetch(`${base}/api/products/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  invalidateProductsListCache();
}

export async function fetchHistory(id: number): Promise<PriceRecord[]> {
  const res = await fetch(`${base}/api/products/${id}/history?limit=500`);
  return parseJson(res);
}

export async function checkNow(id: number): Promise<{
  status: string;
  price: string | number | null;
  detail: string | null;
  checked_at: string;
}> {
  const res = await fetch(`${base}/api/products/${id}/check`, { method: "POST" });
  const data = await parseJson<{
    status: string;
    price: string | number | null;
    detail: string | null;
    checked_at: string;
  }>(res);
  invalidateProductsListCache();
  return data;
}

async function errorBody(res: Response): Promise<string> {
  const t = await res.text();
  try {
    const j = JSON.parse(t) as { detail?: unknown };
    if (typeof j.detail === "string") return j.detail;
    if (Array.isArray(j.detail)) {
      return j.detail.map((x: { msg?: string }) => x.msg ?? "").filter(Boolean).join("; ");
    }
  } catch {
    /* not JSON */
  }
  return t || res.statusText;
}

export async function downloadBackupFile(): Promise<void> {
  const res = await fetch(`${base}/api/settings/backup`);
  if (!res.ok) {
    throw new Error(await errorBody(res));
  }
  const blob = await res.blob();
  let name = `price-monitor-backup-${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}.db`;
  const cd = res.headers.get("Content-Disposition");
  if (cd) {
    const m =
      /filename\*=UTF-8''([^;\s]+)|filename="([^"]+)"|filename=([^;\s]+)/i.exec(cd);
    const raw = (m?.[1] || m?.[2] || m?.[3] || "").trim();
    if (raw) {
      try {
        name = decodeURIComponent(raw.replace(/^["']|["']$/g, ""));
      } catch {
        name = raw.replace(/^["']|["']$/g, "");
      }
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export async function restoreBackupFile(file: File): Promise<void> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${base}/api/settings/backup`, {
    method: "POST",
    body: fd,
  });
  if (!res.ok) {
    throw new Error(await errorBody(res));
  }
  invalidateProductsListCache();
}

export type NotificationsSettings = {
  ntfy_channel: string;
};

/** Gdy 404: zwykle nie działa backend Price Monitor albo Vite proxy nie trafia w ten sam port. */
const NOTIFY_SETTINGS_404_HINT =
  "Brak API ustawień (404). Uruchom z głównego katalogu: `npm run dev` (API + Vite). Otwórz dokładnie http://127.0.0.1:5173 — jeśli port jest zajęty, zatrzymaj stary Vite zamiast używać innego numeru portu. README → Lokalny development.";

function messageFromNotificationsError(status: number, text: string): string {
  if (status === 404 && text.includes("Not Found")) return NOTIFY_SETTINGS_404_HINT;
  try {
    const j = JSON.parse(text) as { detail?: unknown };
    if (typeof j.detail === "string") return j.detail;
    if (Array.isArray(j.detail)) {
      return j.detail.map((x: { msg?: string }) => x.msg ?? "").filter(Boolean).join("; ");
    }
  } catch {
    /* not JSON */
  }
  return text || `HTTP ${status}`;
}

export async function fetchNotificationsSettings(): Promise<NotificationsSettings> {
  const res = await fetch(`${base}/api/settings/notifications`);
  const text = await res.text();
  if (!res.ok) {
    throw new Error(messageFromNotificationsError(res.status, text));
  }
  return JSON.parse(text) as NotificationsSettings;
}

export async function saveNotificationsSettings(
  body: NotificationsSettings,
): Promise<NotificationsSettings> {
  const res = await fetch(`${base}/api/settings/notifications`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(messageFromNotificationsError(res.status, text));
  }
  return JSON.parse(text) as NotificationsSettings;
}

export async function testNotifications(): Promise<{ ok: boolean }> {
  const res = await fetch(`${base}/api/settings/notifications/test`, { method: "POST" });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(messageFromNotificationsError(res.status, text));
  }
  return JSON.parse(text) as { ok: boolean };
}
