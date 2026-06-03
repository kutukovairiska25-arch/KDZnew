from fastapi import APIRouter

router = APIRouter(prefix="/api/couriers", tags=["couriers"])

@router.get("/")
async def get_couriers():
    return {"message": "Get couriers"}