from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.api.v1.router import api_v1_router
from app.auth.firebase import initialize_firebase
from app.config import get_settings
from app.database import close_db, init_db
from app.security.limits import RequestSizeLimitMiddleware
from app.security.logging import configure_logging, get_logger

logger = get_logger("upi_shield.app")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application startup and shutdown lifecycle management.
    """
    settings = get_settings()

    # 1. Initialize privacy-conscious structured logging
    configure_logging(settings.LOG_LEVEL)
    logger.info(f"Starting {settings.APP_NAME} in '{settings.APP_ENV}' mode")

    # 2. Initialize Firebase Admin SDK
    initialize_firebase(settings)

    # 3. Initialize MongoDB Atlas connection & indexes
    try:
        await init_db(settings)
    except Exception as e:
        logger.error(f"MongoDB startup connection warning: {str(e)}")

    yield

    # Shutdown: clean up database connections
    await close_db()
    logger.info("Application shutdown complete")


def create_application() -> FastAPI:
    """
    Application factory configuring middleware, routes, security, and exception handlers.
    """
    settings = get_settings()

    # Disable public interactive API documentation in production unless explicitly authorized
    docs_enabled = settings.ENABLE_DOCS and not (settings.is_production and not settings.ENABLE_DOCS)

    app = FastAPI(
        title=settings.APP_NAME,
        version="1.0.0",
        description="Production-structured backend and fraud detection engine for UPI Shield",
        docs_url="/docs" if docs_enabled else None,
        redoc_url="/redoc" if docs_enabled else None,
        openapi_url="/openapi.json" if docs_enabled else None,
        lifespan=lifespan,
    )

    # --------------------------------------------------------------------------
    # Security Middleware: HTTP Security Headers
    # --------------------------------------------------------------------------
    class SecurityHeadersMiddleware(BaseHTTPMiddleware):
        async def dispatch(self, request: Request, call_next):
            response = await call_next(request)
            response.headers["X-Content-Type-Options"] = "nosniff"
            response.headers["X-Frame-Options"] = "DENY"
            response.headers["X-XSS-Protection"] = "1; mode=block"
            response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
            response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
            if settings.is_production:
                response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
            return response

    app.add_middleware(SecurityHeadersMiddleware)

    # --------------------------------------------------------------------------
    # Request Size Limiter
    # --------------------------------------------------------------------------
    app.add_middleware(RequestSizeLimitMiddleware, max_bytes=settings.MAX_PAYLOAD_BYTES)

    # --------------------------------------------------------------------------
    # CORS Configuration
    # --------------------------------------------------------------------------
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )

    # --------------------------------------------------------------------------
    # Global Exception Handlers (Prevent stack trace leak in responses)
    # --------------------------------------------------------------------------
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
            headers=getattr(exc, "headers", None),
        )

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        # Log error with privacy sanitization
        logger.error(f"Unhandled server error at {request.method} {request.url.path}: {str(exc)}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "detail": "An internal server error occurred. Please try again later.",
                "error": "InternalServerError",
            },
        )

    # --------------------------------------------------------------------------
    # Mount API Routers
    # --------------------------------------------------------------------------
    app.include_router(api_v1_router)

    return app


app = create_application()
