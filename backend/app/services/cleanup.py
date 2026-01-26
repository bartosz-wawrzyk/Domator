import asyncio
from sqlalchemy import text
from app.db.deps import get_db

async def cleanup_refresh_tokens():
    async for db in get_db():
        await db.execute(text("""
            DELETE FROM dmt.refresh_tokens
            WHERE 
                expires_at < NOW() 
                OR revoked_at IS NOT NULL
        """))
        await db.commit()
        break

async def periodic_cleanup():
    while True:
        try:
            await cleanup_refresh_tokens()
            print("Cleanup: The database has been cleaned up of old tokens.")
        except Exception as e:
            print(f"Error during cleanup: {e}")
        await asyncio.sleep(3600)