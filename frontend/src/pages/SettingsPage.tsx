import { Download, HardDriveUpload, ShieldAlert } from "lucide-react";
import { useRef, useState } from "react";
import { downloadBackupFile, restoreBackupFile } from "../api";

export function SettingsPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<"dl" | "up" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [selected, setSelected] = useState<File | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const onDownload = async () => {
    setBusy("dl");
    setError(null);
    setOk(null);
    try {
      await downloadBackupFile();
      setOk("Plik kopii został pobrany.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nie udało się pobrać kopii.");
    } finally {
      setBusy(null);
    }
  };

  const onPick = () => {
    inputRef.current?.click();
  };

  const onFile = (f: File | null) => {
    setSelected(f);
    setOk(null);
    setError(null);
    setConfirmOpen(false);
  };

  const onRestore = async () => {
    if (!selected) return;
    setBusy("up");
    setError(null);
    setOk(null);
    try {
      await restoreBackupFile(selected);
      setConfirmOpen(false);
      setSelected(null);
      if (inputRef.current) inputRef.current.value = "";
      setOk("Baza została przywrócona. Za chwilę strona się odświeży.");
      window.setTimeout(() => {
        window.location.href = "/";
      }, 900);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Przywracanie nie powiodło się.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-white">Ustawienia</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Kopie zapasowe i przywracanie działają na pliku SQLite używanym przez tę instancję aplikacji.
        </p>
      </div>

      {error ? (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}
      {ok ? (
        <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {ok}
        </div>
      ) : null}

      <section className="rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/60 to-zinc-950/80 p-6 shadow-xl shadow-black/20">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-zinc-800/80 text-emerald-400">
            <HardDriveUpload className="h-6 w-6" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-white">Kopia zapasowa bazy</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              Pobierz plik <span className="font-mono text-zinc-300">.db</span>, aby zarchiwizować produkty i całą historię
              cen. Przywrócenie <strong className="text-zinc-200">zastępuje</strong> obecną bazę — przed wgraniem
              zrób kopię, jeśli nie chcesz stracić bieżących danych.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => void onDownload()}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-500/15 transition hover:bg-emerald-400 disabled:opacity-50"
              >
                <Download className="h-4 w-4" aria-hidden />
                {busy === "dl" ? "Pobieranie…" : "Pobierz kopię (.db)"}
              </button>
            </div>

            <div className="mt-10 border-t border-zinc-800/80 pt-8">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Przywróć z pliku</h3>
              <p className="mt-2 text-sm text-zinc-400">
                Wybierz wcześniej pobrany plik SQLite z tej samej aplikacji (nagłówek{" "}
                <span className="font-mono text-xs text-zinc-300">SQLite format 3</span>).
              </p>

              <input
                ref={inputRef}
                type="file"
                accept=".db,application/vnd.sqlite3,application/x-sqlite3,*/*"
                className="hidden"
                onChange={(e) => onFile(e.target.files?.[0] ?? null)}
              />

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={onPick}
                  className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm font-medium text-zinc-100 hover:bg-zinc-800 disabled:opacity-50"
                >
                  Wybierz plik…
                </button>
                {selected ? (
                  <span className="truncate text-sm text-zinc-400" title={selected.name}>
                    {selected.name}
                  </span>
                ) : (
                  <span className="text-sm text-zinc-600">Nie wybrano pliku</span>
                )}
                <button
                  type="button"
                  disabled={!selected || busy !== null}
                  onClick={() => setConfirmOpen(true)}
                  className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-sm font-semibold text-amber-100 hover:bg-amber-500/20 disabled:opacity-40"
                >
                  Wgraj i przywróć
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {confirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div
            className="absolute inset-0"
            role="presentation"
            onClick={() => !busy && setConfirmOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-950 p-6 shadow-2xl">
            <div className="flex gap-3">
              <ShieldAlert className="h-10 w-10 shrink-0 text-amber-400" aria-hidden />
              <div>
                <h3 className="text-lg font-semibold text-white">Zastąpić bazę danych?</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  Bieżąca baza zostanie zamieniona na zawartość pliku{" "}
                  <span className="font-medium text-zinc-200">{selected?.name}</span>. Bieżący plik zostanie zapisany
                  obok jako <span className="font-mono text-xs text-zinc-300">.bak</span> (jeśli się uda).
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => setConfirmOpen(false)}
                className="rounded-xl px-4 py-2 text-sm text-zinc-400 hover:text-white disabled:opacity-50"
              >
                Anuluj
              </button>
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => void onRestore()}
                className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-400 disabled:opacity-50"
              >
                {busy === "up" ? "Przywracanie…" : "Tak, przywróć"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
