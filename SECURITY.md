# Bezpieczeństwo

Jeśli znajdziesz podatność, zgłoś ją proszę **prywatnie** (nie przez publiczny issue), opisując kroki odtworzenia i wersję obrazu / commita.

Dla wersji self-hosted pamiętaj, że aplikacja wykonuje żądania HTTP pod adresy zdefiniowane przez użytkownika — hostuj ją tam, gdzie akceptujesz ten poziom zaufania (sieć wychodząca, brak uwierzytelniania wbudowanego w 0.0.1).

Endpointy **pobrania i przywrócenia kopii bazy** (`/api/settings/backup`) nie mają osobnej autoryzacji — w sieci lokalnej lub za reverse proxy zadbaj o dostęp tylko dla zaufanych użytkowników.

**ntfy:** nazwa topicu / URL kanału w ustawieniach jest jak **hasło do skrzynki powiadomień** — każdy z tym adresem może wysyłać wiadomości na Twój telefon. Nie udostępniaj go publicznie; użyj długiego, losowego topicu lub własnego serwera z uwierzytelnianiem.
