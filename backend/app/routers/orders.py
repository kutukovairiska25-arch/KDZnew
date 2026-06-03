from fastapi import APIRouter

router = APIRouter(prefix="/api/orders", tags=["orders"])

@router.get("/")
async def get_orders():
    return {"message": "Get orders"}