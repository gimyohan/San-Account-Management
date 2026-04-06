# from dotenv import load_dotenv
from pydantic_settings import BaseSettings

from dotenv import load_dotenv
load_dotenv()

class Config(BaseSettings):
    app_name: str
    debug: bool = False

    db_type: str
    db_host: str
    db_port: int
    db_name: str
    db_user: str
    db_password: str

    jwt_secret_key: str
    jwt_algorithm: str
    jwt_access_token_expire_minutes: int

    @property
    def db_url(self) -> str:
        return f"{self.db_type}://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"

config = Config()