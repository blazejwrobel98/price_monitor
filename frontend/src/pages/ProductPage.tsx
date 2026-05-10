import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, X } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  checkNow,
  deleteProduct,
  fetchHistory,
  fetchProduct,
  updateProduct,
  type PriceRecord,
  type Product,
} from "../api";

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

function formatTime(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return new Intl.DateTimeFormat("pl-PL", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
}

export function ProductPage({ id }: { id: number }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [history, setHistory] = useState<PriceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editName, setEditName] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editSelector, setEditSelector] = useState("");
  const [editCurrency, setEditCurrency] = useState("PLN");
  const [editInterval, setEditInterval] = useState(60);
  const [editActive, setEditActive] = useState(true);

  const openEdit = () => {
    if (!product) return;
    setEditName(product.name);
    setEditUrl(product.url);
    setEditSelector(product.price_selector);
    setEditCurrency(product.currency);
    setEditInterval(product.check_interval_minutes);
    setEditActive(product.is_active);
    setEditOpen(true);
    setError(null);
  };

  const onEditSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setEditSaving(true);
    setError(null);
    try {
      const p = await updateProduct(id, {
        name: editName,
        url: editUrl,
        price_selector: editSelector,
        currency: editCurrency,
        check_interval_minutes: editInterval,
        is_active: editActive,
      });
      setProduct(p);
      setEditOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się zapisać zmian");
    } finally {
      setEditSaving(false);
    }
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const p = await fetchProduct(id);
      setProduct(p);
      const h = await fetchHistory(id);
      setHistory(h);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Błąd ładowania");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [id]);

  const chartData = useMemo(() => {
    const ok = history.filter((r) => r.status === "ok" && r.price !== null);
    const asc = [...ok].reverse();
    return asc.map((r) => ({
      t: new Date(r.checked_at).getTime(),
      label: formatTime(r.checked_at),
      price: typeof r.price === "string" ? Number(r.price) : Number(r.price),
    }));
  }, [history]);

  const onCheck = async () => {
    setBusy(true);
    setError(null);
    try {
      await checkNow(id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sprawdzenie nie powiodło się");
    } finally {
      setBusy(false);
    }
  };

  const onToggle = async () => {
    if (!product) return;
    setBusy(true);
    try {
      const p = await updateProduct(id, { is_active: !product.is_active });
      setProduct(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Błąd zapisu");
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async () => {
    if (!confirm("Usunąć produkt i całą historię?")) return;
    setBusy(true);
    try {
      await deleteProduct(id);
      window.location.href = "/";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Błąd usuwania");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 text-zinc-400">Ładowanie…</div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <p className="text-zinc-400">Nie znaleziono produktu.</p>
        <Link className="mt-4 inline-block text-emerald-400 hover:text-emerald-300" to="/">
          Wróć
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link className="text-sm text-zinc-500 hover:text-zinc-300" to="/">
            ← Lista
          </Link>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{product.name}</h1>
          <a
            className="mt-1 inline-block break-all text-sm text-emerald-400 hover:text-emerald-300"
            href={product.url}
            target="_blank"
            rel="noreferrer"
          >
            {product.url}
          </a>
          <p className="mt-3 text-sm text-zinc-400">
            Bieżąca cena:{" "}
            <span className="font-medium text-zinc-100">
              {formatMoney(product.last_price, product.currency)}
            </span>
            <span className="text-zinc-500"> · </span>
            Ostatnie sprawdzenie:{" "}
            <span className="text-zinc-200">{formatTime(product.last_checked_at)}</span>
          </p>
          {product.last_error ? (
            <p className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
              Ostatni błąd: {product.last_error}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={openEdit}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-600 bg-zinc-800/60 px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-800 disabled:opacity-50"
          >
            <Pencil className="h-4 w-4" aria-hidden />
            Edytuj
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void onCheck()}
            className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 shadow hover:bg-emerald-400 disabled:opacity-50"
          >
            Sprawdź teraz
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void onToggle()}
            className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-800 disabled:opacity-50"
          >
            {product.is_active ? "Wstrzymaj" : "Wznów"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void onDelete()}
            className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 hover:bg-red-500/20 disabled:opacity-50"
          >
            Usuń
          </button>
        </div>
      </div>

      {error ? (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 shadow-xl backdrop-blur">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-100">Historia ceny</h2>
          <span className="text-xs text-zinc-500">Punkty: {chartData.length}</span>
        </div>
        {chartData.length === 0 ? (
          <p className="py-10 text-center text-sm text-zinc-500">
            Brak udanych odczytów. Dodaj poprawny selektor CSS i uruchom sprawdzenie.
          </p>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ left: 4, right: 12, top: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#a1a1aa", fontSize: 11 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  dataKey="price"
                  tick={{ fill: "#a1a1aa", fontSize: 11 }}
                  domain={["auto", "auto"]}
                />
                <Tooltip
                  contentStyle={{
                    background: "#18181b",
                    border: "1px solid #3f3f46",
                    borderRadius: 12,
                  }}
                  labelStyle={{ color: "#e4e4e7" }}
                  formatter={(value: number) => [formatMoney(value, product.currency), "Cena"]}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#34d399"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <details className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4">
        <summary className="cursor-pointer text-sm font-medium text-zinc-300">
          Szczegóły techniczne
        </summary>
        <dl className="mt-3 grid gap-2 text-sm text-zinc-400 sm:grid-cols-2">
          <div>
            <dt className="text-zinc-500">Selektor CSS</dt>
            <dd className="font-mono text-xs text-zinc-200">{product.price_selector}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Interwał (min)</dt>
            <dd className="text-zinc-200">{product.check_interval_minutes}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Aktywny</dt>
            <dd className="text-zinc-200">{product.is_active ? "tak" : "nie"}</dd>
          </div>
        </dl>
      </details>

      {editOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
          <div
            className="absolute inset-0"
            role="presentation"
            onClick={() => !editSaving && setEditOpen(false)}
          />
          <form
            onSubmit={onEditSubmit}
            className="relative z-10 w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-semibold text-white">Edycja produktu</h3>
              <button
                type="button"
                disabled={editSaving}
                onClick={() => setEditOpen(false)}
                className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-800 hover:text-white disabled:opacity-50"
                aria-label="Zamknij"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-1 text-sm text-zinc-500">
              Zmiany URL lub selektora wpływają na kolejne sprawdzenia. Interwał minimum 5 minut.
            </p>
            <div className="mt-5 space-y-4">
              <label className="block text-sm">
                <span className="text-zinc-400">Nazwa</span>
                <input
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </label>
              <label className="block text-sm">
                <span className="text-zinc-400">URL</span>
                <input
                  required
                  type="url"
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </label>
              <label className="block text-sm">
                <span className="text-zinc-400">Selektor CSS ceny</span>
                <input
                  required
                  value={editSelector}
                  onChange={(e) => setEditSelector(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 font-mono text-sm text-white outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </label>
              <label className="block text-sm">
                <span className="text-zinc-400">Waluta (kod ISO)</span>
                <input
                  required
                  value={editCurrency}
                  onChange={(e) => setEditCurrency(e.target.value.toUpperCase())}
                  maxLength={8}
                  className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 font-mono text-sm text-white outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </label>
              <label className="block text-sm">
                <span className="text-zinc-400">Interwał (minuty)</span>
                <input
                  required
                  type="number"
                  min={5}
                  value={editInterval}
                  onChange={(e) => setEditInterval(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </label>
              <label className="flex cursor-pointer items-center gap-3 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={editActive}
                  onChange={(e) => setEditActive(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-600 bg-zinc-900 text-emerald-500 focus:ring-emerald-500/40"
                />
                Monitorowanie aktywne
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                disabled={editSaving}
                onClick={() => setEditOpen(false)}
                className="rounded-xl px-4 py-2 text-sm text-zinc-400 hover:text-white disabled:opacity-50"
              >
                Anuluj
              </button>
              <button
                type="submit"
                disabled={editSaving}
                className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-400 disabled:opacity-50"
              >
                {editSaving ? "Zapisywanie…" : "Zapisz zmiany"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
