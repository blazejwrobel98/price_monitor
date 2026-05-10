# Price Monitor

Self‑hosted monitor cen produktów z **historią sprawdzeń** i nowoczesnym panelem (React). Dane trzymane są lokalnie w **SQLite** (domyślnie plik w katalogu `DATA_DIR`).

**Aktualizacja:** przy każdym starcie serwera uruchamiane są migracje Alembic do aktualnego schematu — **nie trzeba ręcznie dotykać pliku bazy** przy podmianie obrazu / wersji (poza standardowym backupem na wszelki wypadek).

**Kopia zapasowa:** w aplikacji (menu **Ustawienia**) możesz pobrać plik `.db` albo wgrać wcześniejszą kopię (nadpisuje bieżącą bazę).

**Wersja:** `0.0.1` (zobacz plik [`VERSION`](./VERSION) oraz [`CHANGELOG.md`](./CHANGELOG.md)).

## Możliwości

- Dodawanie produktów: nazwa, URL strony, **selektor CSS** elementu zawierającego cenę.
- Automatyczne sprawdzanie w tle (interwał per produkt, domyślnie co 60 minut, minimum 5). Działa tylko przy **ciągle uruchomionym** serwerze (np. kontener Docker); uśpienie komputera lub zatrzymanie procesu = brak ticków harmonogramu. Zapis produktu w panelu nie resetuje już harmonogramu pozostałych pozycji.
- Zapis każdej próby: status (`ok` / `error`), odczytana cena (jeśli udało się sparsować), znacznik czasu.
- Dashboard: karty z ostatnią ceną, szczegóły produktu z wykresem historii, ręczne „Sprawdź teraz”.

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

Workflow [**Scalanie Dependabot**](./.github/workflows/dependabot-merge.yml) uruchamia się na **`pull_request_target`** (tylko PR **do** `main`, od `dependabot[bot]`, gałąź `dependabot/…`). **Nie startuje przy zwykłym pushu na `main`** — nie powinieneś wtedy dostawać maili od tego workflowu (w przeciwieństwie do łańcucha `workflow_run`, który potrafi spamować powiadomieniami).

Używa `gh pr merge --squash --auto`: merge następuje po spełnieniu **wymaganych** checków (ustaw w **Branch protection** dla `main` wymaganą kontrolę **Integracja** / wymagane statusy z [`ci.yml`](./.github/workflows/ci.yml)). Bez tego merge może nastąpić zanim testy się skończą.

**Ustawienia GitHub (wymagane do automatycznego merge):**

1. Repozytorium → **Settings** → **Actions** → **General** → **Workflow permissions**: włącz **Read and write permissions**.
2. Ten sam ekran: włącz **Allow GitHub Actions to create and approve pull requests**, jeśli branch protection tego wymaga.

**Błąd GraphQL o `workflows` przy merge PR zmieniającym np. `release.yml`:** czasem `GITHUB_TOKEN` nie wystarcza. Utwórz **fine-grained PAT** (lub classic: `repo` + `workflow`) dla tego repozytorium z uprawnieniami **Contents**, **Pull requests**, **Workflows** (zapis) i zapisz jako secret **`DEPENDABOT_MERGE_TOKEN`** — workflow go użyje, gdy jest ustawiony.

Jeśli merge się nie uda (recenzje, **branch protection**), dostosuj ustawienia albo wyłącz workflow **Scalanie Dependabot**.

**Mniej maili od GitHub ogólnie:** profil → **Settings** → **Notifications** → **Actions** — możesz ograniczyć powiadomienia tylko do nieudanych workflowów.

## Testy

```bash
cd backend && python -m pytest tests -v
cd frontend && npm ci && npm test
```

## Licencja

MIT — zobacz [`LICENSE`](./LICENSE).

## Bezpieczeństwo

Zobacz [`SECURITY.md`](./SECURITY.md).
