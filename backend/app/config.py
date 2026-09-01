from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="NLP_")

    database_url: str = "sqlite+aiosqlite:////data/nathalielopez.db"
    cors_origins: list[str] = ["https://nathalie.lopez.clan.global"]
    debug: bool = False

    admin_password: str = ""
    session_secret: str = ""
    session_max_age_days: int = 30

    # Instagram Graph API (long-lived token) — empty means the feed is
    # admin-curated only. The OAuth flow needs a Meta app; the long-lived
    # token it issues is persisted in the DB.
    instagram_token: str = ""
    instagram_app_id: str = ""
    instagram_app_secret: str = ""
    instagram_redirect_uri: str = "https://nathalie.lopez.clan.global/api/v1/admin/instagram/callback"

    # Throttling for password-checked endpoints
    login_rate_max: int = 5
    login_rate_window_seconds: int = 900


@lru_cache
def get_settings() -> Settings:
    return Settings()
