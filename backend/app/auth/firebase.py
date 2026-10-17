import os
from typing import Any

import firebase_admin
from fastapi import Depends, Header, HTTPException, status
from firebase_admin import auth, credentials

from app.config import Settings, get_settings
from app.security.logging import get_logger

logger = get_logger(__name__)

# Firebase App singleton state
_firebase_initialized = False


def initialize_firebase(settings: Settings | None = None) -> None:
    """
    Initializes Firebase Admin SDK using service account credentials or Application Default Credentials.
    Prevents duplicate initialization and securely isolates credentials.
    """
    global _firebase_initialized
    if _firebase_initialized or firebase_admin._apps:
        return

    if settings is None:
        settings = get_settings()

    try:
        if settings.FIREBASE_CREDENTIALS_PATH and os.path.exists(settings.FIREBASE_CREDENTIALS_PATH):
            cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
            firebase_admin.initialize_app(cred, {"projectId": settings.FIREBASE_PROJECT_ID})
            logger.info("Firebase Admin initialized via service account credentials file")
        elif settings.FIREBASE_PROJECT_ID:
            # Uses Application Default Credentials (ADC) / Workload Identity
            cred = credentials.ApplicationDefault() if "GOOGLE_APPLICATION_CREDENTIALS" in os.environ else None
            options = {"projectId": settings.FIREBASE_PROJECT_ID}
            if cred:
                firebase_admin.initialize_app(cred, options)
            else:
                firebase_admin.initialize_app(options=options)
            logger.info("Firebase Admin initialized via Application Default Credentials/Project ID")
        else:
            firebase_admin.initialize_app()
            logger.info("Firebase Admin initialized with default configuration")

        _firebase_initialized = True
    except Exception as e:
        logger.warning(f"Firebase Admin initialization deferred/failed: {str(e)}")


async def get_current_user(
    authorization: str | None = Header(None, alias="Authorization"),
    settings: Settings = Depends(get_settings),
) -> dict[str, Any]:
    """
    Dependency to verify Firebase ID token sent by React frontend in format:
    Authorization: Bearer <FIREBASE_ID_TOKEN>

    Returns:
        Dict containing verified user identity: {"uid": str, "email": str, "display_name": str}

    Raises:
        HTTP 401 Unauthorized for missing, malformed, expired, or invalid tokens.
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing. Please provide 'Bearer <token>'.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization format. Must be 'Bearer <Firebase_ID_TOKEN>'.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = parts[1].strip()

    # Isolated test mock support
    if settings.MOCK_AUTH_IN_TEST and token.startswith("mock_token_"):
        uid = token.replace("mock_token_", "")
        return {
            "uid": uid,
            "email": f"{uid}@example.com",
            "display_name": f"User {uid}",
        }

    try:
        # Verify token cryptographically and enforce revocation checks
        decoded_token = auth.verify_id_token(token, check_revoked=True)
        uid = decoded_token.get("uid")

        if not uid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token does not contain a valid user identity claim.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return {
            "uid": uid,
            "email": decoded_token.get("email"),
            "display_name": decoded_token.get("name"),
        }

    except auth.ExpiredIdTokenError as err:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Firebase ID token has expired. Please refresh the token on the client.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from err
    except auth.RevokedIdTokenError as err:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Firebase ID token has been revoked.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from err
    except auth.InvalidIdTokenError as err:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Firebase ID token.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from err
    except Exception as e:
        logger.warning(f"Token verification failed: {type(e).__name__}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed. Could not verify credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from e
