from motor.motor_asyncio import AsyncIOMotorClient
from config import settings

class MongoDB:
    client: AsyncIOMotorClient = None

    @classmethod
    def get_db(cls):
        if cls.client is None:
            # Initialize MongoDB connection properly
            cls.client = AsyncIOMotorClient(settings.mongodb_uri)
        return cls.client[settings.database_name]

    @classmethod
    def close(cls):
        if cls.client is not None:
            cls.client.close()
            cls.client = None

mongodb = MongoDB()
