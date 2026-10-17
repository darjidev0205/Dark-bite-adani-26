from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.auth.firebase import get_current_user
from app.database import get_database
from app.schemas.user import UserPreferences, UserProfileResponse

router = APIRouter(tags=["User Profile"])


@router.get("/me", response_model=UserProfileResponse)
async def get_my_profile(
    current_user: dict[str, Any] = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Returns the authenticated user's profile and safe UI preferences.
    If the user record does not exist yet, a minimal record is provisioned automatically.
    """
    uid = current_user["uid"]
    email = current_user.get("email")
    display_name = current_user.get("display_name")
    now_dt = datetime.now(UTC)

    user_doc = await db.users.find_one({"firebase_uid": uid})

    if not user_doc:
        default_prefs = UserPreferences().model_dump()
        new_user = {
            "firebase_uid": uid,
            "email": email,
            "display_name": display_name,
            "preferences": default_prefs,
            "created_at": now_dt,
            "updated_at": now_dt,
        }
        await db.users.insert_one(new_user)
        user_doc = new_user
    else:
        # Update display_name / email if provided by latest Firebase token
        updates = {}
        if email and user_doc.get("email") != email:
            updates["email"] = email
        if display_name and user_doc.get("display_name") != display_name:
            updates["display_name"] = display_name
        if updates:
            updates["updated_at"] = now_dt
            await db.users.update_one({"firebase_uid": uid}, {"$set": updates})
            user_doc.update(updates)

    created_at_val = user_doc.get("created_at")
    created_at_str = created_at_val.isoformat() if isinstance(created_at_val, datetime) else str(created_at_val)

    updated_at_val = user_doc.get("updated_at")
    updated_at_str = updated_at_val.isoformat() if isinstance(updated_at_val, datetime) else str(updated_at_val)

    prefs = user_doc.get("preferences", {})
    return UserProfileResponse(
        firebase_uid=user_doc["firebase_uid"],
        email=user_doc.get("email"),
        display_name=user_doc.get("display_name"),
        preferences=UserPreferences(**prefs),
        created_at=created_at_str,
        updated_at=updated_at_str,
    )
