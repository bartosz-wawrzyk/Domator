import uuid
from decimal import Decimal
from sqlalchemy import Boolean
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.repositories.fuel import FuelRepository
from app.db.models.fuel import FuelLog

class FuelService:
    @staticmethod
    async def calculate_consumption(db: AsyncSession, vehicle_id: uuid.UUID, fuel_type: str = None):
        logs = await FuelRepository.get_all_by_vehicle(db, vehicle_id)
        
        if fuel_type:
            logs = [log for log in logs if log.fuel_type == fuel_type]
            
        logs.sort(key=lambda x: x.date)

        if len(logs) < 2:
            return {"message": "Not enough data to calculate consumption (min. 2 refuelings)."}

        consumptions = []
        
        last_full_log = None
        temp_liters = Decimal("0.0")

        for log in logs:
            if log.is_full:
                if last_full_log is not None:
                    distance = log.mileage - last_full_log.mileage
                    
                    if distance > 0:
                        total_liters = log.liters + temp_liters
                        consumption = (total_liters / Decimal(distance)) * 100
                        
                        consumptions.append({
                            "date": log.date,
                            "distance": distance,
                            "liters": float(total_liters),
                            "consumption": round(float(consumption), 2),
                            "fuel_type": log.fuel_type
                        })
                    
                    temp_liters = Decimal("0.0")
                
                last_full_log = log
            else:
                if last_full_log is not None:
                    temp_liters += log.liters

        if not consumptions:
            return {"message": "Not enough full refuelings."}

        avg_consumption = sum(c["consumption"] for c in consumptions) / len(consumptions)
        
        return {
            "vehicle_id": vehicle_id,
            "average_consumption": round(avg_consumption, 2),
            "history": consumptions
        }

    @staticmethod
    async def get_fuel_stats(db: AsyncSession, vehicle_id: uuid.UUID):
        logs = await FuelRepository.get_all_by_vehicle(db, vehicle_id)
        
        total_cost = sum(log.total_price for log in logs)
        total_liters = sum(log.liters for log in logs)
        
        return {
            "total_spent": float(total_cost),
            "total_liters": float(total_liters),
            "entries_count": len(logs)
        }