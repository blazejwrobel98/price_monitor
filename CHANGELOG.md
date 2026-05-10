# Changelog

Ten plik dokumentuje istotne zmiany w projekcie. Format opiera się o [Keep a Changelog](https://keepachangelog.com/pl/1.0.0/), a wersjonowanie o [Semantic Versioning](https://semver.org/lang/pl/).

## [Unreleased]

### Dodano

- Automatyczne migracje bazy (**Alembic**): przy starcie aplikacji wykonywane jest `upgrade` do najnowszego schematu; istniejące bazy utworzone wcześniej przez `create_all` są jednorazowo „stemplowane”, żeby nie duplikować tabel.

## [0.0.1] - 2026-05-10

### Dodano

- Backend w Pythonie (FastAPI): CRUD produktów, historia cen w SQLite, ręczne i cykliczne sprawdzanie (APScheduler).
- Pobieranie stron przez HTTP oraz odczyt ceny z węzła HTML wg selektora CSS (selectolax).
- Frontend (React + Vite + Tailwind): lista produktów, formularz dodawania, wykres historii (Recharts), akcje sprawdzenia / wstrzymania / usunięcia.
- Obraz Docker i `docker-compose` z wolumenem trwałej bazy pod `/data`.
- CI na GitHub Actions: testy backendu i frontendu.
- Szablon workflow release przy tagu `v*`.
