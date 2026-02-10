import os
import re
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

async def generate_default_user_data(db: AsyncSession, user_id: str):
    check_query = text("SELECT EXISTS(SELECT 1 FROM dmt.meals WHERE user_id = :user_id)")
    result = await db.execute(check_query, {"user_id": user_id})
    already_has_meals = result.scalar()

    if already_has_meals:
        return False

    base_path = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    sql_path = os.path.join(base_path, "app", "db", "scripts", "init_meals.sql")

    with open(sql_path, "r", encoding="utf-8") as f:
        content = f.read()

    content = re.sub(r'--.*', '', content)
    parts = content.split('DO $$')
    
    try:
        if parts[0].strip():
            dictionary_queries = [q.strip() for q in parts[0].split(';') if q.strip()]
            for query in dictionary_queries:
                await db.execute(text(query + ";"))

        if len(parts) > 1:
            full_do_block = "DO $$" + parts[1].strip()
            final_block = full_do_block.replace(':user_id', f"'{user_id}'")
            await db.execute(text(final_block))
        
        await db.commit()
        return True
    except Exception as e:
        await db.rollback()
        raise e