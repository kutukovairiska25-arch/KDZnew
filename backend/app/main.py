from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
from .database import engine, Base, SessionLocal
from .routers import couriers, orders, auth
from . import crud

Base.metadata.create_all(bind=engine)

def init_db():
    db = SessionLocal()
    try:
        if not crud.get_user_by_username(db, "admin"):
            crud.create_user(db, username="admin", password="123", role="admin")
        if not crud.get_user_by_username(db, "courier1"):
            crud.create_user(db, username="courier1", password="123", role="courier")
    finally:
        db.close()

init_db()

app = FastAPI(title="Candy Delivery API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

STATIC_DIR = Path(__file__).resolve().parents[2] / "frontend" / "static"

@app.get("/")
async def main():
    index_path = STATIC_DIR / "index.html"
    return FileResponse(index_path)

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

app.include_router(auth.router)
app.include_router(couriers.router)
app.include_router(orders.router)