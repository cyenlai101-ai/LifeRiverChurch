from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg://postgres:password@localhost:5432/km"
    jwt_secret_key: str = "change-me"
    jwt_expires_minutes: int = 120
    allowed_origins: str = "http://localhost:5173,http://localhost:8080"

    class Config:
        env_file = ".env"


settings = Settings()
