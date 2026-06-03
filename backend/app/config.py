import os
from pathlib import Path
from dotenv import load_dotenv

'''
Читает файл .env и превращает текстовые строки в переменные Python, 
которыми удобно пользоваться в коде.
'''

load_dotenv(Path(__file__).resolve().parent.parent / '.env')

class Settings:
    DB_HOST: str = os.getenv("DB_HOST", "localhost")
    DB_PORT: str = os.getenv("DB_PORT", "5432")
    DB_NAME: str = os.getenv("DB_NAME", "testDB")
    DB_USER: str = os.getenv("DB_USER", "postgres")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "fallback_key")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")

settings = Settings()

