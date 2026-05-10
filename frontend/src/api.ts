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

export async function fetchProducts(): Promise<Product[]> {
  const res = await fetch(`${base}/api/products`);
  return parseJson(res);
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
  return parseJson(res);
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
  return parseJson(res);
}

export async function deleteProduct(id: number): Promise<void> {
  const res = await fetch(`${base}/api/products/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
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
  return parseJson(res);
}
