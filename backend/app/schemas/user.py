from pydantic import BaseModel, ConfigDict, Field


class UserPreferences(BaseModel):
    """
    Safe UI preferences only. No credentials or secrets.
    """
    model_config = ConfigDict(extra="forbid")

    theme: str = Field(default="dark", description="UI theme preference: dark or light")
    language: str = Field(default="en", description="UI language preference")
    enable_notifications: bool = Field(default=True, description="Safe UI alert toggle")


class UserProfileResponse(BaseModel):
    """
    User profile returned by GET /api/v1/me.
    """
    model_config = ConfigDict(extra="ignore")

    firebase_uid: str
    email: str | None = None
    display_name: str | None = None
    preferences: UserPreferences = Field(default_factory=UserPreferences)
    created_at: str
    updated_at: str
