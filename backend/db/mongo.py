from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from backend.config import get_settings
from typing import Optional
import logging

logger = logging.getLogger(__name__)

_client: Optional[AsyncIOMotorClient] = None
_is_offline: bool = False

async def get_client() -> AsyncIOMotorClient:
    global _client, _is_offline
    if _is_offline:
        raise ConnectionError("MongoDB is offline (fast in-memory fallback enabled).")
    if _client is None:
        settings = get_settings()
        logger.info(f"Connecting to MongoDB at: {settings.mongodb_uri}")
        _client = AsyncIOMotorClient(
            settings.mongodb_uri,
            serverSelectionTimeoutMS=500
        )
    return _client

async def get_db() -> AsyncIOMotorDatabase:
    client = await get_client()
    settings = get_settings()
    return client[settings.mongodb_db_name]

async def close_db():
    global _client
    if _client is not None:
        logger.info("Closing MongoDB connection.")
        _client.close()
        _client = None

async def check_db_health() -> bool:
    global _is_offline
    if _is_offline:
        return False
    try:
        client = await get_client()
        await client.admin.command("ping")
        return True
    except Exception as e:
        logger.warning(f"MongoDB ping check failed: {e}. Switching to high-speed in-memory store.")
        _is_offline = True
        return False

if __name__ == "__main__":
    import asyncio
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
    async def main():
        print("Testing MongoDB connection & health check...")
        is_healthy = await check_db_health()
        print(f"MongoDB Connection Health: {'ONLINE' if is_healthy else 'OFFLINE (Fast in-memory fallback active)'}")
        await close_db()
    asyncio.run(main())
