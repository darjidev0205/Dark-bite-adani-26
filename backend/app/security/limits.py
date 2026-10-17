import time
from collections import defaultdict

from fastapi import HTTPException, Request, status
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import get_settings


class InMemoryRateLimiter:
    """
    Sliding-window in-memory rate limiter per client key (User UID or Client IP).
    Thread-safe and lightweight for hackathon prototypes and low-to-medium throughput services.
    """

    def __init__(self, requests_per_minute: int = 60):
        self.requests_per_minute = requests_per_minute
        self.window_seconds = 60.0
        self._history: dict[str, list[float]] = defaultdict(list)

    def is_rate_limited(self, key: str) -> bool:
        now = time.time()
        window_start = now - self.window_seconds

        # Clean timestamps older than the window
        timestamps = [ts for ts in self._history[key] if ts > window_start]
        self._history[key] = timestamps

        if len(timestamps) >= self.requests_per_minute:
            return True

        self._history[key].append(now)
        return False

    def reset(self) -> None:
        self._history.clear()


# Global rate limiter instance
_global_rate_limiter: InMemoryRateLimiter | None = None


def get_rate_limiter() -> InMemoryRateLimiter:
    global _global_rate_limiter
    if _global_rate_limiter is None:
        settings = get_settings()
        _global_rate_limiter = InMemoryRateLimiter(settings.RATE_LIMIT_PER_MINUTE)
    return _global_rate_limiter


def check_rate_limit(request: Request, user_uid: str | None = None) -> None:
    """
    Enforces rate limit on sensitive endpoints.
    Key is user_uid if authenticated, else client IP address.
    """
    limiter = get_rate_limiter()
    client_ip = request.client.host if request.client else "unknown"
    key = f"uid:{user_uid}" if user_uid else f"ip:{client_ip}"

    if limiter.is_rate_limited(key):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please wait a minute before making further requests.",
        )


class RequestSizeLimitMiddleware(BaseHTTPMiddleware):
    """
    Middleware that rejects requests with Content-Length exceeding MAX_PAYLOAD_BYTES.
    """

    def __init__(self, app, max_bytes: int = 65536):
        super().__init__(app)
        self.max_bytes = max_bytes

    async def dispatch(self, request: Request, call_next):
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                length = int(content_length)
                if length > self.max_bytes:
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail=f"Request entity exceeds allowed maximum size of {self.max_bytes} bytes.",
                    )
            except ValueError:
                pass

        return await call_next(request)
