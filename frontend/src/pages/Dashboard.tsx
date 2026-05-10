import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createProduct, fetchProducts, getProductsListIfCached, type Product } from "../api";
import { formatLocalDateTime } from "../formatDateTime";
import { formatUrlLabel } from "../formatUrl";

function formatMoney(v: string | number | null, currency: string) {
  if (v === null || v === undefined) return "—";
  const n = typeof v === "string" ? Number(v) : v;
  if (Number.isNaN(n)) return String(v);
  try {
    return new Intl.NumberFormat("pl-PL", {
      style: "currency",
      currency: currency || "PLN",
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${n} ${currency}`;
  }
}

export function Dashboard() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [selector, setSelector] = useState("");
  const [intervalMin, setIntervalMin] = useState(60);

  const load = async () => {
    setError(null);
    const hadListCache = getProductsListIfCached() !== null;
    if (!hadListCache) setLoading(true);
    try {
      setItems(await fetchProducts());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Błąd ładowania");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const cached = getProductsListIfCached();
    if (cached) {
      setItems(cached);
      setLoading(false);
    }
    void load();
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createProduct({
        name,
        url,
        price_selector: selector,
        check_interval_minutes: intervalMin,
        currency: "PLN",
        is_active: true,
      });
      setName("");
      setUrl("");
      setSelector("");
      setIntervalMin(60);
      setOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się dodać produktu");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-emerald-400/90">
            Self-hosted
          </p>
          <h1 className="mt-1 text-4xl font-semibold tracking-tight text-white">Produkty</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
            Śledź ceny po URL i selektorze CSS. Historia zapisuje się lokalnie w bazie SQLite.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400"
        >
          Dodaj produkt
        </button>
      </header>

      {error ? (
        <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <section className="mt-10">
        {loading ? (
          <p className="text-zinc-500">Ładowanie listy…</p>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/40 p-10 text-center">
            <p className="text-zinc-300">Nie masz jeszcze żadnego produktu.</p>
            <p className="mt-2 text-sm text-zinc-500">
              Kliknij „Dodaj produkt” i podaj stronę oraz selektor elementu z ceną.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((p) => (
              <Link
                key={p.id}
                to={`/product/${p.id}`}
                className="group rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 p-5 shadow-lg shadow-black/40 transition hover:border-emerald-500/40 hover:shadow-emerald-500/10"
              >
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-semibold text-zinc-50 group-hover:text-white">
                      {p.name}
                    </h2>
                    <p className="mt-1 min-w-0 truncate text-xs text-zinc-500" title={p.url}>
                      {formatUrlLabel(p.url, 64)}
                    </p>
                  </div>
                  <span
                    className={
                      p.is_active
                        ? "shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300"
                        : "shrink-0 rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400"
                    }
                  >
                    {p.is_active ? "aktywny" : "wstrzymany"}
                  </span>
                </div>
                <div className="mt-5 flex items-end justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-zinc-500">Ostatnia cena</p>
                    <p className="mt-1 text-2xl font-semibold text-white">
                      {formatMoney(p.last_price, p.currency)}
                    </p>
                  </div>
                  <div className="text-right text-xs text-zinc-500">
                    Sprawdzono
                    <div className="text-zinc-300">{formatLocalDateTime(p.last_checked_at)}</div>
                  </div>
                </div>
                {p.last_error ? (
                  <p className="mt-3 line-clamp-2 text-xs text-amber-300/90">{p.last_error}</p>
                ) : null}
              </Link>
            ))}
          </div>
        )}
      </section>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
          <div
            className="absolute inset-0"
            role="presentation"
            onClick={() => !saving && setOpen(false)}
          />
          <form
            onSubmit={onSubmit}
            className="relative z-10 w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl"
          >
            <h3 className="text-lg font-semibold text-white">Nowy produkt</h3>
            <p className="mt-1 text-sm text-zinc-500">
              Podaj adres strony i selektor CSS wskazujący węzeł z tekstem ceny (np.{" "}
              <code className="rounded bg-zinc-900 px-1 py-0.5 font-mono text-xs">.price</code>).
            </p>
            <div className="mt-5 space-y-4">
              <label className="block text-sm">
                <span className="text-zinc-400">Nazwa</span>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white outline-none ring-emerald-500/0 transition focus:ring-2"
                />
              </label>
              <label className="block text-sm">
                <span className="text-zinc-400">URL strony produktu</span>
                <input
                  required
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-emerald-500/60"
                />
              </label>
              <label className="block text-sm">
                <span className="text-zinc-400">Selektor CSS ceny</span>
                <input
                  required
                  value={selector}
                  onChange={(e) => setSelector(e.target.value)}
                  placeholder=".product-price"
                  className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 font-mono text-sm text-white outline-none focus:ring-2 focus:ring-emerald-500/60"
                />
              </label>
              <label className="block text-sm">
                <span className="text-zinc-400">Interwał sprawdzania (minuty)</span>
                <input
                  required
                  type="number"
                  min={5}
                  value={intervalMin}
                  onChange={(e) => setIntervalMin(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-emerald-500/60"
                />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-2 text-sm text-zinc-400 hover:text-white disabled:opacity-50"
              >
                Anuluj
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-400 disabled:opacity-50"
              >
                {saving ? "Zapisywanie…" : "Zapisz"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
