from pydantic import BaseModel
from typing import List
from datetime import date
import uuid

class ShoppingListItem(BaseModel):
    ingredient_id: uuid.UUID
    name: str
    amount: float
    unit: str
    category: str

class ShoppingListRead(BaseModel):
    items: List[ShoppingListItem]
    start_date: date
    end_date: date