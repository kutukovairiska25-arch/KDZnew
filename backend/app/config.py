"""
Читает файл .env и превращает текстовые строки в переменные Python,
которыми удобно пользоваться в коде.
"""

import os   # для чтения переменных окружения
from pathlib import Path
from dotenv import load_dotenv


'''
__file__: это переменная, которая хранит путь к текущему файлу (то есть к config.py).
.resolve(): превращает этот путь в абсолютный (полный), например: C:/Projects/KDZ/backend/app/config.py.
.parent: поднимает нас на одну папку вверх (в папку app).
.parent (второй раз): поднимает нас еще на одну папку вверх (в папку backend, где лежит файл .env).
/ '.env': добавляет к этому пути имя файла .env.

Эта строчка гарантирует, что программа всегда найдет файл .env, независимо от того, 
из какой папки ты запустила сервер.
'''
load_dotenv(Path(__file__).resolve().parent.parent / '.env')

# Класс для группировки настроек
class Settings:
    # os.getenv("ключ", "значение_по_умолчанию"):
    # эта функция ищет переменную с именем "ключ" в загруженном .env файле.
    DB_HOST: str = os.getenv("DB_HOST", "localhost")
    DB_PORT: str = os.getenv("DB_PORT", "5432")
    DB_NAME: str = os.getenv("DB_NAME", "testDB")
    DB_USER: str = os.getenv("DB_USER", "postgres")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "fallback_key")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")

settings = Settings()

