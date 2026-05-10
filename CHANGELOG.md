# Changelog

Ten plik dokumentuje istotne zmiany w projekcie. Format opiera się o [Keep a Changelog](https://keepachangelog.com/pl/1.0.0/), a wersjonowanie o [Semantic Versioning](https://semver.org/lang/pl/).

## [Unreleased]

### Dodano

- Automatyczne migracje bazy (**Alembic**): przy starcie aplikacji wykonywane jest `upgrade` do najnowszego schematu; istniejące bazy utworzone wcześniej przez `create_all` są jednorazowo „stemplowane”, żeby nie duplikować tabel.
- Panel boczny (zwijany do samych ikon, stan w `localStorage`) oraz strona **Ustawienia**: pobieranie kopii SQLite, wgrywanie i przywracanie bazy.
- Integracja: po przejściu testów workflow **Scalanie Dependabot** (`workflow_run` po zakończeniu **Integracji**) wykonuje **squash merge** pull requestów Dependabot do `main`.
- Edycja monitorowanego produktu ze strony szczegółów (modal, zapis przez `PATCH /api/products/{id}`).
- Wersja aplikacji w panelu bocznym (z `package.json` / build Vite), nad przyciskiem zwijania.
- Skrócony podpis adresu URL na stronie produktu (pełny link w `title` / `href`).

### Zmieniono

- Zależności frontendu i lockfile: React 19, React Router 7, Vitest 4, jsdom 29 (zbiorczo z otwartych PR Dependabot).
- Akcje Docker w workflow release: `setup-buildx-action@v4`, `metadata-action@v6`, `build-push-action@v7`.

### Naprawiono

- Integracja: merge Dependabot przeniesiony do osobnego workflow **`workflow_run`** ([`dependabot-merge.yml`](./.github/workflows/dependabot-merge.yml)), bo przy zdarzeniu `pull_request` od Dependabot `GITHUB_TOKEN` jest tylko do odczytu i GitHub i tak odrzucał merge zmieniających `.github/workflows/` (błąd GraphQL o braku uprawnienia `workflows`).
- Scalanie Dependabot: obsługa secretu **`DEPENDABOT_MERGE_TOKEN`** (PAT z zapisem do workflowów) — używany zamiast `GITHUB_TOKEN`, gdy GraphQL nadal odrzuca merge PR zmieniających `.github/workflows/`.
- Wyświetlanie adresu URL: zawsze skrócona etykieta bez `https://` (host + ścieżka), poprawne `min-w-0` / `truncate` w układzie flex; testy dla `formatUrlLabel`.
- Dodano zależność **python-multipart** (wymagana przez FastAPI przy uploadzie kopii bazy w CI i produkcji).

## [0.0.1] - 2026-05-10

### Dodano

- Backend w Pythonie (FastAPI): CRUD produktów, historia cen w SQLite, ręczne i cykliczne sprawdzanie (APScheduler).
- Pobieranie stron przez HTTP oraz odczyt ceny z węzła HTML wg selektora CSS (selectolax).
- Frontend (React + Vite + Tailwind): lista produktów, formularz dodawania, wykres historii (Recharts), akcje sprawdzenia / wstrzymania / usunięcia.
- Obraz Docker i `docker-compose` z wolumenem trwałej bazy pod `/data`.
- Integracja na GitHub Actions: testy backendu i frontendu.
- Szablon workflow release przy tagu `v*`.
