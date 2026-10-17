from datetime import datetime
from typing import Any

import pytest
from bson import ObjectId
from starlette.testclient import TestClient

from app.config import Settings, get_settings
from app.database import get_database
from app.main import create_application


class MockAsyncCursor:
    def __init__(self, items: list[dict[str, Any]]):
        self._items = items
        self._index = 0

    def sort(self, key: str, direction: int = 1) -> "MockAsyncCursor":
        reverse = direction < 0
        self._items.sort(key=lambda x: x.get(key, datetime.min), reverse=reverse)
        return self

    def skip(self, n: int) -> "MockAsyncCursor":
        self._items = self._items[n:]
        return self

    def limit(self, n: int) -> "MockAsyncCursor":
        self._items = self._items[:n]
        return self

    def __aiter__(self):
        self._index = 0
        return self

    async def __anext__(self):
        if self._index < len(self._items):
            item = self._items[self._index]
            self._index += 1
            return item
        raise StopAsyncIteration


class MockCollection:
    def __init__(self):
        self.docs: dict[str, dict[str, Any]] = {}

    async def insert_one(self, doc: dict[str, Any]):
        doc_copy = dict(doc)
        if "_id" not in doc_copy:
            doc_copy["_id"] = ObjectId()
        doc_id = str(doc_copy["_id"])
        self.docs[doc_id] = doc_copy

        class InsertResult:
            def __init__(self, inserted_id):
                self.inserted_id = inserted_id

        return InsertResult(doc_copy["_id"])

    async def find_one(self, query: dict[str, Any]) -> dict[str, Any] | None:
        for doc in self.docs.values():
            if self._matches(doc, query):
                return dict(doc)
        return None

    def find(self, query: dict[str, Any]) -> MockAsyncCursor:
        matched = [dict(doc) for doc in self.docs.values() if self._matches(doc, query)]
        return MockAsyncCursor(matched)

    async def count_documents(self, query: dict[str, Any]) -> int:
        return sum(1 for doc in self.docs.values() if self._matches(doc, query))

    async def delete_one(self, query: dict[str, Any]):
        to_delete = None
        for doc_id, doc in self.docs.items():
            if self._matches(doc, query):
                to_delete = doc_id
                break

        class DeleteResult:
            def __init__(self, count):
                self.deleted_count = count

        if to_delete:
            del self.docs[to_delete]
            return DeleteResult(1)
        return DeleteResult(0)

    async def update_one(self, query: dict[str, Any], update: dict[str, Any]):
        for doc in self.docs.values():
            if self._matches(doc, query):
                if "$set" in update:
                    doc.update(update["$set"])
                break

    def aggregate(self, pipeline: list[dict[str, Any]]) -> MockAsyncCursor:
        # Simple aggregator for risk_level grouping
        filtered = list(self.docs.values())
        for stage in pipeline:
            if "$match" in stage:
                filtered = [doc for doc in filtered if self._matches(doc, stage["$match"])]
            elif "$group" in stage:
                group_key = stage["$group"]["_id"].lstrip("$")
                groups: dict[Any, int] = {}
                for doc in filtered:
                    val = doc.get(group_key)
                    groups[val] = groups.get(val, 0) + 1
                result = [{"_id": k, "count": v} for k, v in groups.items()]
                return MockAsyncCursor(result)
        return MockAsyncCursor(filtered)

    async def create_index(self, *args, **kwargs):
        pass

    async def drop_index(self, *args, **kwargs):
        pass

    async def index_information(self):
        return {}

    def _matches(self, doc: dict[str, Any], query: dict[str, Any]) -> bool:
        for k, v in query.items():
            if k == "_id":
                if doc.get("_id") != v and str(doc.get("_id")) != str(v):
                    return False
            elif isinstance(v, dict):
                # Date or comparison filter
                val = doc.get(k)
                if "$gte" in v and val and val < v["$gte"]:
                    return False
                if "$lte" in v and val and val > v["$lte"]:
                    return False
            else:
                if doc.get(k) != v:
                    return False
        return True


class MockDatabase:
    def __init__(self):
        self.users = MockCollection()
        self.scans = MockCollection()


@pytest.fixture(scope="session")
def test_settings() -> Settings:
    return Settings(
        APP_ENV="test",
        MOCK_AUTH_IN_TEST=True,
        MONGODB_DATABASE="upi_shield_test",
        RATE_LIMIT_PER_MINUTE=100,
        MAX_MESSAGE_LENGTH=1000,
    )


@pytest.fixture
def mock_db() -> MockDatabase:
    return MockDatabase()


@pytest.fixture
def client(test_settings: Settings, mock_db: MockDatabase) -> TestClient:
    app = create_application()

    # Override dependencies
    app.dependency_overrides[get_settings] = lambda: test_settings
    app.dependency_overrides[get_database] = lambda: mock_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


def make_auth_header(uid: str = "user_123") -> dict[str, str]:
    return {"Authorization": f"Bearer mock_token_{uid}"}
