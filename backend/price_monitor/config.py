from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine.url import make_url


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    data_dir: Path = Path("./data")
    database_url: str | None = None
    scheduler_enabled: bool = True
    default_user_agent: str = (
        "Mozilla/5.0 (compatible; PriceMonitor/0.0.1; +https://github.com/price-monitor)"
    )
    request_timeout_seconds: float = 25.0

    @property
    def sqlite_path(self) -> Path:
        """Default SQLite file path when DATABASE_URL is not set."""
        return self.data_dir / "prices.db"

    @property
    def sqlite_filesystem_path(self) -> Path:
        """Absolute filesystem path to the SQLite DB used by the app."""
        u = make_url(self.resolved_database_url)
        if u.drivername != "sqlite" or not u.database:
            raise ValueError("Expected a SQLite database URL with a filesystem path.")
        if u.database == ":memory:":
            raise ValueError("In-memory SQLite has no filesystem path.")
        return Path(u.database)

    @property
    def resolved_database_url(self) -> str:
        if self.database_url:
            return self.database_url
        self.data_dir.mkdir(parents=True, exist_ok=True)
        return f"sqlite:///{self.sqlite_path.resolve()}"
