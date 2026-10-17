
import pymongo
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.config import Settings, get_settings
from app.security.logging import get_logger

logger = get_logger(__name__)

# Global database client and db references
_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None


async def init_db(settings: Settings | None = None) -> AsyncIOMotorDatabase:
    """
    Initializes the async MongoDB client and ensures essential indexes exist.
    """
    global _client, _db
    if settings is None:
        settings = get_settings()

    logger.info(f"Connecting to MongoDB database: {settings.MONGODB_DATABASE}")
    _client = AsyncIOMotorClient(
        settings.MONGODB_URI,
        serverSelectionTimeoutMS=5000,
        connectTimeoutMS=5000,
        appname="upi_shield_backend",
    )
    _db = _client[settings.MONGODB_DATABASE]

    # Initialize collections and indexes
    await setup_indexes(_db, settings)
    return _db


async def setup_indexes(db: AsyncIOMotorDatabase, settings: Settings) -> None:
    """
    Creates necessary unique, compound, and TTL indexes on users and scans collections.
    """
    try:
        # Collection: users
        # 1. Unique index on firebase_uid
        await db.users.create_index(
            [("firebase_uid", pymongo.ASCENDING)],
            unique=True,
            name="idx_users_firebase_uid_unique",
        )
        logger.info("Ensured unique index on users.firebase_uid")

        # Collection: scans
        # 2. Compound index on user_uid (ASC) and created_at (DESC) for fast user-scoped retrieval
        await db.scans.create_index(
            [("user_uid", pymongo.ASCENDING), ("created_at", pymongo.DESCENDING)],
            name="idx_scans_user_created_desc",
        )
        logger.info("Ensured compound index on scans (user_uid ASC, created_at DESC)")

        # 3. Compound index on user_uid + risk_level + created_at for filtered queries
        await db.scans.create_index(
            [
                ("user_uid", pymongo.ASCENDING),
                ("risk_level", pymongo.ASCENDING),
                ("created_at", pymongo.DESCENDING),
            ],
            name="idx_scans_user_risk_created",
        )

        # 4. Configurable TTL Index on scans.created_at
        if settings.SCAN_RETENTION_DAYS > 0:
            expire_seconds = settings.SCAN_RETENTION_DAYS * 86400
            # Drop previous TTL index if expiration seconds changed, then recreate
            try:
                indexes = await db.scans.index_information()
                if "idx_scans_ttl" in indexes:
                    await db.scans.drop_index("idx_scans_ttl")
            except Exception as e:
                logger.debug(f"Previous TTL index drop notice: {e}")

            await db.scans.create_index(
                [("created_at", pymongo.ASCENDING)],
                expireAfterSeconds=expire_seconds,
                name="idx_scans_ttl",
            )
            logger.info(f"Ensured TTL index on scans (retention: {settings.SCAN_RETENTION_DAYS} days)")

    except Exception as e:
        logger.error(f"Error configuring MongoDB indexes: {str(e)}")


async def close_db() -> None:
    """
    Closes MongoDB client connection pool cleanly on shutdown.
    """
    global _client, _db
    if _client is not None:
        logger.info("Closing MongoDB connection pool")
        _client.close()
        _client = None
        _db = None


def get_database() -> AsyncIOMotorDatabase:
    """
    Dependency to provide active database instance.
    """
    global _db
    if _db is None:
        raise RuntimeError("Database connection not initialized. Check application startup.")
    return _db


async def check_db_health() -> bool:
    """
    Performs quick ping check without revealing connection credentials.
    """
    global _client
    if _client is None:
        return False
    try:
        await _client.admin.command("ping")
        return True
    except Exception:
        return False
