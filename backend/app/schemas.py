from pydantic import BaseModel, Field
from typing import List, Optional

class CourierItem(BaseModel):
    courier_id: int = Field(..., gt=0)
    courier_type: str = Field(..., pattern="^(foot|bike|car)$")
    regions: List[int] = Field(..., min_length=1)
    working_hours: List[str] = Field(..., min_length=1)

class CourierUpdateRequest(BaseModel):
    courier_type: Optional[str] = None
    regions: Optional[List[int]] = None
    working_hours: Optional[List[str]] = None

class CourierGetResponse(BaseModel):
    courier_id: int
    courier_type: str
    regions: List[int]
    working_hours: List[str]
    earnings: int
    rating: Optional[float] = None

class OrderItem(BaseModel):
    order_id: int = Field(..., gt=0)
    weight: float = Field(..., gt=0.0, le=50.0)
    region: int = Field(..., gt=0)
    delivery_hours: List[str] = Field(..., min_length=1)

class OrdersAssignPostRequest(BaseModel):
    courier_id: int = Field(..., gt=0)

class OrdersCompletePostRequest(BaseModel):
    courier_id: int = Field(..., gt=0)
    order_id: int = Field(..., gt=0)
    complete_time: str