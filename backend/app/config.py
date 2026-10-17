from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application configuration loaded from environment variables with strong validation.
    """
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # Core Application Settings
    APP_NAME: str = "UPI Shield Backend"
    APP_ENV: str = Field(default="development", description="development, staging, or production")
    APP_HOST: str = "0.0.0.0"  # nosec B104
    APP_PORT: int = 8000
    LOG_LEVEL: str = "INFO"
    ENABLE_DOCS: bool = True

    # MongoDB Atlas Settings
    MONGODB_URI: str = Field(
        default="mongodb://localhost:27017",
        description="MongoDB connection string (Atlas mongodb+srv:// or local mongodb://)",
    )
    MONGODB_DATABASE: str = Field(default="upi_shield", description="Primary MongoDB database name")
    SCAN_RETENTION_DAYS: int = Field(
        default=90,
        ge=0,
        description="Scans retention window in days. Set to 0 to disable TTL auto-deletion.",
    )

    # Firebase Admin Authentication
    FIREBASE_PROJECT_ID: str = Field(
        default="upi-shield-prod",
        description="Firebase Project ID for token verification",
    )
    FIREBASE_CREDENTIALS_PATH: str | None = Field(
        default=None,
        description="Path to service account JSON key file (optional if using ADC or emulation)",
    )
    MOCK_AUTH_IN_TEST: bool = Field(
        default=False,
        description="Allow mock authentication header in automated tests only",
    )

    # Security & Rate Limiting
    FRONTEND_ORIGINS: str = Field(
        default="http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173",
        description="Comma-separated allowed frontend origins for CORS",
    )
    RATE_LIMIT_PER_MINUTE: int = Field(
        default=60,
        ge=1,
        le=1000,
        description="Maximum requests permitted per minute per IP / authenticated user",
    )
    MAX_MESSAGE_LENGTH: int = Field(
        default=1000,
        ge=10,
        le=5000,
        description="Maximum character length for scanned messages",
    )
    MAX_PAYLOAD_BYTES: int = Field(
        default=65536, # 64 KB
        description="Maximum request body size in bytes",
    )

    @property
    def is_production(self) -> bool:
        return self.APP_ENV.lower() in ("production", "prod")

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.FRONTEND_ORIGINS.split(",") if origin.strip()]

    @field_validator("APP_ENV")
    @classmethod
    def validate_app_env(cls, v: str) -> str:
        valid_envs = {"development", "staging", "production", "test"}
        if v.lower() not in valid_envs:
            raise ValueError(f"APP_ENV must be one of {valid_envs}")
        return v.lower()


@lru_cache
def get_settings() -> Settings:
    """
    Cached getter for application settings to prevent reading files on every call.
    """
    return Settings()
