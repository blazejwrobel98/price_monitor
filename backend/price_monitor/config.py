from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


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
        return self.data_dir / "prices.db"

    @property
    def resolved_database_url(self) -> str:
        if self.database_url:
            return self.database_url
        self.data_dir.mkdir(parents=True, exist_ok=True)
        return f"sqlite:///{self.sqlite_path.resolve()}"
