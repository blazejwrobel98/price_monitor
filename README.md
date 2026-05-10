# Price Monitor

Self‑hosted monitor cen produktów z **historią sprawdzeń** i nowoczesnym panelem (React). Dane trzymane są lokalnie w **SQLite** (domyślnie plik w katalogu `DATA_DIR`).

**Aktualizacja:** przy każdym starcie serwera uruchamiane są migracje Alembic do aktualnego schematu — **nie trzeba ręcznie dotykać pliku bazy** przy podmianie obrazu / wersji (poza standardowym backupem na wszelki wypadek).

**Kopia zapasowa:** w aplikacji (menu **Ustawienia**) możesz pobrać plik `.db` albo wgrać wcześniejszą kopię (nadpisuje bieżącą bazę).

**Wersja:** `0.0.1` (zobacz plik [`VERSION`](./VERSION) oraz [`CHANGELOG.md`](./CHANGELOG.md)).

## Możliwości

- Dodawanie produktów: nazwa, URL strony, **selektor CSS** elementu zawierającego cenę.
- Automatyczne sprawdzanie w tle (interwał per produkt, domyślnie co 60 minut, minimum 5). Działa tylko przy **ciągle uruchomionym** serwerze (np. kontener Docker); uśpienie komputera lub zatrzymanie procesu = brak ticków harmonogramu. Zapis produktu w panelu nie resetuje już harmonogramu pozostałych pozycji.
- Zapis każdej próby: status (`ok` / `error`), odczytana cena (jeśli udało się sparsować), znacznik czasu (w bazie **UTC**; w panelu pokazywany w **strefie Twojej przeglądarki**).
- Dashboard: karty z ostatnią ceną, szczegóły produktu z wykresem historii, ręczne „Sprawdź teraz”.
- Powiadomienia **ntfy** (Ustawienia): kanał/topic, test; przy dodaniu produktu oraz **jednorazowo** przy spadku ceny względem ostatniego udanego odczytu.

## Szybki start (Docker)

W katalogu repozytorium:

```bash
docker compose up --build
```

Aplikacja: [http://localhost:8080](http://localhost:8080)  
API: [http://localhost:8080/api/health](http://localhost:8080/api/health)

Baza i dane są na wolumenie `price_monitor_data` montowanym jako `/data` w kontenerze.

## Lokalny development

### Backend

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate   # Windows
pip install -e ".[dev]"
$env:SCHEDULER_ENABLED="false"   # opcjonalnie, by nie dublować jobów w dev
python -m price_monitor
```

Serwer domyślnie: [http://127.0.0.1:8000](http://127.0.0.1:8000).

### Frontend

W drugim terminalu:

```bash
cd frontend
npm install
npm run dev
```

Vite proxy przekierowuje `/api` na `http://127.0.0.1:8000`. Otwórz [http://127.0.0.1:5173](http://127.0.0.1:5173).

### Zmienne środowiskowe

Zobacz [`.env.example`](./.env.example).

## Produkcja (jeden obraz)

Obraz buduje frontend i osadza go w backendzie (FastAPI serwuje statyczne pliki SPA).

```bash
docker build -t price-monitor:0.0.1 .
docker run --rm -p 8080:8080 -v price_data:/data price-monitor:0.0.1
```

## Wydania i wersjonowanie

- Numer wersji trzymamy w [`VERSION`](./VERSION) oraz w `backend/pyproject.toml` i `frontend/package.json`.
- Zmiany opisujemy w [`CHANGELOG.md`](./CHANGELOG.md).
- Tag Git `v0.0.1` + workflow [`.github/workflows/release.yml`](./.github/workflows/release.yml) buduje i publikuje obraz do **GitHub Container Registry** (`ghcr.io/<właściciel>/<repo>` w małych literach).

## Dependabot

Konfiguracja w [`.github/dependabot.yml`](./.github/dependabot.yml): Dependabot otwiera pull requesty (npm, pip, GitHub Actions). **Nie ma już automatycznego scalania** — po zielonym CI przejrzyj zmiany i scal PR ręcznie w GitHubie (albo cherry-pick). Jeśli wcześniej dodałeś secret **`DEPENDABOT_MERGE_TOKEN`** tylko pod auto-merge, możesz go usunąć w **Settings → Secrets and variables → Actions**.

### Powiadomienia (ntfy)

W **Ustawieniach** aplikacji ustawiasz topic lub pełny URL [ntfy](https://ntfy.sh). Serwer wysyła powiadomienie po dodaniu produktu oraz gdy przy sprawdzeniu cena **spadła** względem poprzedniego udanego odczytu (tylko przy tej jednej zmianie, bez powtarzania przy kolejnych sprawdzeniach po tej samej niższej cenie).

**Mniej maili od Actions:** profil → **Settings** → **Notifications** → **Actions** — możesz ograniczyć powiadomienia (np. tylko nieudane workflowy).

## Testy

```bash
cd backend && python -m pytest tests -v
cd frontend && npm ci && npm test
```

## Licencja

MIT — zobacz [`LICENSE`](./LICENSE).

## Bezpieczeństwo

Zobacz [`SECURITY.md`](./SECURITY.md).
