import os
from dotenv import load_dotenv

'''
Читает файл .env и превращает текстовые строки в переменные Python, 
которыми удобно пользоваться в коде.
'''

load_dotenv()

class Settings:
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_PORT = os.getenv("DB_PORT", "5432")
    DB_NAME = os.getenv("DB_NAME", "testDB")
    DB_USER = os.getenv("DB_USER", "postgres")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "")
    SECRET_KEY = os.getenv("SECRET_KEY", "fallback_secret_key")

settings = Settings()

'''
load_dotenv() # Загружает файл .env

# Класс, где мы достаем переменные через os.getenv
class Settings:
    # Database
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_PORT = os.getenv('DB_PORT', '5432')
    DB_NAME = os.getenv('DB_NAME', 'testDB')
    DB_USER = os.getenv('DB_USER', 'postgres')
    DB_PASSWORD = os.getenv('DB_PASSWORD', '')

    # Async database URL for asyncpg
    DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

    # Security
    SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key-change-in-production')
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 часа

    # App
    DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'


settings = Settings()

'''